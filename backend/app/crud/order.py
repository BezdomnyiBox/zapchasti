from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import (
    Order, OrderStatus,
    SelectionTask, PickupTask, DeliveryTask, OrderPhoto, TaskStatus,
)
from app.schemas.order import OrderCreate


async def create_order(db: AsyncSession, client_id: int, data: OrderCreate) -> Order:
    has_drom = bool(data.drom_url)

    if has_drom:
        initial_status = OrderStatus.PICKUP
    else:
        initial_status = OrderStatus.SELECTION

    order = Order(
        client_id=client_id,
        drom_url=data.drom_url,
        description=data.description,
        target_price=data.target_price,
        comment=data.comment,
        prepaid_to_seller=data.prepaid_to_seller,
        status=initial_status,
    )
    db.add(order)
    await db.flush()

    if not has_drom:
        selection = SelectionTask(order_id=order.id, status=TaskStatus.PENDING)
        db.add(selection)
    else:
        needs_inspection = not data.prepaid_to_seller
        pickup = PickupTask(
            order_id=order.id,
            needs_inspection=needs_inspection,
            status=TaskStatus.PENDING,
        )
        db.add(pickup)

    await db.commit()
    await db.refresh(order)
    return order


async def get_order_by_id(db: AsyncSession, order_id: int) -> Order | None:
    result = await db.execute(
        select(Order)
        .options(
            selectinload(Order.selection_task).selectinload(SelectionTask.photos),
            selectinload(Order.pickup_task).selectinload(PickupTask.photos),
            selectinload(Order.delivery_task),
            selectinload(Order.photos),
        )
        .where(Order.id == order_id)
    )
    return result.scalars().one_or_none()


async def get_orders_by_client(db: AsyncSession, client_id: int) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.client_id == client_id)
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


async def get_all_orders(db: AsyncSession, status: OrderStatus | None = None) -> list[Order]:
    query = select(Order).order_by(Order.created_at.desc())
    if status:
        query = query.where(Order.status == status)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_order_status(db: AsyncSession, order: Order, status: OrderStatus) -> Order:
    order.status = status
    await db.commit()
    await db.refresh(order)
    return order


# --- Selection tasks ---

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


# --- Pickup tasks ---

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


# --- Delivery tasks ---

async def create_delivery_task(
    db: AsyncSession, order_id: int, **kwargs,
) -> DeliveryTask:
    task = DeliveryTask(order_id=order_id, status=TaskStatus.PENDING, **kwargs)
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


# --- Photos ---

async def create_photo(
    db: AsyncSession,
    order_id: int,
    file_key: str,
    file_url: str,
    uploaded_by: int,
    selection_task_id: int | None = None,
    pickup_task_id: int | None = None,
) -> OrderPhoto:
    photo = OrderPhoto(
        order_id=order_id,
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
