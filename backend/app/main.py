import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.database import engine, Base
from app.api.router import router
from app.models import User, Order, SelectionTask, PickupTask, DeliveryTask, OrderPhoto  # noqa: F401

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from app.core.s3 import ensure_bucket
        ensure_bucket()
    except Exception as e:
        logger.warning("S3 bucket check skipped: %s", e)
    yield


app = FastAPI(lifespan=lifespan)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    logger.error("Unhandled exception: %s\nPath: %s\n%s", exc, request.url.path, tb)
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

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"status": "ok"}