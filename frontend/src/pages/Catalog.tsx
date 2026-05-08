import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
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
  "w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 transition";
const btnCls =
  "py-3 px-4 rounded-xl font-medium text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:opacity-60 disabled:cursor-not-allowed transition";

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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Каталог запчастей</h1>
          <Link to="/client" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
            Мои заказы
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 md:p-6 mb-6">
          <form onSubmit={submitSearch} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mb-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию или артикулу"
              className={inputCls}
            />
            <button type="submit" className={btnCls}>Найти</button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

          <button type="button" onClick={resetFilters} className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition">
            Сбросить фильтры
          </button>
        </section>

        {loadingParts && <p className="text-slate-500 dark:text-slate-400 text-center mt-8">Загрузка…</p>}
        {!loadingParts && parts.length === 0 && (
          <p className="text-slate-500 dark:text-slate-400 text-center mt-12">Запчасти не найдены</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {parts.map((part) => (
            <Link
              key={part.id}
              to={`/catalog/parts/${part.id}?${searchParams.toString()}`}
              className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition"
            >
              <p className="font-medium text-slate-800 dark:text-slate-100">{part.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Артикул: {part.article}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Бренд: {brandById.get(part.part_brand_id) ?? `#${part.part_brand_id}`}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Категория: {categoryById.get(part.category_id) ?? `#${part.category_id}`}
              </p>
              <span className="mt-3 inline-flex px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed">
                Корзина скоро
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
