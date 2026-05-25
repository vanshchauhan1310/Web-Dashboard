from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import api_router
from app.core.config import settings
from contextlib import asynccontextmanager

from app.db.session import engine
from app.models.base import Base
# Import all models so they are registered with Base
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.models.user import User  # noqa: F401 — registers table with Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    async with engine.begin() as conn:
        # For MVP: Create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for the Analytics Dashboard MVP",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS — origins come from ALLOWED_ORIGINS env var (comma-separated)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to the Enterprise Analytics Dashboard API"}
