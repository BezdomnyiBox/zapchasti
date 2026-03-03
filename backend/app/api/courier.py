"""
Courier API — stages 2, 3, 5, 6 of the sequence diagram.

Stage 2: Accept order (available → courier_assigned)
Stage 3: Upload photos (courier_assigned → photo_uploaded)
Stage 5: Mark picked up (confirmed → picked_up)
Stage 6: Handoff to carrier (picked_up → handed_to_carrier)
"""
import io
import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_exact_role
from app.models.user import User
from app.models.order import OrderStatus
from app.crud.order import (
    get_available_for_courier,
    get_courier_orders,
    get_order_by_id,
    courier_accept_order,
    courier_upload_done,
    courier_mark_picked_up,
    courier_handoff_carrier,
    create_photo,
)
from app.schemas.order import OrderResponse, OrderListItem, PhotoResponse
from app.core.s3 import upload_fileobj

router = APIRouter(prefix="/courier", tags=["courier"])
logger = logging.getLogger(__name__)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024


@router.get("/available", response_model=list[OrderListItem])
async def list_available_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_exact_role("courier"))],
):
    return await get_available_for_courier(db)


@router.get("/my", response_model=list[OrderListItem])
async def list_my_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("courier"))],
):
    return await get_courier_orders(db, current_user.id)


# ── Stage 2: Accept ───────────────────────────────────────

@router.post("/{order_id}/accept", response_model=OrderResponse)
async def accept_order(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("courier"))],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.status != OrderStatus.WAITING_COURIER:
        raise HTTPException(400, "Заказ уже взят другим курьером")
    order = await courier_accept_order(db, order, current_user.id)
    return await get_order_by_id(db, order.id)


# ── Stage 3: Upload photos ────────────────────────────────

@router.post("/{order_id}/photo", response_model=PhotoResponse)
async def upload_photo(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("courier"))],
    file: UploadFile = File(...),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Допустимые форматы: {', '.join(ALLOWED_TYPES)}")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(400, "Максимальный размер файла: 10 МБ")

    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.courier_id != current_user.id:
        raise HTTPException(403, "Вы не назначены на этот заказ")
    if order.status != OrderStatus.COURIER_ASSIGNED:
        raise HTTPException(400, "Загрузка фото доступна только после назначения")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    key = f"orders/{order_id}/{uuid.uuid4().hex}.{ext}"
    try:
        file_url = upload_fileobj(io.BytesIO(content), key, file.content_type)
    except Exception as exc:
        logger.exception("S3 upload failed for order_id=%s key=%s", order_id, key)
        raise HTTPException(502, "Не удалось загрузить фото в хранилище") from exc

    photo = await create_photo(db, order_id, key, file_url, current_user.id)
    return photo


@router.post("/{order_id}/photos-done", response_model=OrderResponse)
async def mark_photos_done(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("courier"))],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.courier_id != current_user.id:
        raise HTTPException(403, "Вы не назначены на этот заказ")
    if order.status != OrderStatus.COURIER_ASSIGNED:
        raise HTTPException(400, "Сначала нужно быть назначенным")
    if not order.photos:
        raise HTTPException(400, "Загрузите хотя бы одно фото")
    order = await courier_upload_done(db, order)
    return await get_order_by_id(db, order.id)


# ── Stage 5: Mark picked up ───────────────────────────────

@router.post("/{order_id}/picked-up", response_model=OrderResponse)
async def mark_picked_up(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("courier"))],
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.courier_id != current_user.id:
        raise HTTPException(403, "Вы не назначены на этот заказ")
    if order.status != OrderStatus.CONFIRMED:
        raise HTTPException(400, "Клиент ещё не подтвердил покупку")
    order = await courier_mark_picked_up(db, order)
    return await get_order_by_id(db, order.id)


# ── Stage 6: Handoff to carrier ───────────────────────────

@router.post("/{order_id}/handoff", response_model=OrderResponse)
async def handoff_to_carrier(
    order_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("courier"))],
    carrier_id: int | None = Form(None),
):
    order = await get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order.courier_id != current_user.id:
        raise HTTPException(403, "Вы не назначены на этот заказ")
    if order.status != OrderStatus.PICKED_UP:
        raise HTTPException(400, "Запчасть ещё не забрана")
    order = await courier_handoff_carrier(db, order, carrier_id)
    return await get_order_by_id(db, order.id)
