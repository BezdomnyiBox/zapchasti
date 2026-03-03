"""
Reviews API — stage 8 of the sequence diagram.
Client rates courier and leaves a service review.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user_model
from app.models.user import User
from app.models.order import OrderStatus
from app.crud.order import get_order_by_id, create_review, get_reviews_for_courier
from app.schemas.order import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/{order_id}", response_model=ReviewResponse)
async def submit_review(
    order_id: int,
    data: ReviewCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.client_id != current_user.id:
        raise HTTPException(403, "Только клиент может оставить отзыв")
    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(400, "Заказ ещё не завершён")
    if order.review:
        raise HTTPException(400, "Отзыв уже оставлен")
    review = await create_review(db, order_id, current_user.id, data)
    return review


@router.get("/courier/{courier_id}", response_model=list[ReviewResponse])
async def get_courier_reviews(
    courier_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user_model)],
):
    return await get_reviews_for_courier(db, courier_id)
