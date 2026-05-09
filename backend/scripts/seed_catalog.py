"""Seed MVP catalog data.

Run from the backend directory:
    python scripts/seed_catalog.py
"""
from __future__ import annotations

import asyncio
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import AsyncSessionLocal, engine  # noqa: E402
from app.models.cart import PartOffer  # noqa: E402
from app.models.catalog import (  # noqa: E402
    CarBody,
    CarBrand,
    CarEngine,
    CarModel,
    Category,
    Part,
    PartAnalog,
    PartApplicability,
    PartBrand,
    PartBrandCategory,
)

Stats = Counter[str]


CAR_CATALOG: dict[str, dict[str, dict[str, list[str]]]] = {
    "Toyota": {
        "Camry": {"bodies": ["XV50", "XV70"], "engines": ["2AR-FE", "A25A-FKS"]},
        "Corolla": {"bodies": ["E170", "E210"], "engines": ["1ZR-FE", "2ZR-FE"]},
        "Land Cruiser": {"bodies": ["J200", "J300"], "engines": ["1VD-FTV", "V35A-FTS"]},
    },
    "Nissan": {
        "X-Trail": {"bodies": ["T32", "T33"], "engines": ["MR20DD", "QR25DE"]},
        "Qashqai": {"bodies": ["J11", "J12"], "engines": ["MR20DD", "HR13DDT"]},
        "Teana": {"bodies": ["J32", "L33"], "engines": ["VQ25DE", "QR25DE"]},
    },
    "Honda": {
        "Civic": {"bodies": ["FC", "FE"], "engines": ["L15B7", "R18A"]},
        "CR-V": {"bodies": ["RM", "RW"], "engines": ["K24W", "L15B"]},
        "Accord": {"bodies": ["CU", "CV"], "engines": ["K24Z3", "L15BE"]},
    },
    "BMW": {
        "3 Series": {"bodies": ["F30", "G20"], "engines": ["B48", "B58"]},
        "5 Series": {"bodies": ["F10", "G30"], "engines": ["N20", "B47"]},
    },
    "Mercedes-Benz": {
        "C-Class": {"bodies": ["W205", "W206"], "engines": ["M274", "M254"]},
        "E-Class": {"bodies": ["W213", "W214"], "engines": ["M264", "OM654"]},
    },
}

PART_BRANDS = [
    "Toyota",
    "Nissan",
    "Honda",
    "Bosch",
    "Denso",
    "KYB",
    "Febest",
    "NGK",
    "Mahle",
    "Lemforder",
]

CATEGORY_TREE = {
    "Запчасти": {
        "Двигатель": ["Свечи зажигания", "Ремни", "Прокладки"],
        "Фильтры": ["Масляные фильтры", "Воздушные фильтры", "Салонные фильтры"],
        "Подвеска": ["Амортизаторы", "Рычаги", "Сайлентблоки"],
        "Тормозная система": ["Колодки", "Диски", "Датчики ABS"],
        "Электрика": ["Датчики", "Катушки зажигания", "Лампы"],
        "Кузовные детали": ["Бамперы", "Крылья", "Фары"],
        "Масла и жидкости": ["Моторное масло", "Антифриз", "Тормозная жидкость"],
    }
}

