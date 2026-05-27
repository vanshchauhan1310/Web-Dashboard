from fastapi import APIRouter, Depends
from app.api import analytics, dashboard
from app.api import admin as admin_router
from app.auth import router as auth_router
from app.auth.deps import get_current_user

api_router = APIRouter()
api_router.include_router(auth_router.router)
api_router.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["analytics"],
    dependencies=[Depends(get_current_user)],
)
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(
    admin_router.router,
    prefix="/admin",
    tags=["admin"],
)
