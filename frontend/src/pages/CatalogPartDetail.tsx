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

const sectionCls = "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5";
const termCls = "text-slate-500 dark:text-slate-400 shrink-0 w-32";

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
    return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500">Загрузка…</div>;
  }

  if (!part) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-3">Запчасть не найдена</p>
          <Link to="/catalog" className="text-sm text-slate-600 dark:text-slate-300 hover:underline">Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link to={catalogBack} className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
          &larr; Назад в каталог
        </Link>

        <div className="flex items-start justify-between gap-4 mt-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{part.name}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Артикул: {part.article}</p>
          </div>
          <button disabled className="px-4 py-2 rounded-xl font-medium bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed">
            Корзина скоро
          </button>
        </div>

        <div className="space-y-4">
          <section className={sectionCls}>
            <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-3">Основное</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className={termCls}>Бренд:</dt>
                <dd className="text-slate-800 dark:text-slate-200">{part.part_brand.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className={termCls}>Категория:</dt>
                <dd className="text-slate-800 dark:text-slate-200">{categoryById.get(part.category_id) ?? part.category.name}</dd>
              </div>
            </dl>
          </section>

          <section className={sectionCls}>
            <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-3">Применимость</h2>
            {part.applicability.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Данные о применимости пока не указаны</p>
            ) : (
              <ul className="space-y-2">
                {part.applicability.map((item) => (
                  <li key={item.id} className="text-sm text-slate-700 dark:text-slate-300">
                    {applyLabel(item, carBrandById, carModelById, carBodyById, carEngineById) || "Неизвестная применимость"}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={sectionCls}>
            <h2 className="font-medium text-slate-800 dark:text-slate-100 mb-3">Аналоги / кроссы</h2>
            {analogs.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Аналоги пока не указаны</p>
            ) : (
              <div className="space-y-2">
                {analogs.map((analog) => (
                  <Link
                    key={analog.id}
                    to={`/catalog/parts/${analog.id}`}
                    className="block rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{analog.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {partBrandById.get(analog.part_brand_id) ?? `#${analog.part_brand_id}`} · {analog.article} · {categoryById.get(analog.category_id) ?? `#${analog.category_id}`}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
