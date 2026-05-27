from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func, Text
from app.models.base import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id              = Column(Integer, primary_key=True, index=True)
    organisation_id = Column(Integer, ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    name            = Column(String, nullable=False)
    db_type         = Column(String, nullable=False)   # postgres | mysql | mssql | bigquery | snowflake | redshift | sqlite
    host            = Column(String, nullable=True)
    port            = Column(Integer, nullable=True)
    database_name   = Column(String, nullable=True)
    username        = Column(String, nullable=True)
    encrypted_password = Column(Text, nullable=True)   # Fernet encrypted
    ssl_enabled     = Column(Boolean, default=False)
    datasource_key  = Column(String, nullable=True)     # logical key matching dashboard config (e.g. 'sales_db')
    extra_options   = Column(Text, nullable=True)      # JSON string for driver-specific options
    is_active       = Column(Boolean, default=True)
    is_default      = Column(Boolean, default=False)
    status          = Column(String, default="untested")  # untested | connected | failed
    last_tested_at  = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
