from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, func
from app.models.base import Base


class MasterDashboard(Base):
    __tablename__ = "master_dashboards"

    id               = Column(Integer, primary_key=True, index=True)
    organisation_id  = Column(Integer, ForeignKey("organisations.id", ondelete="CASCADE"), nullable=True, index=True)
    created_by       = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title            = Column(String, nullable=False)
    description      = Column(String, nullable=True)
    template_type    = Column(String, nullable=False, default="sidebar")  # 'sidebar' | 'selector'
    datasource_id    = Column(Integer, ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    icon             = Column(String, nullable=True)
    gradient         = Column(String, nullable=True)
    glow             = Column(String, nullable=True)
    is_published     = Column(Boolean, default=False)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SubDashboard(Base):
    __tablename__ = "sub_dashboards"

    id                  = Column(Integer, primary_key=True, index=True)
    master_dashboard_id = Column(Integer, ForeignKey("master_dashboards.id", ondelete="CASCADE"), nullable=False, index=True)
    title               = Column(String, nullable=False)
    description         = Column(String, nullable=True)
    icon                = Column(String, nullable=True)
    order_index         = Column(Integer, default=0)
    is_published        = Column(Boolean, default=False)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ChartWidget(Base):
    __tablename__ = "chart_widgets"

    id              = Column(Integer, primary_key=True, index=True)
    sub_dashboard_id = Column(Integer, ForeignKey("sub_dashboards.id", ondelete="CASCADE"), nullable=True, index=True)
    master_dashboard_id = Column(Integer, ForeignKey("master_dashboards.id", ondelete="CASCADE"), nullable=True, index=True)
    title           = Column(String, nullable=False)
    subtitle        = Column(String, nullable=True)
    widget_key      = Column(String, nullable=True)         # 'custom_chart' or a built-in key
    chart_spec      = Column(JSON, nullable=True)            # CustomChartSpec for custom charts
    grid_x          = Column(Integer, default=0)
    grid_y          = Column(Integer, default=0)
    grid_w          = Column(Integer, default=4)
    grid_h          = Column(Integer, default=5)
    order_index     = Column(Integer, default=0)
    is_published    = Column(Boolean, default=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())