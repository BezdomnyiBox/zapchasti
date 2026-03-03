from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user_model, require_role
from app.models.user import User
from app.crud.user import update_user_phone, get_picker_profile, upsert_picker_profile
from app.schemas.auth import (
    UserResponse,
    UserProfileUpdate,
    PickerProfileResponse,
    PickerProfileUpdate,
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


@router.get("/picker", response_model=PickerProfileResponse)
async def get_my_picker_profile(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("picker"))],
):
    profile = await get_picker_profile(db, current_user.id)
    if not profile:
        return PickerProfileResponse()
    return profile


@router.patch("/picker", response_model=PickerProfileResponse)
async def update_my_picker_profile(
    data: PickerProfileUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role("picker"))],
):
    profile = await upsert_picker_profile(db, current_user.id, data)
    return profile
