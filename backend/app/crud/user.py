from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, CourierProfile
from app.schemas.auth import UserCreate, CourierProfileUpdate
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
    session: AsyncSession, username_or_email: str,
) -> User | None:
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


async def create_user_with_role(
    session: AsyncSession,
    *,
    email: str,
    username: str,
    password: str,
    role,
    phone: str | None = None,
) -> User:
    hashed = await hash_password(password)
    user = User(
        email=email,
        username=username,
        hashed_password=hashed,
        role=role,
        phone=phone,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def update_user_phone(session: AsyncSession, user: User, phone: str | None) -> User:
    user.phone = phone
    await session.commit()
    await session.refresh(user)
    return user


async def list_users(
    session: AsyncSession,
    *,
    search: str | None,
    limit: int,
    offset: int,
) -> tuple[list[User], int]:
    query = select(User)
    count_query = select(func.count(User.id))
    if search:
        term = search.strip()
        if term:
            predicate = or_(
                User.username.ilike(f"%{term}%"),
                User.email.ilike(f"%{term}%"),
                User.phone.ilike(f"%{term}%"),
            )
            query = query.where(predicate)
            count_query = count_query.where(predicate)
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    result = await session.execute(query)
    total = await session.scalar(count_query)
    return list(result.scalars().all()), int(total or 0)


async def update_user_role(session: AsyncSession, user: User, role) -> User:
    user.role = role
    await session.commit()
    await session.refresh(user)
    return user


# ── Courier profile ──────────────────────────────────────

async def get_courier_profile(session: AsyncSession, user_id: int) -> CourierProfile | None:
    result = await session.execute(
        select(CourierProfile).where(CourierProfile.user_id == user_id)
    )
    return result.scalars().one_or_none()


async def upsert_courier_profile(
    session: AsyncSession, user_id: int, data: CourierProfileUpdate,
) -> CourierProfile:
    profile = await get_courier_profile(session, user_id)
    if not profile:
        profile = CourierProfile(user_id=user_id)
        session.add(profile)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    await session.commit()
    await session.refresh(profile)
    return profile
