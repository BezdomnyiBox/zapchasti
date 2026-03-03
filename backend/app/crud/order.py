from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import (
    Order, OrderItem, OrderStatus,
    SelectionTask, PickupTask, DeliveryTask, OrderPhoto, TaskStatus,
)
from app.schemas.order import OrderCreate


# ── helpers for eager-loading items → tasks → photos ──────

def _item_load_options():
    return [
        selectinload(OrderItem.selection_task).selectinload(SelectionTask.photos),
        selectinload(OrderItem.pickup_task).selectinload(PickupTask.photos),
        selectinload(OrderItem.delivery_task),
        selectinload(OrderItem.photos),
    ]


def _order_load_options():
    return [
        selectinload(Order.items).options(*_item_load_options()),
    ]


# ── Orders ────────────────────────────────────────────────

async def create_order(db: AsyncSession, client_id: int, data: OrderCreate) -> Order:
    order = Order(client_id=client_id, comment=data.comment, status=OrderStatus.NEW)
    db.add(order)
    await db.flush()

    items: list[OrderItem] = []
    for item_data in data.items:
        has_drom = bool(item_data.drom_url)
        initial_status = OrderStatus.PICKUP if has_drom else OrderStatus.SELECTION

        item = OrderItem(
            order_id=order.id,
            drom_url=item_data.drom_url,
            description=item_data.description,
            car_brand=item_data.car_brand,
            car_model=item_data.car_model,
            car_year=item_data.car_year,
            body_type=item_data.body_type,
            part_name=item_data.part_name,
            part_number=item_data.part_number,
            target_price=item_data.target_price,
            comment=item_data.comment,
            prepaid_to_seller=item_data.prepaid_to_seller,
            cargo_size=item_data.cargo_size,
            status=initial_status,
        )
        db.add(item)
        await db.flush()
        items.append(item)

        if not has_drom:
            db.add(SelectionTask(order_item_id=item.id, status=TaskStatus.PENDING))
        else:
            needs_inspection = not item_data.prepaid_to_seller
            db.add(PickupTask(
                order_item_id=item.id,
                needs_inspection=needs_inspection,
                status=TaskStatus.PENDING,
            ))

    _sync_order_status_from_items(order, items)
    await db.commit()
    await db.refresh(order)
    return order


def _sync_order_status_from_items(order: Order, items: list[OrderItem]) -> None:
    """Derive order-level status from items. Call before commit (avoids lazy load)."""
    if not items:
        return
    statuses = [it.status for it in items]
    if all(s == OrderStatus.CLOSED for s in statuses):
        order.status = OrderStatus.CLOSED
    elif all(s == OrderStatus.CANCELLED for s in statuses):
        order.status = OrderStatus.CANCELLED
    elif any(s == OrderStatus.DELIVERY for s in statuses):
        order.status = OrderStatus.DELIVERY
    elif any(s == OrderStatus.PICKUP for s in statuses):
        order.status = OrderStatus.PICKUP
    elif any(s == OrderStatus.SELECTION for s in statuses):
        order.status = OrderStatus.SELECTION
    else:
        order.status = OrderStatus.NEW


def _sync_order_status(order: Order) -> None:
    """Derive order-level status from items. Requires order.items already loaded."""
    if not order.items:
        return
    statuses = [it.status for it in order.items]
    if all(s == OrderStatus.CLOSED for s in statuses):
        order.status = OrderStatus.CLOSED
    elif all(s == OrderStatus.CANCELLED for s in statuses):
        order.status = OrderStatus.CANCELLED
    elif any(s == OrderStatus.DELIVERY for s in statuses):
        order.status = OrderStatus.DELIVERY
    elif any(s == OrderStatus.PICKUP for s in statuses):
        order.status = OrderStatus.PICKUP
    elif any(s == OrderStatus.SELECTION for s in statuses):
        order.status = OrderStatus.SELECTION
    else:
        order.status = OrderStatus.NEW


async def get_order_by_id(db: AsyncSession, order_id: int) -> Order | None:
    result = await db.execute(
        select(Order)
        .options(*_order_load_options())
        .where(Order.id == order_id)
    )
    return result.scalars().one_or_none()


