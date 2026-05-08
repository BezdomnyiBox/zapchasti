import { api } from "./api";
import type {
  CatalogCarBody,
  CatalogCarBrand,
  CatalogCarEngine,
  CatalogCarModel,
  CatalogCategory,
  CatalogPart,
  CatalogPartBrand,
  CatalogPartDetail,
  CatalogPartFilters,
} from "../types/catalog";

function compactParams(params: CatalogPartFilters) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export async function getCarBrands(): Promise<CatalogCarBrand[]> {
  const { data } = await api.get<CatalogCarBrand[]>("/catalog/car-brands");
  return data;
}

export async function getCarModels(carBrandId: number): Promise<CatalogCarModel[]> {
  const { data } = await api.get<CatalogCarModel[]>(`/catalog/car-brands/${carBrandId}/models`);
  return data;
}

export async function getCarBodies(carModelId: number): Promise<CatalogCarBody[]> {
  const { data } = await api.get<CatalogCarBody[]>(`/catalog/car-models/${carModelId}/bodies`);
  return data;
}

export async function getCarEngines(carModelId: number): Promise<CatalogCarEngine[]> {
  const { data } = await api.get<CatalogCarEngine[]>(`/catalog/car-models/${carModelId}/engines`);
  return data;
}

export async function getPartBrands(): Promise<CatalogPartBrand[]> {
  const { data } = await api.get<CatalogPartBrand[]>("/catalog/part-brands");
  return data;
}

export async function getCategories(): Promise<CatalogCategory[]> {
  const { data } = await api.get<CatalogCategory[]>("/catalog/categories");
  return data;
}

export async function getParts(params: CatalogPartFilters = {}): Promise<CatalogPart[]> {
  const { data } = await api.get<CatalogPart[]>("/catalog/parts", {
    params: compactParams(params),
  });
  return data;
}

export async function getPart(partId: number): Promise<CatalogPartDetail> {
  const { data } = await api.get<CatalogPartDetail>(`/catalog/parts/${partId}`);
  return data;
}

export async function getPartAnalogs(partId: number): Promise<CatalogPart[]> {
  const { data } = await api.get<CatalogPart[]>(`/catalog/parts/${partId}/analogs`);
  return data;
}
