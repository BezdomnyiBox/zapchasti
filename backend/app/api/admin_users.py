from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_exact_role
from app.crud.user import (
    create_user_with_role,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    list_users,
    update_user_role,
)
from app.models.user import User
from app.schemas.admin_users import (
    AdminUserCreateRequest,
    AdminUserResponse,
    AdminUserRoleUpdateRequest,
    AdminUsersListResponse,
)

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


@router.get("", response_model=AdminUsersListResponse)
async def get_admin_users(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_exact_role("admin"))],
    search: str | None = Query(None, min_length=1, max_length=100),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    users, total = await list_users(db, search=search, limit=limit, offset=offset)
    return AdminUsersListResponse(items=users, total=total, limit=limit, offset=offset)


@router.post("", response_model=AdminUserResponse)
async def create_admin_user(
    payload: AdminUserCreateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_exact_role("admin"))],
):
    if await get_user_by_username(db, payload.username):
        raise HTTPException(400, "Username already taken")
    if await get_user_by_email(db, payload.email):
        raise HTTPException(400, "Email already registered")
    user = await create_user_with_role(
        db,
        email=payload.email,
        username=payload.username,
        password=payload.password,
        role=payload.role,
        phone=payload.phone,
    )
    return user


@router.patch("/{user_id}/role", response_model=AdminUserResponse)
async def patch_admin_user_role(
    user_id: int,
    payload: AdminUserRoleUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_exact_role("admin"))],
):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    if current_admin.id == user.id and payload.role.value != "admin":
        raise HTTPException(400, "Нельзя снять роль admin у текущего пользователя")
    updated = await update_user_role(db, user, payload.role)
    return updated
