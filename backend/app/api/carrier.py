"""
Carrier API — stages 6–7 of the sequence diagram.

Stage 6: Accept handed-off order
Stage 7: Mark delivered
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_exact_role
from app.models.user import User
from app.models.order import OrderStatus
from app.crud.order import (
    get_available_for_carrier,
    get_carrier_orders,
    get_order_by_id,
    carrier_accept_order,
    carrier_mark_delivered,
)
from app.schemas.order import OrderResponse, OrderListItem

router = APIRouter(prefix="/carrier", tags=["carrier"])


@router.get("/available", response_model=list[OrderListItem])
async def list_available_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_exact_role("carrier"))],
):
    return await get_available_for_carrier(db)


@router.get("/my", response_model=list[OrderListItem])
async def list_my_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("carrier"))],
):
    return await get_carrier_orders(db, current_user.id)


@router.post("/{order_id}/accept", response_model=OrderResponse)
async def accept_order(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("carrier"))],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.status != OrderStatus.HANDED_TO_CARRIER:
        raise HTTPException(400, "Заказ ещё не передан")
    if order.carrier_id and order.carrier_id != current_user.id:
        raise HTTPException(400, "Заказ уже взят другим перевозчиком")
    order = await carrier_accept_order(db, order, current_user.id)
    return await get_order_by_id(db, order.id)


@router.post("/{order_id}/delivered", response_model=OrderResponse)
async def mark_delivered(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("carrier"))],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.carrier_id != current_user.id:
        raise HTTPException(403, "Вы не назначены на этот заказ")
    if order.status != OrderStatus.HANDED_TO_CARRIER:
        raise HTTPException(400, "Заказ ещё не передан перевозчику")
    order = await carrier_mark_delivered(db, order)
    return await get_order_by_id(db, order.id)