PARTS = [
    ("Toyota", "Фильтры", "04152-YZZA1", "Фильтр масляный Toyota"),
    ("Denso", "Свечи зажигания", "K20HR-U11", "Свеча зажигания Denso"),
    ("KYB", "Амортизаторы", "339023", "Стойка амортизатора передняя"),
    ("Febest", "Сайлентблоки", "TAB-ACA30", "Сайлентблок рычага"),
    ("Bosch", "Колодки", "0986494427", "Колодки тормозные передние"),
    ("NGK", "Свечи зажигания", "ILKAR7B11", "Свеча зажигания NGK"),
    ("Mahle", "Воздушные фильтры", "LX2792", "Фильтр воздушный Mahle"),
    ("Lemforder", "Рычаги", "3671301", "Рычаг подвески передний"),
    ("Nissan", "Фильтры", "15208-65F0A", "Фильтр масляный Nissan"),
    ("Honda", "Фильтры", "15400-RTA-003", "Фильтр масляный Honda"),
    ("Bosch", "Датчики ABS", "0265007929", "Датчик ABS передний"),
    ("Denso", "Датчики", "DOX-0109", "Датчик кислородный"),
    ("KYB", "Амортизаторы", "341322", "Амортизатор задний"),
    ("Febest", "Рычаги", "0124-ACA30LH", "Рычаг передний левый"),
    ("Mahle", "Салонные фильтры", "LAK865", "Фильтр салона угольный"),
    ("NGK", "Катушки зажигания", "U5166", "Катушка зажигания"),
    ("Toyota", "Ремни", "90916-02671", "Ремень приводной Toyota"),
    ("Nissan", "Ремни", "11720-ED00A", "Ремень приводной Nissan"),
    ("Honda", "Ремни", "38920-RNA-A03", "Ремень приводной Honda"),
    ("Bosch", "Диски", "0986479B95", "Диск тормозной передний"),
    ("Denso", "Воздушные фильтры", "DMA-0112", "Фильтр воздушный Denso"),
    ("KYB", "Амортизаторы", "334337", "Стойка амортизатора левая"),
    ("Febest", "Сайлентблоки", "NAB-J10", "Сайлентблок заднего рычага"),
    ("Mahle", "Масляные фильтры", "OC617", "Фильтр масляный Mahle"),
    ("Lemforder", "Сайлентблоки", "3538501", "Сайлентблок стабилизатора"),
    ("Toyota", "Прокладки", "11213-0H010", "Прокладка клапанной крышки"),
    ("Nissan", "Прокладки", "13270-EN200", "Прокладка клапанной крышки"),
    ("Honda", "Прокладки", "12341-RNA-A00", "Прокладка клапанной крышки"),
    ("Bosch", "Лампы", "1987301026", "Лампа H7 Bosch"),
    ("Denso", "Свечи зажигания", "FK20HR11", "Свеча иридиевая Denso"),
    ("KYB", "Амортизаторы", "349084", "Амортизатор задний газовый"),
    ("Febest", "Рычаги", "0224-J10RH", "Рычаг подвески правый"),
    ("Mahle", "Воздушные фильтры", "LX3079", "Фильтр воздушный двигателя"),
    ("NGK", "Свечи зажигания", "LZKAR6AP-11", "Свеча платиновая NGK"),
    ("Lemforder", "Рычаги", "3717201", "Рычаг подвески нижний"),
    ("Bosch", "Датчики", "0261230289", "Датчик давления наддува"),
]


async def get_or_create(
    session: AsyncSession,
    model: type[Any],
    stats: Stats,
    defaults: dict[str, Any] | None = None,
    **lookup: Any,
) -> Any:
    result = await session.execute(select(model).filter_by(**lookup))
    instance = result.scalars().one_or_none()
    key = model.__tablename__
    if instance:
        stats[f"{key}_found"] += 1
        return instance

    instance = model(**lookup, **(defaults or {}))
    session.add(instance)
    await session.flush()
    stats[f"{key}_created"] += 1
    return instance


async def seed_cars(session: AsyncSession, stats: Stats) -> dict[str, Any]:
    data: dict[str, Any] = {"brands": {}, "models": {}, "bodies": {}, "engines": {}}
    for brand_name, models in CAR_CATALOG.items():
        brand = await get_or_create(session, CarBrand, stats, name=brand_name)
        data["brands"][brand_name] = brand
        for model_name, config in models.items():
            model = await get_or_create(
                session, CarModel, stats, car_brand_id=brand.id, name=model_name,
            )
            data["models"][(brand_name, model_name)] = model
            for body_code in config["bodies"]:
                body = await get_or_create(
                    session, CarBody, stats, car_model_id=model.id, code=body_code,
                )
                data["bodies"][(brand_name, model_name, body_code)] = body
            for engine_code in config["engines"]:
                engine = await get_or_create(
                    session, CarEngine, stats, car_model_id=model.id, code=engine_code,
                )
                data["engines"][(brand_name, model_name, engine_code)] = engine
    return data


