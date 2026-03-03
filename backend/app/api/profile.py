from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user_model, require_exact_role
from app.models.user import User
from app.crud.user import update_user_phone, get_courier_profile, upsert_courier_profile
from app.schemas.auth import (
    UserResponse,
    UserProfileUpdate,
    CourierProfileResponse,
    CourierProfileUpdate,
)

router = APIRouter(prefix="/profile", tags=["profile"])


@router.patch("", response_model=UserResponse)
async def update_my_profile(
    data: UserProfileUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    if data.phone is not None:
        await update_user_phone(db, current_user, data.phone)
    return current_user


@router.get("/courier", response_model=CourierProfileResponse)
async def get_my_courier_profile(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("courier"))],
):
    profile = await get_courier_profile(db, current_user.id)
    if not profile:
        return CourierProfileResponse()
    return profile


@router.patch("/courier", response_model=CourierProfileResponse)
async def update_my_courier_profile(
    data: CourierProfileUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_exact_role("courier"))],
):
    profile = await upsert_courier_profile(db, current_user.id, data)
    return profile
