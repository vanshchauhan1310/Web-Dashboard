from __future__ import annotations

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.auth.deps import get_current_user
from app.models.user import User
from app.models.organisation import Organisation
from app.models.datasource import DataSource
from app.models.dashboard_builder import MasterDashboard, SubDashboard, ChartWidget

router = APIRouter()

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ChartSpec(BaseModel):
    xField:     str
    yField:     str
    yAgg:       str
    colorField: Optional[str] = None
    chartType:  str
    limit:      int = 20

class MasterDashboardCreate(BaseModel):
    title:         str
    description:   Optional[str] = None
    template_type: str = "sidebar"  # 'sidebar' | 'selector'
    datasource_id: Optional[int] = None
    icon:          Optional[str] = None
    gradient:      Optional[str] = None
    glow:          Optional[str] = None

class MasterDashboardUpdate(BaseModel):
    title:         Optional[str] = None
    description:   Optional[str] = None
    template_type: Optional[str] = None
    datasource_id: Optional[int] = None
    icon:          Optional[str] = None
    gradient:      Optional[str] = None
    glow:          Optional[str] = None
    is_published:  Optional[bool] = None

class SubDashboardCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    icon:        Optional[str] = None
    order_index: int = 0

class SubDashboardUpdate(BaseModel):
    title:       Optional[str] = None
    description: Optional[str] = None
    icon:        Optional[str] = None
    order_index: Optional[int] = None
    is_published: Optional[bool] = None

class ChartWidgetCreate(BaseModel):
    title:      str
    subtitle:   Optional[str] = None
    widget_key: Optional[str] = None
    chart_spec: Optional[ChartSpec] = None
    grid_x:     int = 0
    grid_y:     int = 0
    grid_w:     int = 4
    grid_h:     int = 5

class ChartWidgetUpdate(BaseModel):
    title:      Optional[str] = None
    subtitle:   Optional[str] = None
    chart_spec: Optional[ChartSpec] = None
    grid_x:     Optional[int] = None
    grid_y:     Optional[int] = None
    grid_w:     Optional[int] = None
    grid_h:     Optional[int] = None

# ── Response models ───────────────────────────────────────────────────────────

class ChartWidgetOut(BaseModel):
    id: int
    sub_dashboard_id: Optional[int] = None
    master_dashboard_id: Optional[int] = None
    title: str
    subtitle: Optional[str] = None
    widget_key: Optional[str] = None
    chart_spec: Optional[dict] = None
    grid_x: int
    grid_y: int
    grid_w: int
    grid_h: int
    is_published: bool

    class Config:
        from_attributes = True

class SubDashboardOut(BaseModel):
    id: int
    master_dashboard_id: int
    title: str
    description: Optional[str] = None
    icon: Optional[str] = None
    order_index: int
    is_published: bool

    class Config:
        from_attributes = True

class MasterDashboardOut(BaseModel):
    id: int
    organisation_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    template_type: str
    datasource_id: Optional[int] = None
    icon: Optional[str] = None
    gradient: Optional[str] = None
    glow: Optional[str] = None
    is_published: bool

    class Config:
        from_attributes = True

# ── Helper ────────────────────────────────────────────────────────────────────

def _org_filter(current_user: User):
    """Return a filter clause for the user's organisation, or None for super admins."""
    org_id = current_user.organisation_id
    if org_id is not None:
        return MasterDashboard.organisation_id == org_id
    return None  # super admin sees all

# ── Master Dashboard CRUD ─────────────────────────────────────────────────────

