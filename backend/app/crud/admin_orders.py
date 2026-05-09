from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderStatus, PaymentStatus
from app.models.user import User


_ALLOWED_STATUS_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.WAITING_COURIER: {
        OrderStatus.COURIER_ASSIGNED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.COURIER_ASSIGNED: {
        OrderStatus.PHOTO_UPLOADED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.PHOTO_UPLOADED: {
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.CONFIRMED: {
        OrderStatus.PICKED_UP,
        OrderStatus.CANCELLED,
    },
    OrderStatus.PICKED_UP: {
        OrderStatus.HANDED_TO_CARRIER,
        OrderStatus.CANCELLED,
    },
    OrderStatus.HANDED_TO_CARRIER: {
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.COMPLETED: set(),
    OrderStatus.CANCELLED: set(),
}


def _order_load_options():
    return [
        selectinload(Order.client),
        selectinload(Order.items),
        selectinload(Order.photos),
        selectinload(Order.review),
    ]


def _apply_filters(
    query,
    status: OrderStatus | None = None,
    payment_status: PaymentStatus | None = None,
    search: str | None = None,
):
    if status is not None:
        query = query.where(Order.status == status)
    if payment_status is not None:
        query = query.where(Order.payment_status == payment_status)
    if search:
        term = search.strip()
        if term:
            email_or_phone = or_(
                User.email.ilike(f"%{term}%"),
                User.phone.ilike(f"%{term}%"),
            )
            if term.isdigit():
                query = query.where(or_(Order.id == int(term), email_or_phone))
            else:
                query = query.where(email_or_phone)
    return query


async def list_admin_orders(
    db: AsyncSession,
    *,
    status: OrderStatus | None,
    payment_status: PaymentStatus | None,
    search: str | None,
    limit: int,
    offset: int,
) -> tuple[list[Order], int]:
    base = select(Order).join(User, User.id == Order.client_id)
    base = _apply_filters(base, status=status, payment_status=payment_status, search=search)
    result = await db.execute(
        base.options(*_order_load_options())
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    items = list(result.scalars().all())

    count_query = select(func.count(Order.id)).join(User, User.id == Order.client_id)
    count_query = _apply_filters(
        count_query,
        status=status,
        payment_status=payment_status,
        search=search,
    )
    total = await db.scalar(count_query)
    return items, int(total or 0)


async def get_admin_order_by_id(db: AsyncSession, order_id: int) -> Order | None:
    result = await db.execute(
        select(Order)
        .options(*_order_load_options())
        .where(Order.id == order_id)
    )
    return result.scalars().one_or_none()


def validate_admin_status_transition(
    current: OrderStatus,
    target: OrderStatus,
) -> None:
    if current == target:
        return
    allowed_targets = _ALLOWED_STATUS_TRANSITIONS.get(current, set())
    if target not in allowed_targets:
        raise ValueError(
            f"Некорректный переход статуса: {current.value} -> {target.value}",
        )


async def update_admin_order_status(
    db: AsyncSession,
    order: Order,
    target_status: OrderStatus,
) -> Order:
    validate_admin_status_transition(order.status, target_status)
    order.status = target_status
    await db.commit()
    await db.refresh(order)
    return order
