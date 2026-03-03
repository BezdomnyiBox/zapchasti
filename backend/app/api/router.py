from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.orders import router as orders_router
from app.api.tasks import router as tasks_router
from app.api.media import router as media_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(orders_router)
router.include_router(tasks_router)
router.include_router(media_router)
