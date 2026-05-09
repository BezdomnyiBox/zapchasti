import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCarBodies,
  getCarBrands,
  getCarEngines,
  getCarModels,
  getCategories,
  getPart,
  getPartAnalogs,
  getPartBrands,
} from "../services/catalog";
import type {
  CatalogCarBody,
  CatalogCarBrand,
  CatalogCarEngine,
  CatalogCarModel,
  CatalogCategory,
  CatalogPart,
  CatalogPartApplicability,
  CatalogPartBrand,
  CatalogPartDetail,
} from "../types/catalog";

type CategoryOption = { id: number; label: string };

const sectionCls = "app-card";
const termCls = "text-[color:var(--steel-light)] shrink-0 w-32";

function flattenCategories(items: CatalogCategory[], prefix = ""): CategoryOption[] {
  return items.flatMap((item) => {
    const label = prefix ? `${prefix} / ${item.name}` : item.name;
    return [
      { id: item.id, label },
      ...flattenCategories(item.children ?? [], label),
    ];
  });
}

function applyLabel(
  applicability: CatalogPartApplicability,
  brands: Map<number, string>,
  models: Map<number, string>,
  bodies: Map<number, string>,
  engines: Map<number, string>,
) {
  return [
    brands.get(applicability.car_brand_id),
    applicability.car_model_id ? models.get(applicability.car_model_id) : null,
    applicability.car_body_id ? bodies.get(applicability.car_body_id) : null,
    applicability.car_engine_id ? engines.get(applicability.car_engine_id) : null,
  ].filter(Boolean).join(" / ");
}

export default function CatalogPartDetail() {
  const { partId } = useParams<{ partId: string }>();
  const [searchParams] = useSearchParams();
  const [part, setPart] = useState<CatalogPartDetail | null>(null);
  const [analogs, setAnalogs] = useState<CatalogPart[]>([]);
  const [partBrands, setPartBrands] = useState<CatalogPartBrand[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [carBrands, setCarBrands] = useState<CatalogCarBrand[]>([]);
  const [carModels, setCarModels] = useState<CatalogCarModel[]>([]);
  const [carBodies, setCarBodies] = useState<CatalogCarBody[]>([]);
  const [carEngines, setCarEngines] = useState<CatalogCarEngine[]>([]);
  const [loading, setLoading] = useState(true);

  const partBrandById = useMemo(() => new Map(partBrands.map((brand) => [brand.id, brand.name])), [partBrands]);
  const categoryById = useMemo(() => new Map(flattenCategories(categories).map((category) => [category.id, category.label])), [categories]);
  const carBrandById = useMemo(() => new Map(carBrands.map((brand) => [brand.id, brand.name])), [carBrands]);
  const carModelById = useMemo(() => new Map(carModels.map((model) => [model.id, model.name])), [carModels]);
  const carBodyById = useMemo(() => new Map(carBodies.map((body) => [body.id, body.code])), [carBodies]);
  const carEngineById = useMemo(() => new Map(carEngines.map((engine) => [engine.id, engine.code])), [carEngines]);

  useEffect(() => {
    const id = Number(partId);
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }

    let mounted = true;
    async function load() {
      try {
        const [partData, analogList, brandList, categoryTree, carBrandList] = await Promise.all([
          getPart(id),
          getPartAnalogs(id),
          getPartBrands(),
          getCategories(),
          getCarBrands(),
        ]);
        if (!mounted) return;
        setPart(partData);
        setAnalogs(analogList);
        setPartBrands(brandList);
        setCategories(categoryTree);
        setCarBrands(carBrandList);

        const brandIds = Array.from(new Set(partData.applicability.map((item) => item.car_brand_id)));
        const modelLists = await Promise.all(brandIds.map((brandId) => getCarModels(brandId)));
        const models = modelLists.flat();
        const modelIds = Array.from(new Set(partData.applicability.map((item) => item.car_model_id).filter((value): value is number => value != null)));
        const [bodyLists, engineLists] = await Promise.all([
          Promise.all(modelIds.map((modelId) => getCarBodies(modelId))),
          Promise.all(modelIds.map((modelId) => getCarEngines(modelId))),
        ]);
        if (!mounted) return;
        setCarModels(models);
        setCarBodies(bodyLists.flat());
        setCarEngines(engineLists.flat());
      } catch {
        toast.error("Не удалось загрузить карточку запчасти");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [partId]);

  const catalogBack = searchParams.toString() ? `/catalog?${searchParams.toString()}` : "/catalog";

  if (loading) {
    return <div className="auth-shell text-[color:var(--steel-light)]">Загрузка…</div>;
  }

  if (!part) {
    return (
      <div className="auth-shell">
        <div className="app-card text-center">
          <p className="text-[color:var(--steel-light)] mb-3">Запчасть не найдена</p>
          <Link to="/catalog" className="app-btn-secondary">Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link to="/client" className="app-brand" aria-label="Саха Запчасти">
            <span className="app-brand-mark">СЗ</span>
            САХА ЗАПЧАСТИ
          </Link>
          <nav className="app-nav" aria-label="Навигация карточки запчасти">
            <Link to={catalogBack}>Каталог</Link>
            <Link to="/client">Мои заказы</Link>
            <Link to="/client/new" className="app-btn-primary">Новый заказ</Link>
          </nav>
        </div>
      </header>

      <main className="app-page">
        <Link to={catalogBack} className="app-btn-ghost">
          ← Назад в каталог
        </Link>

        <section className="app-hero mt-5">
          <div>
            <div className="app-kicker">Карточка запчасти</div>
            <h1 className="app-title">{part.name}</h1>
            <p className="app-subtitle">Артикул: {part.article}</p>
          </div>
          <button disabled className="app-btn-secondary cursor-not-allowed opacity-60">
            Корзина скоро
          </button>
        </section>

        <div className="app-grid app-section">
          <section className={sectionCls}>
            <h2 className="app-section-title mb-3">Основное</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className={termCls}>Бренд:</dt>
                <dd>{part.part_brand.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className={termCls}>Категория:</dt>
                <dd>{categoryById.get(part.category_id) ?? part.category.name}</dd>
              </div>
            </dl>
          </section>

          <section className={sectionCls}>
            <h2 className="app-section-title mb-3">Применимость</h2>
            {part.applicability.length === 0 ? (
              <p className="text-sm text-[color:var(--steel-light)]">Данные о применимости пока не указаны</p>
            ) : (
              <ul className="space-y-2">
                {part.applicability.map((item) => (
                  <li key={item.id} className="text-sm">
                    {applyLabel(item, carBrandById, carModelById, carBodyById, carEngineById) || "Неизвестная применимость"}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={sectionCls}>
            <h2 className="app-section-title mb-3">Аналоги / кроссы</h2>
            {analogs.length === 0 ? (
              <p className="text-sm text-[color:var(--steel-light)]">Аналоги пока не указаны</p>
            ) : (
              <div className="space-y-2">
                {analogs.map((analog) => (
                  <Link
                    key={analog.id}
                    to={`/catalog/parts/${analog.id}`}
                    className="app-product-card"
                  >
                    <p className="app-product-title text-sm">{analog.name}</p>
                    <p className="app-product-meta text-xs">
                      {partBrandById.get(analog.part_brand_id) ?? `#${analog.part_brand_id}`} · {analog.article} · {categoryById.get(analog.category_id) ?? `#${analog.category_id}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
