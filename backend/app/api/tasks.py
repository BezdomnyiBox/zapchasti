from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user_model, require_role
from app.models.user import User
from app.models.order import OrderStatus, TaskStatus
from app.crud.order import (
    get_order_by_id,
    recalc_order_status,
    get_order_item,
    get_selection_tasks,
    get_selection_task,
    update_selection_task,
    get_pickup_tasks,
    get_pickup_task,
    update_pickup_task,
    create_delivery_task,
    get_delivery_tasks,
    get_delivery_task,
    update_delivery_task,
)
from app.schemas.order import (
    SelectionTaskResponse,
    PickupTaskResponse,
    DeliveryTaskResponse,
    TaskUpdate,
    PickupTaskUpdate,
    DeliveryTaskUpdate,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


async def _update_item_and_order_status(
    db: AsyncSession, order_item_id: int, new_item_status: OrderStatus,
):
    """Set item status and recalculate parent order status."""
    item = await get_order_item(db, order_item_id)
    if not item:
        return
    item.status = new_item_status
    order = await get_order_by_id(db, item.order_id)
    if order:
        await recalc_order_status(db, order)


# ── Selection tasks ──────────────────────────────────────

@router.get("/selection", response_model=list[SelectionTaskResponse])
async def list_selection_tasks(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("picker"))],
):
    return await get_selection_tasks(db)


@router.get("/selection/{task_id}", response_model=SelectionTaskResponse)
async def get_selection(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    task = await get_selection_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@router.patch("/selection/{task_id}", response_model=SelectionTaskResponse)
async def update_selection(
    task_id: int,
    data: TaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("picker"))],
):
    task = await get_selection_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    updates = data.model_dump(exclude_none=True)

    if not task.picker_id:
        updates["picker_id"] = current_user.id

    if data.status == TaskStatus.COMPLETED:
        item = await get_order_item(db, task.order_item_id)
        if item and not item.pickup_task:
            from app.models.order import PickupTask as PickupModel
            db.add(PickupModel(
                order_item_id=item.id,
                needs_inspection=True,
                status=TaskStatus.PENDING,
            ))
        await _update_item_and_order_status(db, task.order_item_id, OrderStatus.PICKUP)

    task = await update_selection_task(db, task, **updates)
    return task


# ── Pickup tasks ─────────────────────────────────────────

@router.get("/pickup", response_model=list[PickupTaskResponse])
async def list_pickup_tasks(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("picker"))],
):
    return await get_pickup_tasks(db)


@router.get("/pickup/{task_id}", response_model=PickupTaskResponse)
async def get_pickup(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    task = await get_pickup_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@router.patch("/pickup/{task_id}", response_model=PickupTaskResponse)
async def update_pickup(
    task_id: int,
    data: PickupTaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("picker"))],
):
    task = await get_pickup_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    updates = data.model_dump(exclude_none=True)

    if not task.picker_id:
        updates["picker_id"] = current_user.id

    if data.status == TaskStatus.COMPLETED:
        await create_delivery_task(db, task.order_item_id)
        await _update_item_and_order_status(db, task.order_item_id, OrderStatus.DELIVERY)

    task = await update_pickup_task(db, task, **updates)
    return task


# ── Delivery tasks ───────────────────────────────────────

@router.get("/delivery", response_model=list[DeliveryTaskResponse])
async def list_delivery_tasks(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("picker"))],
):
    return await get_delivery_tasks(db)


@router.get("/delivery/{task_id}", response_model=DeliveryTaskResponse)
async def get_delivery(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    task = await get_delivery_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task


@router.patch("/delivery/{task_id}", response_model=DeliveryTaskResponse)
async def update_delivery(
    task_id: int,
    data: DeliveryTaskUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("picker"))],
):
    task = await get_delivery_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    updates = data.model_dump(exclude_none=True)

    if not task.picker_id:
        updates["picker_id"] = current_user.id

    if data.status == TaskStatus.COMPLETED:
        await _update_item_and_order_status(db, task.order_item_id, OrderStatus.CLOSED)

    task = await update_delivery_task(db, task, **updates)
    return task
