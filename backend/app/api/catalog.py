from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.crud.catalog import (
    get_car_brands,
    get_car_models_by_brand,
    get_car_bodies_by_model,
    get_car_engines_by_model,
    get_part_brands,
    get_category_tree,
    get_parts,
    get_part_by_id,
    get_part_analogs,
)
from app.schemas.catalog import (
    CarBrandResponse,
    CarModelResponse,
    CarBodyResponse,
    CarEngineResponse,
    PartBrandResponse,
    CategoryTreeResponse,
    PartResponse,
    PartDetailResponse,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/car-brands", response_model=list[CarBrandResponse])
async def list_car_brands(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_car_brands(db)


@router.get("/car-brands/{car_brand_id}/models", response_model=list[CarModelResponse])
async def list_car_models(
    car_brand_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_car_models_by_brand(db, car_brand_id)


@router.get("/car-models/{car_model_id}/bodies", response_model=list[CarBodyResponse])
async def list_car_bodies(
    car_model_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_car_bodies_by_model(db, car_model_id)


@router.get("/car-models/{car_model_id}/engines", response_model=list[CarEngineResponse])
async def list_car_engines(
    car_model_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_car_engines_by_model(db, car_model_id)


@router.get("/part-brands", response_model=list[PartBrandResponse])
async def list_part_brands(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_part_brands(db)


@router.get("/categories", response_model=list[CategoryTreeResponse])
async def list_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await get_category_tree(db)


@router.get("/parts", response_model=list[PartResponse])
async def list_parts(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str | None = Query(None, min_length=1, max_length=100),
    car_brand_id: int | None = Query(None),
    car_model_id: int | None = Query(None),
    car_body_id: int | None = Query(None),
    car_engine_id: int | None = Query(None),
    part_brand_id: int | None = Query(None),
    category_id: int | None = Query(None),
):
    return await get_parts(
        db,
        q=q,
        car_brand_id=car_brand_id,
        car_model_id=car_model_id,
        car_body_id=car_body_id,
        car_engine_id=car_engine_id,
        part_brand_id=part_brand_id,
        category_id=category_id,
    )


@router.get("/parts/{part_id}", response_model=PartDetailResponse)
async def get_part(
    part_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    part = await get_part_by_id(db, part_id)
    if not part:
        raise HTTPException(404, "Запчасть не найдена")
    return part


@router.get("/parts/{part_id}/analogs", response_model=list[PartResponse])
async def list_part_analogs(
    part_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    part = await get_part_by_id(db, part_id)
    if not part:
        raise HTTPException(404, "Запчасть не найдена")
    return await get_part_analogs(db, part_id)