async def seed_part_brands(session: AsyncSession, stats: Stats) -> dict[str, PartBrand]:
    brands: dict[str, PartBrand] = {}
    for name in PART_BRANDS:
        brands[name] = await get_or_create(session, PartBrand, stats, name=name)
    return brands


async def seed_categories(session: AsyncSession, stats: Stats) -> dict[str, Category]:
    categories: dict[str, Category] = {}
    for root_name, children in CATEGORY_TREE.items():
        root = await get_or_create(session, Category, stats, parent_id=None, name=root_name)
        categories[root_name] = root
        for child_name, leaf_names in children.items():
            child = await get_or_create(
                session, Category, stats, parent_id=root.id, name=child_name,
            )
            categories[child_name] = child
            for leaf_name in leaf_names:
                categories[leaf_name] = await get_or_create(
                    session, Category, stats, parent_id=child.id, name=leaf_name,
                )
    return categories


async def seed_parts(
    session: AsyncSession,
    stats: Stats,
    part_brands: dict[str, PartBrand],
    categories: dict[str, Category],
) -> list[Part]:
    parts: list[Part] = []
    for brand_name, category_name, article, name in PARTS:
        part = await get_or_create(
            session,
            Part,
            stats,
            part_brand_id=part_brands[brand_name].id,
            article=article,
            defaults={"category_id": categories[category_name].id, "name": name},
        )
        if part.category_id != categories[category_name].id or part.name != name:
            part.category_id = categories[category_name].id
            part.name = name
        parts.append(part)
    return parts


