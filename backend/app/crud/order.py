from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderPhoto, OrderStatus, Review
from app.schemas.order import OrderCreate, ReviewCreate


def _order_load_options():
    return [
        selectinload(Order.photos),
        selectinload(Order.review),
    ]


# ── Orders ────────────────────────────────────────────────

async def create_order(db: AsyncSession, client_id: int, data: OrderCreate) -> Order:
    service_fee = 500.0
    delivery_fee = 300.0
    part_price = data.part_price or 0
    total = part_price + service_fee + delivery_fee

    order = Order(
        client_id=client_id,
        description=data.description,
        drom_url=data.drom_url,
        car_brand=data.car_brand,
        car_model=data.car_model,
        car_year=data.car_year,
        body_type=data.body_type,
        part_name=data.part_name,
        part_number=data.part_number,
        seller_address=data.seller_address,
        seller_lat=data.seller_lat,
        seller_lng=data.seller_lng,
        delivery_address=data.delivery_address,
        delivery_lat=data.delivery_lat,
        delivery_lng=data.delivery_lng,
        part_price=data.part_price,
        service_fee=service_fee,
        delivery_fee=delivery_fee,
        total_price=total,
        cargo_size=data.cargo_size,
        comment=data.comment,
        status=OrderStatus.WAITING_COURIER,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


async def get_order_by_id(db: AsyncSession, order_id: int) -> Order | None:
    result = await db.execute(
        select(Order).options(*_order_load_options()).where(Order.id == order_id)
    )
    return result.scalars().one_or_none()


async def get_orders_by_client(db: AsyncSession, client_id: int) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.client_id == client_id)
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def get_all_orders(
    db: AsyncSession, status: OrderStatus | None = None,
) -> list[Order]:
    query = select(Order).order_by(Order.created_at.desc())
    if status:
        query = query.where(Order.status == status)
    result = await db.execute(query)
    return list(result.scalars().all())


# ── Courier: available orders + accept ────────────────────

async def get_available_for_courier(db: AsyncSession) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.status == OrderStatus.WAITING_COURIER)
        .order_by(Order.created_at.asc())
    )
    return list(result.scalars().all())


async def get_courier_orders(db: AsyncSession, courier_id: int) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.courier_id == courier_id)
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def courier_accept_order(
    db: AsyncSession, order: Order, courier_id: int,
) -> Order:
    order.courier_id = courier_id
    order.status = OrderStatus.COURIER_ASSIGNED
    await db.commit()
    await db.refresh(order)
    return order


async def courier_upload_done(db: AsyncSession, order: Order) -> Order:
    order.status = OrderStatus.PHOTO_UPLOADED
    await db.commit()
    await db.refresh(order)
    return order


async def courier_mark_picked_up(db: AsyncSession, order: Order) -> Order:
    order.status = OrderStatus.PICKED_UP
    await db.commit()
    await db.refresh(order)
    return order


async def courier_handoff_carrier(
    db: AsyncSession, order: Order, carrier_id: int | None = None,
) -> Order:
    if carrier_id:
        order.carrier_id = carrier_id
    order.status = OrderStatus.HANDED_TO_CARRIER
    await db.commit()
    await db.refresh(order)
    return order


# ── Client actions ────────────────────────────────────────

async def client_approve(db: AsyncSession, order: Order) -> Order:
    order.status = OrderStatus.CONFIRMED
    await db.commit()
    await db.refresh(order)
    return order


async def client_reject(db: AsyncSession, order: Order) -> Order:
    order.status = OrderStatus.CANCELLED
    await db.commit()
    await db.refresh(order)
    return order


async def client_confirm_delivery(db: AsyncSession, order: Order) -> Order:
    order.status = OrderStatus.COMPLETED
    await db.commit()
    await db.refresh(order)
    return order


# ── Carrier ───────────────────────────────────────────────

async def get_available_for_carrier(db: AsyncSession) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.status == OrderStatus.HANDED_TO_CARRIER, Order.carrier_id.is_(None))
        .order_by(Order.created_at.asc())
    )
    return list(result.scalars().all())


async def get_carrier_orders(db: AsyncSession, carrier_id: int) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.carrier_id == carrier_id)
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def carrier_accept_order(
    db: AsyncSession, order: Order, carrier_id: int,
) -> Order:
    order.carrier_id = carrier_id
    await db.commit()
    await db.refresh(order)
    return order


async def carrier_mark_delivered(db: AsyncSession, order: Order) -> Order:
    order.status = OrderStatus.COMPLETED
    await db.commit()
    await db.refresh(order)
    return order


# ── Photos ────────────────────────────────────────────────

async def create_photo(
    db: AsyncSession,
    order_id: int,
    file_key: str,
    file_url: str,
    uploaded_by: int,
) -> OrderPhoto:
    photo = OrderPhoto(
        order_id=order_id,
        file_key=file_key,
        file_url=file_url,
        uploaded_by=uploaded_by,
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    return photo


# ── Reviews ───────────────────────────────────────────────

async def create_review(
    db: AsyncSession, order_id: int, client_id: int, data: ReviewCreate,
) -> Review:
    review = Review(
        order_id=order_id,
        client_id=client_id,
        courier_rating=data.courier_rating,
        service_rating=data.service_rating,
        comment=data.comment,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def get_reviews_for_courier(db: AsyncSession, courier_id: int) -> list[Review]:
    result = await db.execute(
        select(Review)
        .join(Order, Review.order_id == Order.id)
        .where(Order.courier_id == courier_id)
        .order_by(Review.created_at.desc())
    )
    return list(result.scalars().all())
