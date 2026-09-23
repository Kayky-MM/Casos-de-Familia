from fastapi import APIRouter

from routes.people_routes import router as people_router
from routes.user_routes import router as user_router

router = APIRouter()

router.include_router(user_router)
router.include_router(people_router)