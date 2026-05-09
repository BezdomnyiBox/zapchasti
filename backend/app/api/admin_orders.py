from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_exact_role
from app.crud.admin_orders import (
    get_admin_order_by_id,
    list_admin_orders,
    update_admin_order_status,
)
from app.models.order import OrderStatus, PaymentStatus
from app.models.user import User
from app.schemas.admin_orders import (
    AdminOrderClientResponse,
    AdminOrderDetailResponse,
    AdminOrderListItemResponse,
    AdminOrderListResponse,
    AdminOrderStatusUpdateRequest,
)

router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])


@router.get("", response_model=AdminOrderListResponse)
async def get_admin_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_exact_role("admin"))],
    status: OrderStatus | None = Query(None),
    payment_status: PaymentStatus | None = Query(None),
    search: str | None = Query(None, min_length=1, max_length=100),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    orders, total = await list_admin_orders(
        db,
        status=status,
        payment_status=payment_status,
        search=search,
        limit=limit,
        offset=offset,
    )
    items = [
        AdminOrderListItemResponse(
            id=order.id,
            status=order.status,
            payment_status=order.payment_status,
            total_price=order.total_price,
            created_at=order.created_at,
            client=AdminOrderClientResponse(
                id=order.client.id,
                username=order.client.username,
                email=order.client.email,
                phone=order.client.phone,
            ),
        )
        for order in orders
        if order.client is not None
    ]
    return AdminOrderListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/{order_id}", response_model=AdminOrderDetailResponse)
async def get_admin_order_detail(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_exact_role("admin"))],
):
    order = await get_admin_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.client is None:
        raise HTTPException(500, "Не удалось загрузить данные клиента")
    return AdminOrderDetailResponse(
        order=order,
        client=AdminOrderClientResponse(
            id=order.client.id,
            username=order.client.username,
            email=order.client.email,
            phone=order.client.phone,
        ),
    )


@router.patch("/{order_id}/status", response_model=AdminOrderDetailResponse)
async def patch_admin_order_status(
    order_id: int,
    payload: AdminOrderStatusUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_exact_role("admin"))],
):
    order = await get_admin_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    try:
        updated = await update_admin_order_status(db, order, payload.status)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    updated = await get_admin_order_by_id(db, updated.id)
    if not updated or updated.client is None:
        raise HTTPException(500, "Не удалось загрузить обновленный заказ")
    return AdminOrderDetailResponse(
        order=updated,
        client=AdminOrderClientResponse(
            id=updated.client.id,
            username=updated.client.username,
            email=updated.client.email,
            phone=updated.client.phone,
        ),
    )