def applicability_targets(car_data: dict[str, Any]) -> list[dict[str, int | None]]:
    toyota = car_data["brands"]["Toyota"]
    nissan = car_data["brands"]["Nissan"]
    honda = car_data["brands"]["Honda"]
    bmw = car_data["brands"]["BMW"]
    mercedes = car_data["brands"]["Mercedes-Benz"]
    camry = car_data["models"][("Toyota", "Camry")]
    corolla = car_data["models"][("Toyota", "Corolla")]
    xtrail = car_data["models"][("Nissan", "X-Trail")]
    qashqai = car_data["models"][("Nissan", "Qashqai")]
    civic = car_data["models"][("Honda", "Civic")]
    crv = car_data["models"][("Honda", "CR-V")]
    bmw3 = car_data["models"][("BMW", "3 Series")]
    benz_c = car_data["models"][("Mercedes-Benz", "C-Class")]

    return [
        {"car_brand_id": toyota.id, "car_model_id": None, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": nissan.id, "car_model_id": None, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": honda.id, "car_model_id": None, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": bmw.id, "car_model_id": None, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": mercedes.id, "car_model_id": None, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": toyota.id, "car_model_id": camry.id, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": toyota.id, "car_model_id": corolla.id, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": nissan.id, "car_model_id": xtrail.id, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": nissan.id, "car_model_id": qashqai.id, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": honda.id, "car_model_id": civic.id, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": honda.id, "car_model_id": crv.id, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": bmw.id, "car_model_id": bmw3.id, "car_body_id": None, "car_engine_id": None},
        {"car_brand_id": mercedes.id, "car_model_id": benz_c.id, "car_body_id": None, "car_engine_id": None},
        {
            "car_brand_id": toyota.id,
            "car_model_id": camry.id,
            "car_body_id": car_data["bodies"][("Toyota", "Camry", "XV70")].id,
            "car_engine_id": None,
        },
        {
            "car_brand_id": nissan.id,
            "car_model_id": xtrail.id,
            "car_body_id": car_data["bodies"][("Nissan", "X-Trail", "T32")].id,
            "car_engine_id": None,
        },
        {
            "car_brand_id": honda.id,
            "car_model_id": civic.id,
            "car_body_id": car_data["bodies"][("Honda", "Civic", "FC")].id,
            "car_engine_id": None,
        },
        {
            "car_brand_id": toyota.id,
            "car_model_id": corolla.id,
            "car_body_id": None,
            "car_engine_id": car_data["engines"][("Toyota", "Corolla", "2ZR-FE")].id,
        },
        {
            "car_brand_id": nissan.id,
            "car_model_id": qashqai.id,
            "car_body_id": None,
            "car_engine_id": car_data["engines"][("Nissan", "Qashqai", "MR20DD")].id,
        },
        {
            "car_brand_id": honda.id,
            "car_model_id": crv.id,
            "car_body_id": None,
            "car_engine_id": car_data["engines"][("Honda", "CR-V", "K24W")].id,
        },
        {
            "car_brand_id": toyota.id,
            "car_model_id": camry.id,
            "car_body_id": car_data["bodies"][("Toyota", "Camry", "XV50")].id,
            "car_engine_id": car_data["engines"][("Toyota", "Camry", "2AR-FE")].id,
        },
        {
            "car_brand_id": nissan.id,
            "car_model_id": xtrail.id,
            "car_body_id": car_data["bodies"][("Nissan", "X-Trail", "T33")].id,
            "car_engine_id": car_data["engines"][("Nissan", "X-Trail", "QR25DE")].id,
        },
        {
            "car_brand_id": honda.id,
            "car_model_id": civic.id,
            "car_body_id": car_data["bodies"][("Honda", "Civic", "FE")].id,
            "car_engine_id": car_data["engines"][("Honda", "Civic", "L15B7")].id,
        },
    ]


async def validate_applicability(
    session: AsyncSession,
    car_brand_id: int,
    car_model_id: int | None,
    car_body_id: int | None,
    car_engine_id: int | None,
) -> None:
    if (car_body_id is not None or car_engine_id is not None) and car_model_id is None:
        raise ValueError("car_body_id/car_engine_id require car_model_id")

    if car_model_id is not None:
        model_brand_id = await session.scalar(
            select(CarModel.car_brand_id).where(CarModel.id == car_model_id)
        )
        if model_brand_id != car_brand_id:
            raise ValueError("car_model_id does not belong to car_brand_id")

    if car_body_id is not None:
        body_model_id = await session.scalar(
            select(CarBody.car_model_id).where(CarBody.id == car_body_id)
        )
        if body_model_id != car_model_id:
            raise ValueError("car_body_id does not belong to car_model_id")

    if car_engine_id is not None:
        engine_model_id = await session.scalar(
            select(CarEngine.car_model_id).where(CarEngine.id == car_engine_id)
        )
        if engine_model_id != car_model_id:
            raise ValueError("car_engine_id does not belong to car_model_id")


async def seed_applicability(
    session: AsyncSession,
    stats: Stats,
    parts: list[Part],
    car_data: dict[str, Any],
) -> None:
    targets = applicability_targets(car_data)
    for index, part in enumerate(parts):
        target = targets[index % len(targets)]
        await validate_applicability(session, **target)
        existing = await session.execute(
            select(PartApplicability).where(
                PartApplicability.part_id == part.id,
                PartApplicability.car_brand_id == target["car_brand_id"],
                PartApplicability.car_model_id.is_(target["car_model_id"])
                if target["car_model_id"] is None
                else PartApplicability.car_model_id == target["car_model_id"],
                PartApplicability.car_body_id.is_(target["car_body_id"])
                if target["car_body_id"] is None
                else PartApplicability.car_body_id == target["car_body_id"],
                PartApplicability.car_engine_id.is_(target["car_engine_id"])
                if target["car_engine_id"] is None
                else PartApplicability.car_engine_id == target["car_engine_id"],
            )
        )
        if existing.scalars().one_or_none():
            stats["part_applicability_found"] += 1
            continue
        session.add(PartApplicability(part_id=part.id, **target))
        await session.flush()
        stats["part_applicability_created"] += 1


async def seed_analogs(session: AsyncSession, stats: Stats, parts: list[Part]) -> None:
    analog_pairs = [
        (0, 23),
        (1, 5),
        (2, 12),
        (4, 19),
        (6, 32),
        (7, 34),
        (10, 28),
        (11, 35),
        (14, 24),
        (16, 17),
        (20, 30),
        (21, 30),
    ]
    for left_index, right_index in analog_pairs:
        left_id = parts[left_index].id
        right_id = parts[right_index].id
        part_id, analog_part_id = sorted((left_id, right_id))
        existing = await session.execute(
            select(PartAnalog).where(
                or_(
                    and_(
                        PartAnalog.part_id == part_id,
                        PartAnalog.analog_part_id == analog_part_id,
                    ),
                    and_(
                        PartAnalog.part_id == analog_part_id,
                        PartAnalog.analog_part_id == part_id,
                    ),
                )
            )
        )
        if existing.scalars().one_or_none():
            stats["part_analogs_found"] += 1
            continue
        session.add(PartAnalog(part_id=part_id, analog_part_id=analog_part_id))
        await session.flush()
        stats["part_analogs_created"] += 1


async def seed_part_offers(session: AsyncSession, stats: Stats, parts: list[Part]) -> None:
    """One PartOffer per part — required for cart/checkout (price and stock)."""
    for index, part in enumerate(parts):
        price = 290.0 + float(index * 47)
        stock = 30 + (index % 12) * 10
        await get_or_create(
            session,
            PartOffer,
            stats,
            part_id=part.id,
            defaults={"price": price, "quantity_available": stock},
        )


async def seed_part_brand_categories(
    session: AsyncSession,
    stats: Stats,
    parts: list[Part],
) -> None:
    pairs = {(part.part_brand_id, part.category_id) for part in parts}
    for part_brand_id, category_id in sorted(pairs):
        existing = await session.execute(
            select(PartBrandCategory).where(
                PartBrandCategory.part_brand_id == part_brand_id,
                PartBrandCategory.category_id == category_id,
            )
        )
        if existing.scalars().one_or_none():
            stats["part_brand_categories_found"] += 1
            continue
        session.add(PartBrandCategory(part_brand_id=part_brand_id, category_id=category_id))
        await session.flush()
        stats["part_brand_categories_created"] += 1


async def seed() -> Stats:
    stats: Stats = Counter()
    async with AsyncSessionLocal() as session:
        car_data = await seed_cars(session, stats)
        part_brands = await seed_part_brands(session, stats)
        categories = await seed_categories(session, stats)
        parts = await seed_parts(session, stats, part_brands, categories)
        await seed_applicability(session, stats, parts, car_data)
        await seed_analogs(session, stats, parts)
        await seed_part_brand_categories(session, stats, parts)
        await seed_part_offers(session, stats, parts)
        await session.commit()
    return stats


def print_stats(stats: Stats) -> None:
    tables = [
        "car_brands",
        "car_models",
        "car_bodies",
        "car_engines",
        "part_brands",
        "categories",
        "parts",
        "part_applicability",
        "part_analogs",
        "part_brand_categories",
        "part_offers",
    ]
    print("Catalog seed completed:")
    for table in tables:
        created = stats[f"{table}_created"]
        found = stats[f"{table}_found"]
        print(f"- {table}: created={created}, found={found}")


async def main() -> None:
    try:
        stats = await seed()
        print_stats(stats)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
