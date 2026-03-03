import asyncio
from concurrent.futures import ThreadPoolExecutor

import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings

BCRYPT_MAX_PASSWORD_BYTES = 72
_hash_executor = ThreadPoolExecutor(max_workers=4)


def _password_bytes(password: str) -> bytes:
    """Приводит пароль к bytes, обрезая до 72 байт (лимит bcrypt)."""
    raw = password.encode("utf-8")
    return raw[:BCRYPT_MAX_PASSWORD_BYTES] if len(raw) > BCRYPT_MAX_PASSWORD_BYTES else raw


def _hash_password_sync(password: str) -> str:
    return bcrypt.hashpw(
        _password_bytes(password),
        bcrypt.gensalt(rounds=12),
    ).decode("utf-8")


async def hash_password(password: str) -> str:
    """Хеширует пароль в отдельном потоке, чтобы не блокировать event loop."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_hash_executor, _hash_password_sync, password)


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(_password_bytes(password), hashed.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)