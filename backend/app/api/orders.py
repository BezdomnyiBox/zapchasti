from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user_model, require_exact_role
from app.models.user import User
from app.models.order import OrderStatus
from app.crud.order import (
    create_order,
    get_order_by_id,
    get_orders_by_client,
    get_all_orders,
    client_approve,
    client_reject,
    client_confirm_delivery,
)
from app.schemas.order import OrderCreate, OrderResponse, OrderListItem

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse)
async def create_new_order(
    data: OrderCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    if not current_user.phone:
        raise HTTPException(400, "Заполните номер телефона в профиле перед созданием заказа")
    if not data.drom_url and not data.description and not data.part_name:
        raise HTTPException(400, "Укажите ссылку Drom, описание или название детали")

    order = await create_order(db, current_user.id, data)
    order = await get_order_by_id(db, order.id)
    return order


@router.get("", response_model=list[OrderListItem])
async def list_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
    status: OrderStatus | None = Query(None),
):
    if current_user.role.value == "admin":
        orders = await get_all_orders(db, status=status)
    else:
        orders = await get_orders_by_client(db, current_user.id)
    return orders


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    is_participant = (
        order.client_id == current_user.id
        or order.courier_id == current_user.id
        or order.carrier_id == current_user.id
    )
    if not is_participant and current_user.role.value != "admin":
        raise HTTPException(403, "Нет доступа")
    return order


# ── Этап 4: Client approves or rejects after photo review ─

@router.post("/{order_id}/approve", response_model=OrderResponse)
async def approve_order(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.client_id != current_user.id:
        raise HTTPException(403, "Только клиент может подтвердить заказ")
    if order.status != OrderStatus.PHOTO_UPLOADED:
        raise HTTPException(400, "Фото ещё не загружены или решение уже принято")
    order = await client_approve(db, order)
    return await get_order_by_id(db, order.id)


@router.post("/{order_id}/reject", response_model=OrderResponse)
async def reject_order(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.client_id != current_user.id:
        raise HTTPException(403, "Только клиент может отклонить заказ")
    if order.status != OrderStatus.PHOTO_UPLOADED:
        raise HTTPException(400, "Фото ещё не загружены или решение уже принято")
    order = await client_reject(db, order)
    return await get_order_by_id(db, order.id)


# ── Этап 7: Client confirms delivery ──────────────────────

@router.post("/{order_id}/confirm-delivery", response_model=OrderResponse)
async def confirm_delivery(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.client_id != current_user.id:
        raise HTTPException(403, "Только клиент может подтвердить получение")
    if order.status != OrderStatus.HANDED_TO_CARRIER:
        raise HTTPException(400, "Заказ ещё не передан перевозчику")
    order = await client_confirm_delivery(db, order)
    return await get_order_by_id(db, order.id)
