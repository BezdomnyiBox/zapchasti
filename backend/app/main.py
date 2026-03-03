import logging
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.database import engine, Base
from app.api.router import router
from app.models import User  # noqa: F401 — регистрируем модели

logger = logging.getLogger(__name__)

app = FastAPI()


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Логируем необработанные исключения (для отладки 500 на сервере)."""
    tb = traceback.format_exc()
    logger.error("Unhandled exception: %s\nPath: %s\n%s", exc, request.url.path, tb)
    # В Docker без настройки logging вывод в stderr виден в docker compose logs
    print(f"[500] {request.url.path}: {exc}\n{tb}", flush=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://saqasapchaas.ru", "http://localhost:5173", "http://79.141.67.75"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.on_event("startup")
async def startup():
    # Создание таблиц (для продакшена лучше использовать Alembic)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "ok"}