@router.get("/master-dashboards", response_model=List[MasterDashboardOut])
async def list_master_dashboards(
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(MasterDashboard)
    org_filter = _org_filter(current_user)
    if org_filter is not None:
        stmt = stmt.where(org_filter)
    # Non-builders and non-admins only see published dashboards
    if not current_user.is_builder and not current_user.is_admin:
        stmt = stmt.where(MasterDashboard.is_published == True)
    result = await app_db.execute(stmt.order_by(MasterDashboard.created_at.desc()))
    return result.scalars().all()


@router.get("/master-dashboards/{dashboard_id}", response_model=MasterDashboardOut)
async def get_master_dashboard(
    dashboard_id: int,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(MasterDashboard).where(MasterDashboard.id == dashboard_id)
    org_filter = _org_filter(current_user)
    if org_filter is not None:
        stmt = stmt.where(org_filter)
    result = await app_db.execute(stmt)
    db = result.scalar_one_or_none()
    if not db:
        raise HTTPException(status_code=404, detail="Master dashboard not found")
    return db


@router.post("/master-dashboards", response_model=MasterDashboardOut, status_code=201)
async def create_master_dashboard(
    body: MasterDashboardCreate,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db = MasterDashboard(
        organisation_id=current_user.organisation_id,
        created_by=current_user.id,
        title=body.title,
        description=body.description,
        template_type=body.template_type,
        datasource_id=body.datasource_id,
        icon=body.icon,
        gradient=body.gradient,
        glow=body.glow,
    )
    app_db.add(db)
    await app_db.commit()
    await app_db.refresh(db)
    return db


@router.put("/master-dashboards/{dashboard_id}", response_model=MasterDashboardOut)
async def update_master_dashboard(
    dashboard_id: int,
    body: MasterDashboardUpdate,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(MasterDashboard).where(MasterDashboard.id == dashboard_id)
    org_filter = _org_filter(current_user)
    if org_filter is not None:
        stmt = stmt.where(org_filter)
    result = await app_db.execute(stmt)
    db = result.scalar_one_or_none()
    if not db:
        raise HTTPException(status_code=404, detail="Master dashboard not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(db, field, value)
    await app_db.commit()
    await app_db.refresh(db)
    return db


@router.delete("/master-dashboards/{dashboard_id}", status_code=204)
async def delete_master_dashboard(
    dashboard_id: int,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(MasterDashboard).where(MasterDashboard.id == dashboard_id)
    org_filter = _org_filter(current_user)
    if org_filter is not None:
        stmt = stmt.where(org_filter)
    result = await app_db.execute(stmt)
    db = result.scalar_one_or_none()
    if not db:
        raise HTTPException(status_code=404, detail="Master dashboard not found")
    await app_db.delete(db)
    await app_db.commit()


@router.post("/master-dashboards/{dashboard_id}/publish")
async def publish_master_dashboard(
    dashboard_id: int,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(MasterDashboard).where(MasterDashboard.id == dashboard_id)
    org_filter = _org_filter(current_user)
    if org_filter is not None:
        stmt = stmt.where(org_filter)
    result = await app_db.execute(stmt)
    db = result.scalar_one_or_none()
    if not db:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    db.is_published = True
    await app_db.commit()
    return {"is_published": True}


@router.post("/master-dashboards/{dashboard_id}/unpublish")
async def unpublish_master_dashboard(
    dashboard_id: int,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(MasterDashboard).where(MasterDashboard.id == dashboard_id)
    org_filter = _org_filter(current_user)
    if org_filter is not None:
        stmt = stmt.where(org_filter)
    result = await app_db.execute(stmt)
    db = result.scalar_one_or_none()
    if not db:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    db.is_published = False
    await app_db.commit()
    return {"is_published": False}

# ── Sub Dashboard CRUD ────────────────────────────────────────────────────────

@router.get("/master-dashboards/{master_id}/dashboards", response_model=List[SubDashboardOut])
async def list_sub_dashboards(
    master_id: int,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await app_db.execute(
        select(SubDashboard)
        .where(SubDashboard.master_dashboard_id == master_id)
        .order_by(SubDashboard.order_index)
    )
    return result.scalars().all()


@router.post("/master-dashboards/{master_id}/dashboards", response_model=SubDashboardOut, status_code=201)
async def create_sub_dashboard(
    master_id: int,
    body: SubDashboardCreate,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db = SubDashboard(
        master_dashboard_id=master_id,
        title=body.title,
        description=body.description,
        icon=body.icon,
        order_index=body.order_index,
    )
    app_db.add(db)
    await app_db.commit()
    await app_db.refresh(db)
    return db


@router.put("/dashboards/{dashboard_id}", response_model=SubDashboardOut)
async def update_sub_dashboard(
    dashboard_id: int,
    body: SubDashboardUpdate,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await app_db.execute(
        select(SubDashboard).where(SubDashboard.id == dashboard_id)
    )
    db = result.scalar_one_or_none()
    if not db:
        raise HTTPException(status_code=404, detail="Sub dashboard not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(db, field, value)
    await app_db.commit()
    await app_db.refresh(db)
    return db


@router.delete("/dashboards/{dashboard_id}", status_code=204)
async def delete_sub_dashboard(
    dashboard_id: int,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await app_db.execute(
        select(SubDashboard).where(SubDashboard.id == dashboard_id)
    )
    db = result.scalar_one_or_none()
    if not db:
        raise HTTPException(status_code=404, detail="Sub dashboard not found")
    await app_db.delete(db)
    await app_db.commit()

# ── Chart Widget CRUD ─────────────────────────────────────────────────────────

@router.get("/dashboards/{dashboard_id}/widgets", response_model=List[ChartWidgetOut])
async def list_chart_widgets(
    dashboard_id: int,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await app_db.execute(
        select(ChartWidget)
        .where(ChartWidget.sub_dashboard_id == dashboard_id)
        .order_by(ChartWidget.order_index)
    )
    return result.scalars().all()


@router.post("/dashboards/{dashboard_id}/widgets", response_model=ChartWidgetOut, status_code=201)
async def create_chart_widget(
    dashboard_id: int,
    body: ChartWidgetCreate,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db = ChartWidget(
        sub_dashboard_id=dashboard_id,
        title=body.title,
        subtitle=body.subtitle,
        widget_key=body.widget_key,
        chart_spec=body.chart_spec.model_dump() if body.chart_spec else None,
        grid_x=body.grid_x,
        grid_y=body.grid_y,
        grid_w=body.grid_w,
        grid_h=body.grid_h,
    )
    app_db.add(db)
    await app_db.commit()
    await app_db.refresh(db)
    return db


@router.put("/widgets/{widget_id}", response_model=ChartWidgetOut)
async def update_chart_widget(
    widget_id: int,
    body: ChartWidgetUpdate,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await app_db.execute(
        select(ChartWidget).where(ChartWidget.id == widget_id)
    )
    db = result.scalar_one_or_none()
    if not db:
        raise HTTPException(status_code=404, detail="Widget not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(db, field, value)
    await app_db.commit()
    await app_db.refresh(db)
    return db


@router.delete("/widgets/{widget_id}", status_code=204)
async def delete_chart_widget(
    widget_id: int,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await app_db.execute(
        select(ChartWidget).where(ChartWidget.id == widget_id)
    )
    db = result.scalar_one_or_none()
    if not db:
        raise HTTPException(status_code=404, detail="Widget not found")
    await app_db.delete(db)
    await app_db.commit()


# ── Bulk update widget positions (for drag-and-drop grid save) ────────────────

class WidgetPosition(BaseModel):
    id: int
    grid_x: int
    grid_y: int
    grid_w: int
    grid_h: int


class WidgetPositionPayload(BaseModel):
    positions: List[WidgetPosition]


@router.put("/dashboards/{dashboard_id}/widgets/positions")
async def bulk_update_widget_positions(
    dashboard_id: int,
    body: WidgetPositionPayload,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for pos in body.positions:
        result = await app_db.execute(
            select(ChartWidget).where(
                ChartWidget.id == pos.id,
                ChartWidget.sub_dashboard_id == dashboard_id,
            )
        )
        db = result.scalar_one_or_none()
        if db:
            db.grid_x = pos.grid_x
            db.grid_y = pos.grid_y
            db.grid_w = pos.grid_w
            db.grid_h = pos.grid_h
    await app_db.commit()
    return {"status": "ok"}


# ── Master Dashboard Widgets (charts directly on master, not sub-page) ────────

class MasterWidgetCreate(BaseModel):
    title:      str
    subtitle:   Optional[str] = None
    chart_spec: Optional[ChartSpec] = None
    grid_x:     int = 0
    grid_y:     int = 0
    grid_w:     int = 4
    grid_h:     int = 5

class MasterWidgetOut(BaseModel):
    id:                  int
    master_dashboard_id: int
    sub_dashboard_id:    Optional[int] = None
    title:               str
    subtitle:            Optional[str] = None
    widget_key:          Optional[str] = None
    chart_spec:          Optional[dict] = None
    grid_x:              int
    grid_y:              int
    grid_w:              int
    grid_h:              int
    is_published:        bool

    class Config:
        from_attributes = True

@router.get("/master-dashboards/{master_id}/widgets", response_model=List[MasterWidgetOut])
async def list_master_widgets(
    master_id: int,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await app_db.execute(
        select(ChartWidget)
        .where(ChartWidget.master_dashboard_id == master_id)
        .where(ChartWidget.sub_dashboard_id == None)
        .order_by(ChartWidget.order_index)
    )
    return result.scalars().all()


@router.post("/master-dashboards/{master_id}/widgets", response_model=MasterWidgetOut, status_code=201)
async def create_master_widget(
    master_id: int,
    body: MasterWidgetCreate,
    app_db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db = ChartWidget(
        master_dashboard_id=master_id,
        sub_dashboard_id=None,
        title=body.title,
        subtitle=body.subtitle,
        widget_key="custom_chart",
        chart_spec=body.chart_spec.model_dump() if body.chart_spec else None,
        grid_x=body.grid_x,
        grid_y=body.grid_y,
        grid_w=body.grid_w,
        grid_h=body.grid_h,
    )
    app_db.add(db)
    await app_db.commit()
    await app_db.refresh(db)
    return db