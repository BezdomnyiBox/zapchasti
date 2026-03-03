from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import UserCreate
from app.core.security import hash_password


async def get_user_by_id(session: AsyncSession, user_id: int) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalars().one_or_none()


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalars().one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalars().one_or_none()


async def get_user_by_username_or_email(
    session: AsyncSession, username_or_email: str
) -> User | None:
    """Поиск пользователя по username или по email (для логина) — один запрос."""
    result = await session.execute(
        select(User).where(
            or_(User.username == username_or_email, User.email == username_or_email)
        )
    )
    return result.scalars().one_or_none()


async def create_user(session: AsyncSession, data: UserCreate) -> User:
    hashed = await hash_password(data.password)
    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hashed,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
