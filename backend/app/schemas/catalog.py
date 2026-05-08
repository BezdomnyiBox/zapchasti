from __future__ import annotations

from pydantic import BaseModel, Field


class CarBrandResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class CarModelResponse(BaseModel):
    id: int
    car_brand_id: int
    name: str

    model_config = {"from_attributes": True}


class CarBodyResponse(BaseModel):
    id: int
    car_model_id: int
    code: str

    model_config = {"from_attributes": True}


class CarEngineResponse(BaseModel):
    id: int
    car_model_id: int
    code: str

    model_config = {"from_attributes": True}


class PartBrandResponse(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class CategoryResponse(BaseModel):
    id: int
    parent_id: int | None
    name: str

    model_config = {"from_attributes": True}


class CategoryTreeResponse(CategoryResponse):
    children: list["CategoryTreeResponse"] = Field(default_factory=list)


class PartResponse(BaseModel):
    id: int
    part_brand_id: int
    category_id: int
    article: str
    name: str

    model_config = {"from_attributes": True}


class PartApplicabilityResponse(BaseModel):
    id: int
    part_id: int
    car_brand_id: int
    car_model_id: int | None
    car_body_id: int | None
    car_engine_id: int | None

    model_config = {"from_attributes": True}


class PartAnalogResponse(BaseModel):
    part_id: int
    analog_part_id: int

    model_config = {"from_attributes": True}


class PartBrandCategoryResponse(BaseModel):
    part_brand_id: int
    category_id: int

    model_config = {"from_attributes": True}


class PartDetailResponse(PartResponse):
    part_brand: PartBrandResponse
    category: CategoryResponse
    applicability: list[PartApplicabilityResponse] = Field(default_factory=list)
