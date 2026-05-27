from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    full_name       = Column(String, nullable=True)
    company         = Column(String, nullable=True)          # kept for legacy / admin display
    organisation_id = Column(Integer, ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True, index=True)
    hashed_password = Column(String, nullable=False)
    is_active       = Column(Boolean, default=True)
    is_admin        = Column(Boolean, default=False)
    dashboards      = Column(JSON, default=lambda: ["sales"])
