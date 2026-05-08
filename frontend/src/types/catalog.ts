export interface CatalogCarBrand {
  id: number;
  name: string;
}

export interface CatalogCarModel {
  id: number;
  car_brand_id: number;
  name: string;
}

export interface CatalogCarBody {
  id: number;
  car_model_id: number;
  code: string;
}

export interface CatalogCarEngine {
  id: number;
  car_model_id: number;
  code: string;
}

export interface CatalogPartBrand {
  id: number;
  name: string;
}

export interface CatalogCategory {
  id: number;
  parent_id: number | null;
  name: string;
  children?: CatalogCategory[];
}

export interface CatalogPart {
  id: number;
  part_brand_id: number;
  category_id: number;
  article: string;
  name: string;
}

export interface CatalogPartApplicability {
  id: number;
  part_id: number;
  car_brand_id: number;
  car_model_id: number | null;
  car_body_id: number | null;
  car_engine_id: number | null;
}

export interface CatalogPartAnalog {
  part_id: number;
  analog_part_id: number;
}

export interface CatalogPartDetail extends CatalogPart {
  part_brand: CatalogPartBrand;
  category: CatalogCategory;
  applicability: CatalogPartApplicability[];
}

export interface CatalogPartFilters {
  q?: string;
  car_brand_id?: number;
  car_model_id?: number;
  car_body_id?: number;
  car_engine_id?: number;
  part_brand_id?: number;
  category_id?: number;
}
