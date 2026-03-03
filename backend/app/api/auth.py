"""
Auth API: регистрация, логин, refresh, текущий пользователь.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi_limiter.depends import RateLimiter
from pyrate_limiter import Duration, Limiter, Rate
from sqlalchemy.ext.asyncio import AsyncSession

# 5 запросов в 60 секунд на auth-эндпоинты
AUTH_LIMITER = Limiter(Rate(5, Duration.SECOND * 60))

from app.api.deps import get_db, get_current_user_model
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.crud.user import (
    get_user_by_username_or_email,
    get_user_by_username,
    get_user_by_email,
    create_user,
    get_user_by_id,
)
from app.models.user import User
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenPair,
    RefreshTokenRequest,
)
from jose import jwt, JWTError
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _make_tokens(user: User) -> TokenPair:
    payload = {"sub": str(user.id), "role": user.role.value}
    return TokenPair(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload),
    )


@router.post(
    "/register",
    response_model=TokenPair,
    dependencies=[Depends(RateLimiter(limiter=AUTH_LIMITER))],
)
async def register(
    data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if await get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if await get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await create_user(db, data)
    return _make_tokens(user)


@router.post(
    "/login",
    response_model=TokenPair,
    dependencies=[Depends(RateLimiter(limiter=AUTH_LIMITER))],
)
async def login(
    data: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await get_user_by_username_or_email(db, data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User is disabled")
    return _make_tokens(user)


@router.post("/refresh", response_model=TokenPair)
async def refresh(
    body: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    try:
        payload = jwt.decode(
            body.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await get_user_by_id(db, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or disabled")
    return _make_tokens(user)


@router.get("/me", response_model=UserResponse)
async def me(
    current_user: Annotated[User, Depends(get_current_user_model)],
):
    return current_user
