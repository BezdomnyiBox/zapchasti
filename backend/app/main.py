from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis
from fastapi_limiter import FastAPILimiter

from app.core.config import settings
from app.core.database import engine, Base
from app.api.router import router
from app.models import User  # noqa: F401 — регистрируем модели

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.on_event("startup")
async def startup():
    redis_client = redis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
    await FastAPILimiter.init(redis_client)
    # Создание таблиц (для продакшена лучше использовать Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "ok"}