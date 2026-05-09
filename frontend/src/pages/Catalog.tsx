import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../hooks/useCart";
import {
  getCarBodies,
  getCarBrands,
  getCarEngines,
  getCarModels,
  getCategories,
  getPartBrands,
  getParts,
} from "../services/catalog";
import type {
  CatalogCarBody,
  CatalogCarBrand,
  CatalogCarEngine,
  CatalogCarModel,
  CatalogCategory,
  CatalogPart,
  CatalogPartBrand,
  CatalogPartFilters,
} from "../types/catalog";

type CategoryOption = { id: number; label: string };

const inputCls =
  "app-input";
const btnCls =
  "app-btn-primary disabled:opacity-60 disabled:cursor-not-allowed";

function paramNumber(searchParams: URLSearchParams, key: string): number | undefined {
  const value = searchParams.get(key);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function flattenCategories(items: CatalogCategory[], prefix = ""): CategoryOption[] {
  return items.flatMap((item) => {
    const label = prefix ? `${prefix} / ${item.name}` : item.name;
    return [
      { id: item.id, label },
      ...flattenCategories(item.children ?? [], label),
    ];
  });
}

function setParam(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [brands, setBrands] = useState<CatalogCarBrand[]>([]);
  const [models, setModels] = useState<CatalogCarModel[]>([]);
  const [bodies, setBodies] = useState<CatalogCarBody[]>([]);
  const [engines, setEngines] = useState<CatalogCarEngine[]>([]);
  const [partBrands, setPartBrands] = useState<CatalogPartBrand[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [parts, setParts] = useState<CatalogPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingParts, setLoadingParts] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const { add } = useCart();
  const [addingPartId, setAddingPartId] = useState<number | null>(null);
  const [unavailableParts, setUnavailableParts] = useState<Set<number>>(new Set());

  const carBrandId = paramNumber(searchParams, "car_brand_id");
  const carModelId = paramNumber(searchParams, "car_model_id");
  const carBodyId = paramNumber(searchParams, "car_body_id");
  const carEngineId = paramNumber(searchParams, "car_engine_id");
  const partBrandId = paramNumber(searchParams, "part_brand_id");
  const categoryId = paramNumber(searchParams, "category_id");

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);
  const brandById = useMemo(() => new Map(partBrands.map((brand) => [brand.id, brand.name])), [partBrands]);
  const categoryById = useMemo(() => new Map(categoryOptions.map((category) => [category.id, category.label])), [categoryOptions]);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCarBrands(), getPartBrands(), getCategories()])
      .then(([carBrands, partBrandList, categoryTree]) => {
        if (!mounted) return;
        setBrands(carBrands);
        setPartBrands(partBrandList);
        setCategories(categoryTree);
      })
      .catch(() => toast.error("Не удалось загрузить справочники каталога"))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!carBrandId) {
      return;
    }
    getCarModels(carBrandId)
      .then(setModels)
      .catch(() => toast.error("Не удалось загрузить модели"));
  }, [carBrandId]);

  useEffect(() => {
    if (!carModelId) {
      return;
    }
    Promise.all([getCarBodies(carModelId), getCarEngines(carModelId)])
      .then(([bodyList, engineList]) => {
        setBodies(bodyList);
        setEngines(engineList);
      })
      .catch(() => toast.error("Не удалось загрузить кузова и двигатели"));
  }, [carModelId]);

  useEffect(() => {
    const filters: CatalogPartFilters = {
      q: searchParams.get("q") || undefined,
      car_brand_id: carBrandId,
      car_model_id: carModelId,
      car_body_id: carBodyId,
      car_engine_id: carEngineId,
      part_brand_id: partBrandId,
      category_id: categoryId,
    };
    getParts(filters)
      .then(setParts)
      .catch(() => toast.error("Не удалось загрузить запчасти"))
      .finally(() => setLoadingParts(false));
  }, [carBodyId, carBrandId, carEngineId, carModelId, categoryId, partBrandId, searchParams]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    setParam(next, key, value);
    if (key === "car_brand_id") {
      setModels([]);
      setBodies([]);
      setEngines([]);
      next.delete("car_model_id");
      next.delete("car_body_id");
      next.delete("car_engine_id");
    }
    if (key === "car_model_id") {
      setBodies([]);
      setEngines([]);
      next.delete("car_body_id");
      next.delete("car_engine_id");
    }
    setLoadingParts(true);
    setSearchParams(next);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    setParam(next, "q", query.trim());
    setLoadingParts(true);
    setSearchParams(next);
  };

  const resetFilters = () => {
    setQuery("");
    setModels([]);
    setBodies([]);
    setEngines([]);
    setLoadingParts(true);
    setSearchParams({});
  };

  const handleAddToCart = async (partId: number) => {
    setAddingPartId(partId);
    try {
      await add(partId, 1);
      toast.success("Запчасть добавлена в корзину");
    } catch (err: unknown) {
      const detail = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;
      const message = typeof detail === "string" ? detail : "Не удалось добавить в корзину";
      if (typeof detail === "string" && detail.toLowerCase().includes("нет предлож")) {
        setUnavailableParts((prev) => new Set(prev).add(partId));
      }
      toast.error(message);
    } finally {
      setAddingPartId(null);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <Link to="/client" className="app-brand" aria-label="Саха Запчасти">
            <span className="app-brand-mark">СЗ</span>
            САХА ЗАПЧАСТИ
          </Link>
          <nav className="app-nav" aria-label="Навигация каталога">
            <Link to="/client">Мои заказы</Link>
            <Link to="/client/new" className="app-btn-primary">Новый заказ</Link>
          </nav>
        </div>
      </header>

      <main className="app-page">
        <section className="app-hero">
          <div>
            <div className="app-kicker">Каталог</div>
            <h1 className="app-title">Каталог запчастей</h1>
            <p className="app-subtitle">
              Используйте поиск и фильтры по автомобилю, бренду запчасти и категории.
            </p>
          </div>
          <div className="app-actions">
            <Link to="/client" className="app-btn-secondary">К заказам</Link>
            <Link to="/cart" className="app-btn-primary">Корзина</Link>
          </div>
        </section>

        <section className="app-form-card app-section">
          <form onSubmit={submitSearch} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию или артикулу"
              className={inputCls}
            />
            <button type="submit" className={btnCls}>Найти</button>
          </form>

          <div className="app-filter-grid">
            <select value={carBrandId ?? ""} onChange={(event) => updateFilter("car_brand_id", event.target.value)} className={inputCls} disabled={loading}>
              <option value="">Марка автомобиля</option>
              {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
            <select value={carModelId ?? ""} onChange={(event) => updateFilter("car_model_id", event.target.value)} className={inputCls} disabled={!carBrandId}>
              <option value="">Модель автомобиля</option>
              {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
            </select>
            <select value={carBodyId ?? ""} onChange={(event) => updateFilter("car_body_id", event.target.value)} className={inputCls} disabled={!carModelId}>
              <option value="">Кузов / body code</option>
              {bodies.map((body) => <option key={body.id} value={body.id}>{body.code}</option>)}
            </select>
            <select value={carEngineId ?? ""} onChange={(event) => updateFilter("car_engine_id", event.target.value)} className={inputCls} disabled={!carModelId}>
              <option value="">Двигатель</option>
              {engines.map((engine) => <option key={engine.id} value={engine.id}>{engine.code}</option>)}
            </select>
            <select value={partBrandId ?? ""} onChange={(event) => updateFilter("part_brand_id", event.target.value)} className={inputCls} disabled={loading}>
              <option value="">Бренд запчасти</option>
              {partBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
            <select value={categoryId ?? ""} onChange={(event) => updateFilter("category_id", event.target.value)} className={inputCls} disabled={loading}>
              <option value="">Категория</option>
              {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
            </select>
          </div>

          <button type="button" onClick={resetFilters} className="mt-4 app-btn-ghost">
            Сбросить фильтры
          </button>
        </section>

        {loadingParts && <p className="text-[color:var(--steel-light)] text-center mt-8">Загрузка…</p>}
        {!loadingParts && parts.length === 0 && (
          <div className="app-card text-center app-section">
            <h2 className="app-section-title">Запчасти не найдены</h2>
            <p className="app-section-note">Попробуйте изменить фильтры или создать ручную заявку.</p>
            <Link to="/client/new" className="app-btn-secondary mt-4">Создать заказ</Link>
          </div>
        )}

        <div className="app-grid app-grid-2 app-section">
          {parts.map((part) => (
            <article key={part.id} className="app-product-card">
              <Link to={`/catalog/parts/${part.id}?${searchParams.toString()}`} className="block">
              <p className="app-product-title">{part.name}</p>
              <p className="app-product-meta">Артикул: {part.article}</p>
              <p className="app-product-meta">
                Бренд: {brandById.get(part.part_brand_id) ?? `#${part.part_brand_id}`}
              </p>
              <p className="app-product-meta">
                Категория: {categoryById.get(part.category_id) ?? `#${part.category_id}`}
              </p>
              </Link>
              <button
                type="button"
                onClick={() => void handleAddToCart(part.id)}
                disabled={addingPartId === part.id || unavailableParts.has(part.id)}
                className="app-btn-secondary mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {unavailableParts.has(part.id) ? "Нет предложения" : addingPartId === part.id ? "Добавление…" : "Добавить в корзину"}
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
