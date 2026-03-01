from fastapi import APIRouter, Depends, HTTPException
from fastapi_limiter.depends import RateLimiter
from pydantic import BaseModel

router = APIRouter()


class LoginSchema(BaseModel):
    username: str
    password: str


@router.post(
    "/auth/login",
    dependencies=[Depends(RateLimiter(times=5, seconds=60))],
)
async def login(data: LoginSchema):
    """Логин: не более 5 попыток в минуту (защита от brute-force)."""
    # TODO: проверка учётных данных и выдача токена
    raise HTTPException(status_code=401, detail="Invalid credentials")
