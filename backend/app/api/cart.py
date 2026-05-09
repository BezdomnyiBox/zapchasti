from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_exact_role
from app.models.user import User
from app.crud.cart import (
    build_cart_summary,
    checkout_cart,
    clear_cart,
    delete_cart_item,
    get_cart_item_by_id,
    get_part_offer,
    get_part_with_meta,
    upsert_cart_item,
    update_cart_item_quantity,
)
from app.crud.order import get_order_by_id
from app.schemas.cart import (
    CartAddRequest,
    CartCheckoutRequest,
    CartSummaryResponse,
    CartUpdateRequest,
)
from app.schemas.order import OrderResponse

router = APIRouter(prefix="/cart", tags=["cart"])


def _validate_offer(quantity: int, offer_quantity_available: int) -> None:
    if offer_quantity_available <= 0:
        raise HTTPException(400, "Для запчасти нет доступного предложения")
    if quantity > offer_quantity_available:
        raise HTTPException(400, "Недостаточно доступного количества")


@router.get("", response_model=CartSummaryResponse)
async def get_my_cart(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("client"))],
):
    return await build_cart_summary(db, current_user.id)


@router.post("/items", response_model=CartSummaryResponse)
async def add_cart_item(
    payload: CartAddRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("client"))],
):
    part = await get_part_with_meta(db, payload.part_id)
    if not part:
        raise HTTPException(404, "Запчасть не найдена")
    offer = await get_part_offer(db, payload.part_id)
    if not offer:
        raise HTTPException(400, "Для запчасти нет предложения с ценой")
    _validate_offer(payload.quantity, offer.quantity_available)
    await upsert_cart_item(db, current_user.id, payload.part_id, payload.quantity)
    return await build_cart_summary(db, current_user.id)


@router.patch("/items/{item_id}", response_model=CartSummaryResponse)
async def update_cart_item(
    item_id: int,
    payload: CartUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("client"))],
):
    item = await get_cart_item_by_id(db, current_user.id, item_id)
    if not item:
        raise HTTPException(404, "Позиция корзины не найдена")
    offer = await get_part_offer(db, item.part_id)
    if not offer:
        raise HTTPException(400, "Для запчасти нет предложения с ценой")
    _validate_offer(payload.quantity, offer.quantity_available)
    await update_cart_item_quantity(db, item, payload.quantity)
    return await build_cart_summary(db, current_user.id)


@router.delete("/items/{item_id}", response_model=CartSummaryResponse)
async def remove_cart_item(
    item_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("client"))],
):
    item = await get_cart_item_by_id(db, current_user.id, item_id)
    if not item:
        raise HTTPException(404, "Позиция корзины не найдена")
    await delete_cart_item(db, item)
    return await build_cart_summary(db, current_user.id)


@router.delete("", response_model=CartSummaryResponse)
async def clear_my_cart(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("client"))],
):
    await clear_cart(db, current_user.id)
    return await build_cart_summary(db, current_user.id)


@router.post("/checkout", response_model=OrderResponse)
async def checkout_my_cart(
    payload: CartCheckoutRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("client"))],
):
    if not current_user.phone:
        raise HTTPException(400, "Заполните номер телефона в профиле перед оформлением заказа")
    try:
        order = await checkout_cart(
            db=db,
            user_id=current_user.id,
            delivery_address=payload.delivery_address.strip(),
            cargo_size=payload.cargo_size,
            comment=payload.comment.strip() if payload.comment else None,
        )
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc

    full_order = await get_order_by_id(db, order.id)
    if not full_order:
        raise HTTPException(500, "Не удалось загрузить созданный заказ")
    return full_order
