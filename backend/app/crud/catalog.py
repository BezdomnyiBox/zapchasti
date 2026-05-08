from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

from app.models.catalog import (
    CarBrand,
    CarModel,
    CarBody,
    CarEngine,
    PartBrand,
    Category,
    Part,
    PartApplicability,
    PartAnalog,
)
from app.schemas.catalog import CategoryTreeResponse


async def get_car_brands(db: AsyncSession) -> list[CarBrand]:
    result = await db.execute(select(CarBrand).order_by(CarBrand.name))
    return list(result.scalars().all())


async def get_car_models_by_brand(
    db: AsyncSession, car_brand_id: int,
) -> list[CarModel]:
    result = await db.execute(
        select(CarModel)
        .where(CarModel.car_brand_id == car_brand_id)
        .order_by(CarModel.name)
    )
    return list(result.scalars().all())


async def get_car_bodies_by_model(
    db: AsyncSession, car_model_id: int,
) -> list[CarBody]:
    result = await db.execute(
        select(CarBody)
        .where(CarBody.car_model_id == car_model_id)
        .order_by(CarBody.code)
    )
    return list(result.scalars().all())


async def get_car_engines_by_model(
    db: AsyncSession, car_model_id: int,
) -> list[CarEngine]:
    result = await db.execute(
        select(CarEngine)
        .where(CarEngine.car_model_id == car_model_id)
        .order_by(CarEngine.code)
    )
    return list(result.scalars().all())


async def get_part_brands(db: AsyncSession) -> list[PartBrand]:
    result = await db.execute(select(PartBrand).order_by(PartBrand.name))
    return list(result.scalars().all())


async def get_category_tree(db: AsyncSession) -> list[CategoryTreeResponse]:
    result = await db.execute(
        select(Category).order_by(Category.parent_id, Category.name)
    )
    categories = list(result.scalars().all())
    nodes = {
        category.id: CategoryTreeResponse.model_validate(category)
        for category in categories
    }
    roots: list[CategoryTreeResponse] = []
    for category in categories:
        node = nodes[category.id]
        if category.parent_id is None:
            roots.append(node)
            continue
        parent = nodes.get(category.parent_id)
        if parent:
            parent.children.append(node)
    return roots


async def validate_part_applicability_scope(
    db: AsyncSession,
    car_brand_id: int,
    car_model_id: int | None = None,
    car_body_id: int | None = None,
    car_engine_id: int | None = None,
) -> None:
    if (car_body_id is not None or car_engine_id is not None) and car_model_id is None:
        raise ValueError("Кузов или двигатель нельзя указать без модели автомобиля")

    brand_exists = await db.scalar(select(CarBrand.id).where(CarBrand.id == car_brand_id))
    if brand_exists is None:
        raise ValueError("Марка автомобиля не найдена")

    if car_model_id is not None:
        model_brand_id = await db.scalar(
            select(CarModel.car_brand_id).where(CarModel.id == car_model_id)
        )
        if model_brand_id is None:
            raise ValueError("Модель автомобиля не найдена")
        if model_brand_id != car_brand_id:
            raise ValueError("Модель автомобиля не принадлежит выбранной марке")

    if car_body_id is not None:
        body_model_id = await db.scalar(
            select(CarBody.car_model_id).where(CarBody.id == car_body_id)
        )
        if body_model_id is None:
            raise ValueError("Кузов автомобиля не найден")
        if body_model_id != car_model_id:
            raise ValueError("Кузов автомобиля не принадлежит выбранной модели")

    if car_engine_id is not None:
        engine_model_id = await db.scalar(
            select(CarEngine.car_model_id).where(CarEngine.id == car_engine_id)
        )
        if engine_model_id is None:
            raise ValueError("Двигатель автомобиля не найден")
        if engine_model_id != car_model_id:
            raise ValueError("Двигатель автомобиля не принадлежит выбранной модели")


