from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.models.base import Base


class Organisation(Base):
    __tablename__ = "organisations"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, unique=True, nullable=False)
    slug       = Column(String, unique=True, nullable=False, index=True)
    logo_url   = Column(String, nullable=True)
    dashboards = Column(String, nullable=False, default="sales")  # comma-separated keys
    is_active  = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
