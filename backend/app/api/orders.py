from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user_model, require_role
from app.models.user import User
from app.models.order import OrderStatus
from app.crud.order import (
    create_order,
    get_order_by_id,
    get_orders_by_client,
    get_all_orders,
    update_order_status,
)
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderListItem,
    OrderUpdate,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse)
async def create_new_order(
    data: OrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    if not current_user.phone:
        raise HTTPException(400, "Заполните номер телефона в профиле перед созданием заявки")

    order = await create_order(db, current_user.id, data)
    order = await get_order_by_id(db, order.id)
    return order


@router.get("", response_model=list[OrderListItem])
async def list_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
    status: OrderStatus | None = Query(None),
):
    if current_user.role.value in ("picker", "admin"):
        orders = await get_all_orders(db, status=status)
    else:
        orders = await get_orders_by_client(db, current_user.id)

    return [
        OrderListItem(
            id=o.id,
            status=o.status,
            items_count=len(o.items) if o.items else 0,
            created_at=o.created_at,
        )
        for o in orders
    ]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if (
        current_user.role.value not in ("picker", "admin")
        and order.client_id != current_user.id
    ):
        raise HTTPException(status_code=403, detail="Нет доступа")
    return order


@router.patch("/{order_id}", response_model=OrderResponse)
async def patch_order(
    order_id: int,
    data: OrderUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("picker"))],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if data.status:
        order = await update_order_status(db, order, data.status)
    return order
