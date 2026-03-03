from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.orders import router as orders_router
from app.api.courier import router as courier_router
from app.api.carrier import router as carrier_router
from app.api.reviews import router as reviews_router
from app.api.media import router as media_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(profile_router)
router.include_router(orders_router)
router.include_router(courier_router)
router.include_router(carrier_router)
router.include_router(reviews_router)
router.include_router(media_router)