async def _resolve_vehicle_scope(
    db: AsyncSession,
    car_brand_id: int | None,
    car_model_id: int | None,
    car_body_id: int | None,
    car_engine_id: int | None,
) -> tuple[int | None, int | None] | None:
    resolved_brand_id = car_brand_id
    resolved_model_id = car_model_id

    if car_body_id is not None:
        body_model_id = await db.scalar(
            select(CarBody.car_model_id).where(CarBody.id == car_body_id)
        )
        if body_model_id is None:
            return None
        if resolved_model_id is not None and resolved_model_id != body_model_id:
            return None
        resolved_model_id = body_model_id

    if car_engine_id is not None:
        engine_model_id = await db.scalar(
            select(CarEngine.car_model_id).where(CarEngine.id == car_engine_id)
        )
        if engine_model_id is None:
            return None
        if resolved_model_id is not None and resolved_model_id != engine_model_id:
            return None
        resolved_model_id = engine_model_id

    if resolved_model_id is not None:
        model_brand_id = await db.scalar(
            select(CarModel.car_brand_id).where(CarModel.id == resolved_model_id)
        )
        if model_brand_id is None:
            return None
        if resolved_brand_id is not None and resolved_brand_id != model_brand_id:
            return None
        resolved_brand_id = model_brand_id

    return resolved_brand_id, resolved_model_id


async def get_parts(
    db: AsyncSession,
    q: str | None = None,
    car_brand_id: int | None = None,
    car_model_id: int | None = None,
    car_body_id: int | None = None,
    car_engine_id: int | None = None,
    part_brand_id: int | None = None,
    category_id: int | None = None,
) -> list[Part]:
    query = select(Part).order_by(Part.name, Part.article)

    if q:
        search = f"%{q.strip()}%"
        query = query.where(or_(Part.name.ilike(search), Part.article.ilike(search)))
    if part_brand_id is not None:
        query = query.where(Part.part_brand_id == part_brand_id)
    if category_id is not None:
        query = query.where(Part.category_id == category_id)

    has_vehicle_filter = any(
        value is not None
        for value in (car_brand_id, car_model_id, car_body_id, car_engine_id)
    )
    if has_vehicle_filter:
        vehicle_scope = await _resolve_vehicle_scope(
            db, car_brand_id, car_model_id, car_body_id, car_engine_id,
        )
        if vehicle_scope is None:
            return []
        resolved_brand_id, resolved_model_id = vehicle_scope
        query = query.join(PartApplicability).distinct()
        if resolved_brand_id is not None:
            query = query.where(PartApplicability.car_brand_id == resolved_brand_id)
        if resolved_model_id is not None:
            query = query.where(
                or_(
                    PartApplicability.car_model_id.is_(None),
                    PartApplicability.car_model_id == resolved_model_id,
                )
            )
        if car_body_id is not None:
            query = query.where(
                or_(
                    PartApplicability.car_body_id.is_(None),
                    PartApplicability.car_body_id == car_body_id,
                )
            )
        if car_engine_id is not None:
            query = query.where(
                or_(
                    PartApplicability.car_engine_id.is_(None),
                    PartApplicability.car_engine_id == car_engine_id,
                )
            )

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_part_by_id(db: AsyncSession, part_id: int) -> Part | None:
    result = await db.execute(
        select(Part)
        .options(
            selectinload(Part.part_brand),
            selectinload(Part.category),
            selectinload(Part.applicability),
        )
        .where(Part.id == part_id)
    )
    return result.scalars().one_or_none()


async def get_part_analogs(db: AsyncSession, part_id: int) -> list[Part]:
    analog = aliased(Part)
    result = await db.execute(
        select(analog)
        .join(
            PartAnalog,
            or_(
                and_(PartAnalog.part_id == part_id, PartAnalog.analog_part_id == analog.id),
                and_(PartAnalog.analog_part_id == part_id, PartAnalog.part_id == analog.id),
            ),
        )
        .order_by(analog.name, analog.article)
    )
    return list(result.scalars().all())