async def get_orders_by_client(db: AsyncSession, client_id: int) -> list[Order]:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.client_id == client_id)
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def get_all_orders(db: AsyncSession, status: OrderStatus | None = None) -> list[Order]:
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    if status:
        query = query.where(Order.status == status)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_order_status(db: AsyncSession, order: Order, status: OrderStatus) -> Order:
    order.status = status
    await db.commit()
    await db.refresh(order)
    return order


async def recalc_order_status(db: AsyncSession, order: Order) -> Order:
    """Re-derive order status from its items and persist."""
    _sync_order_status(order)
    await db.commit()
    await db.refresh(order)
    return order


# ── Order Item helpers ────────────────────────────────────

async def get_order_item(db: AsyncSession, item_id: int) -> OrderItem | None:
    result = await db.execute(
        select(OrderItem)
        .options(*_item_load_options())
        .where(OrderItem.id == item_id)
    )
    return result.scalars().one_or_none()


# ── Selection tasks ───────────────────────────────────────

async def get_selection_tasks(
    db: AsyncSession, picker_id: int | None = None,
) -> list[SelectionTask]:
    query = select(SelectionTask).order_by(SelectionTask.created_at.desc())
    if picker_id:
        query = query.where(SelectionTask.picker_id == picker_id)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_selection_task(db: AsyncSession, task_id: int) -> SelectionTask | None:
    result = await db.execute(
        select(SelectionTask)
        .options(selectinload(SelectionTask.photos))
        .where(SelectionTask.id == task_id)
    )
    return result.scalars().one_or_none()


async def update_selection_task(
    db: AsyncSession, task: SelectionTask, **kwargs,
) -> SelectionTask:
    for key, value in kwargs.items():
        if value is not None:
            setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task


# ── Pickup tasks ──────────────────────────────────────────

async def get_pickup_tasks(
    db: AsyncSession, picker_id: int | None = None,
) -> list[PickupTask]:
    query = select(PickupTask).order_by(PickupTask.created_at.desc())
    if picker_id:
        query = query.where(PickupTask.picker_id == picker_id)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_pickup_task(db: AsyncSession, task_id: int) -> PickupTask | None:
    result = await db.execute(
        select(PickupTask)
        .options(selectinload(PickupTask.photos))
        .where(PickupTask.id == task_id)
    )
    return result.scalars().one_or_none()


async def update_pickup_task(
    db: AsyncSession, task: PickupTask, **kwargs,
) -> PickupTask:
    for key, value in kwargs.items():
        if value is not None:
            setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task


# ── Delivery tasks ────────────────────────────────────────

async def create_delivery_task(
    db: AsyncSession, order_item_id: int, **kwargs,
) -> DeliveryTask:
    task = DeliveryTask(order_item_id=order_item_id, status=TaskStatus.PENDING, **kwargs)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def get_delivery_tasks(
    db: AsyncSession, picker_id: int | None = None,
) -> list[DeliveryTask]:
    query = select(DeliveryTask).order_by(DeliveryTask.created_at.desc())
    if picker_id:
        query = query.where(DeliveryTask.picker_id == picker_id)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_delivery_task(db: AsyncSession, task_id: int) -> DeliveryTask | None:
    result = await db.execute(
        select(DeliveryTask).where(DeliveryTask.id == task_id)
    )
    return result.scalars().one_or_none()


async def update_delivery_task(
    db: AsyncSession, task: DeliveryTask, **kwargs,
) -> DeliveryTask:
    for key, value in kwargs.items():
        if value is not None:
            setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task


# ── Photos ────────────────────────────────────────────────

async def create_photo(
    db: AsyncSession,
    order_item_id: int,
    file_key: str,
    file_url: str,
    uploaded_by: int,
    selection_task_id: int | None = None,
    pickup_task_id: int | None = None,
) -> OrderPhoto:
    photo = OrderPhoto(
        order_item_id=order_item_id,
        file_key=file_key,
        file_url=file_url,
        uploaded_by=uploaded_by,
        selection_task_id=selection_task_id,
        pickup_task_id=pickup_task_id,
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    return photo
