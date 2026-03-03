import io
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user_model
from app.models.user import User
from app.crud.order import create_photo, get_order_item
from app.schemas.order import PhotoResponse
from app.core.s3 import upload_fileobj

router = APIRouter(prefix="/media", tags=["media"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 10
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


@router.post("", response_model=PhotoResponse)
async def upload_photo(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
    file: UploadFile = File(...),
    order_item_id: int = Form(...),
    selection_task_id: int | None = Form(None),
    pickup_task_id: int | None = Form(None),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Допустимые форматы: {', '.join(ALLOWED_TYPES)}")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(400, f"Максимальный размер файла: {MAX_SIZE_MB} МБ")

    item = await get_order_item(db, order_item_id)
    if not item:
        raise HTTPException(404, "Позиция заказа не найдена")

    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    key = f"orders/{item.order_id}/items/{order_item_id}/{uuid.uuid4().hex}.{ext}"

    file_url = upload_fileobj(io.BytesIO(content), key, file.content_type)

    photo = await create_photo(
        db,
        order_item_id=order_item_id,
        file_key=key,
        file_url=file_url,
        uploaded_by=current_user.id,
        selection_task_id=selection_task_id,
        pickup_task_id=pickup_task_id,
    )
    return photo
