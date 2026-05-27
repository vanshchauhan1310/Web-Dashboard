from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_admin
from app.auth.security import hash_password
from app.core.encryption import encrypt, decrypt
from app.db.session import get_db
from app.db.dynamic_session import test_connection, invalidate_engine
from app.models.datasource import DataSource
from app.models.organisation import Organisation
from app.models.user import User

router = APIRouter()


# ── helpers ──────────────────────────────────────────────────────────────────

def _slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class OrgOut(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: Optional[str]
    dashboards: str
    is_active: bool
    user_count: int = 0
    datasource_count: int = 0

    class Config:
        from_attributes = True


class OrgCreate(BaseModel):
    name: str
    logo_url: Optional[str] = None
    dashboards: str = "sales"       # comma-separated: "sales,procurement"


class OrgUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    dashboards: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    company: Optional[str]
    organisation_id: Optional[int]
    org_name: Optional[str] = None
    dashboards: list[str]
    is_active: bool
    is_admin: bool

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    organisation_id: Optional[int] = None
    dashboards: list[str] = ["sales"]


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    organisation_id: Optional[int] = None
    dashboards: Optional[list[str]] = None
    is_active: Optional[bool] = None


class ResetPasswordIn(BaseModel):
    new_password: str


class DataSourceOut(BaseModel):
    id: int
    organisation_id: int
    name: str
    db_type: str
    host: Optional[str]
    port: Optional[int]
    database_name: Optional[str]
    username: Optional[str]
    ssl_enabled: bool
    datasource_key: Optional[str]
    is_active: bool
    is_default: bool
    status: str
    last_tested_at: Optional[datetime]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class DataSourceCreate(BaseModel):
    name: str
    db_type: str
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssl_enabled: bool = False
    is_default: bool = False
    datasource_key: Optional[str] = None


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssl_enabled: Optional[bool] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    datasource_key: Optional[str] = None


class StatsOut(BaseModel):
    total_orgs: int
    active_orgs: int
    total_users: int
    active_users: int
    total_datasources: int
    connected_datasources: int


# ── Overview ──────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=StatsOut)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    total_orgs        = (await db.execute(select(func.count()).select_from(Organisation))).scalar_one()
    active_orgs       = (await db.execute(select(func.count()).select_from(Organisation).where(Organisation.is_active == True))).scalar_one()
    total_users       = (await db.execute(select(func.count()).select_from(User).where(User.is_admin == False))).scalar_one()
    active_users      = (await db.execute(select(func.count()).select_from(User).where(User.is_admin == False, User.is_active == True))).scalar_one()
    total_ds          = (await db.execute(select(func.count()).select_from(DataSource))).scalar_one()
    connected_ds      = (await db.execute(select(func.count()).select_from(DataSource).where(DataSource.status == "connected"))).scalar_one()

    return StatsOut(
        total_orgs=total_orgs,
        active_orgs=active_orgs,
        total_users=total_users,
        active_users=active_users,
        total_datasources=total_ds,
        connected_datasources=connected_ds,
    )


# ── Organisations ─────────────────────────────────────────────────────────────

@router.get("/organisations", response_model=list[OrgOut])
async def list_organisations(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    orgs = (await db.execute(select(Organisation).order_by(Organisation.name))).scalars().all()
    result = []
    for org in orgs:
        uc = (await db.execute(select(func.count()).select_from(User).where(User.organisation_id == org.id))).scalar_one()
        dc = (await db.execute(select(func.count()).select_from(DataSource).where(DataSource.organisation_id == org.id))).scalar_one()
        result.append(OrgOut(
            id=org.id, name=org.name, slug=org.slug, logo_url=org.logo_url,
            dashboards=org.dashboards, is_active=org.is_active,
            user_count=uc, datasource_count=dc,
        ))
    return result


@router.post("/organisations", response_model=OrgOut, status_code=201)
async def create_organisation(
    body: OrgCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    slug = _slugify(body.name)
    existing = (await db.execute(select(Organisation).where(Organisation.slug == slug))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Organisation with this name already exists")

    org = Organisation(name=body.name, slug=slug, logo_url=body.logo_url, dashboards=body.dashboards)
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return OrgOut(id=org.id, name=org.name, slug=org.slug, logo_url=org.logo_url,
                  dashboards=org.dashboards, is_active=org.is_active, user_count=0, datasource_count=0)


@router.get("/organisations/{org_id}", response_model=OrgOut)
async def get_organisation(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    org = (await db.execute(select(Organisation).where(Organisation.id == org_id))).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")
    uc = (await db.execute(select(func.count()).select_from(User).where(User.organisation_id == org_id))).scalar_one()
    dc = (await db.execute(select(func.count()).select_from(DataSource).where(DataSource.organisation_id == org_id))).scalar_one()
    return OrgOut(id=org.id, name=org.name, slug=org.slug, logo_url=org.logo_url,
                  dashboards=org.dashboards, is_active=org.is_active, user_count=uc, datasource_count=dc)


@router.patch("/organisations/{org_id}", response_model=OrgOut)
async def update_organisation(
    org_id: int,
    body: OrgUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    org = (await db.execute(select(Organisation).where(Organisation.id == org_id))).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")

    if body.name is not None:
        org.name = body.name
        org.slug = _slugify(body.name)
    if body.logo_url is not None:
        org.logo_url = body.logo_url
    if body.dashboards is not None:
        org.dashboards = body.dashboards
    if body.is_active is not None:
        org.is_active = body.is_active

    await db.commit()
    await db.refresh(org)
    uc = (await db.execute(select(func.count()).select_from(User).where(User.organisation_id == org_id))).scalar_one()
    dc = (await db.execute(select(func.count()).select_from(DataSource).where(DataSource.organisation_id == org_id))).scalar_one()
    return OrgOut(id=org.id, name=org.name, slug=org.slug, logo_url=org.logo_url,
                  dashboards=org.dashboards, is_active=org.is_active, user_count=uc, datasource_count=dc)


@router.delete("/organisations/{org_id}", status_code=204)
async def delete_organisation(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    org = (await db.execute(select(Organisation).where(Organisation.id == org_id))).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")
    await db.delete(org)
    await db.commit()


# ── Users ─────────────────────────────────────────────────────────────────────

async def _enrich_user(user: User, db: AsyncSession) -> UserOut:
    org_name = None
    if user.organisation_id:
        org = (await db.execute(select(Organisation).where(Organisation.id == user.organisation_id))).scalar_one_or_none()
        if org:
            org_name = org.name
    return UserOut(
        id=user.id, email=user.email, full_name=user.full_name,
        company=user.company, organisation_id=user.organisation_id,
        org_name=org_name, dashboards=user.dashboards or [],
        is_active=user.is_active, is_admin=user.is_admin,
    )


@router.get("/users", response_model=list[UserOut])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    users = (await db.execute(select(User).order_by(User.organisation_id, User.email))).scalars().all()
    return [await _enrich_user(u, db) for u in users]


@router.get("/organisations/{org_id}/users", response_model=list[UserOut])
async def list_org_users(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    users = (await db.execute(select(User).where(User.organisation_id == org_id).order_by(User.email))).scalars().all()
    return [await _enrich_user(u, db) for u in users]


@router.post("/organisations/{org_id}/users", response_model=UserOut, status_code=201)
async def create_org_user(
    org_id: int,
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    org = (await db.execute(select(Organisation).where(Organisation.id == org_id))).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")

    existing = (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Inherit org dashboards if not specified
    dashboards = body.dashboards if body.dashboards != ["sales"] else org.dashboards.split(",")

    user = User(
        email=body.email,
        full_name=body.full_name,
        company=org.name,
        organisation_id=org_id,
        hashed_password=hash_password(body.password),
        is_active=True,
        is_admin=False,
        dashboards=dashboards,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return await _enrich_user(user, db)


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: int,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own account via admin panel")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.organisation_id is not None:
        user.organisation_id = body.organisation_id
    if body.dashboards is not None:
        user.dashboards = body.dashboards
    if body.is_active is not None:
        user.is_active = body.is_active

    await db.commit()
    await db.refresh(user)
    return await _enrich_user(user, db)


@router.post("/users/{user_id}/reset-password", status_code=200)
async def reset_password(
    user_id: int,
    body: ResetPasswordIn,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(body.new_password)
    await db.commit()
    return {"status": "ok"}


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    await db.delete(user)
    await db.commit()


# ── Data Sources ──────────────────────────────────────────────────────────────

@router.get("/organisations/{org_id}/datasources", response_model=list[DataSourceOut])
async def list_datasources(
    org_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    rows = (await db.execute(
        select(DataSource).where(DataSource.organisation_id == org_id).order_by(DataSource.name)
    )).scalars().all()
    return rows


@router.post("/organisations/{org_id}/datasources", response_model=DataSourceOut, status_code=201)
async def create_datasource(
    org_id: int,
    body: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    org = (await db.execute(select(Organisation).where(Organisation.id == org_id))).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organisation not found")

    # If set as default, clear existing default for this org
    if body.is_default:
        existing_defaults = (await db.execute(
            select(DataSource).where(DataSource.organisation_id == org_id, DataSource.is_default == True)
        )).scalars().all()
        for ds in existing_defaults:
            ds.is_default = False

    encrypted_pw = encrypt(body.password) if body.password else None

    ds = DataSource(
        organisation_id=org_id,
        name=body.name,
        db_type=body.db_type,
        host=body.host,
        port=body.port,
        database_name=body.database_name,
        username=body.username,
        encrypted_password=encrypted_pw,
        ssl_enabled=body.ssl_enabled,
        datasource_key=body.datasource_key,
        is_default=body.is_default,
        status="untested",
    )
    db.add(ds)
    await db.commit()
    await db.refresh(ds)
    return ds


@router.patch("/organisations/{org_id}/datasources/{ds_id}", response_model=DataSourceOut)
async def update_datasource(
    org_id: int,
    ds_id: int,
    body: DataSourceUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    ds = (await db.execute(
        select(DataSource).where(DataSource.id == ds_id, DataSource.organisation_id == org_id)
    )).scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    if body.name is not None:
        ds.name = body.name
    if body.host is not None:
        ds.host = body.host
    if body.port is not None:
        ds.port = body.port
    if body.database_name is not None:
        ds.database_name = body.database_name
    if body.username is not None:
        ds.username = body.username
    if body.password is not None:
        ds.encrypted_password = encrypt(body.password)
    if body.ssl_enabled is not None:
        ds.ssl_enabled = body.ssl_enabled
    if body.datasource_key is not None:
        ds.datasource_key = body.datasource_key
    if body.is_active is not None:
        ds.is_active = body.is_active
    if body.is_default is not None and body.is_default:
        existing_defaults = (await db.execute(
            select(DataSource).where(DataSource.organisation_id == org_id, DataSource.is_default == True)
        )).scalars().all()
        for d in existing_defaults:
            d.is_default = False
        ds.is_default = True

    ds.status = "untested"
    invalidate_engine(ds_id)   # force reconnect with new credentials
    await db.commit()
    await db.refresh(ds)
    return ds


@router.delete("/organisations/{org_id}/datasources/{ds_id}", status_code=204)
async def delete_datasource(
    org_id: int,
    ds_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    ds = (await db.execute(
        select(DataSource).where(DataSource.id == ds_id, DataSource.organisation_id == org_id)
    )).scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")
    await db.delete(ds)
    await db.commit()


@router.post("/organisations/{org_id}/datasources/{ds_id}/test", response_model=DataSourceOut)
async def test_datasource(
    org_id: int,
    ds_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    ds = (await db.execute(
        select(DataSource).where(DataSource.id == ds_id, DataSource.organisation_id == org_id)
    )).scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    password = decrypt(ds.encrypted_password) if ds.encrypted_password else ""
    success, error = await test_connection(
        db_type=ds.db_type,
        host=ds.host or "",
        port=ds.port or 5432,
        database=ds.database_name or "",
        username=ds.username or "",
        password=password,
        ssl_enabled=ds.ssl_enabled,
    )

    ds.status = "connected" if success else "failed"
    ds.last_tested_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ds)

    if not success:
        msg = error or "Unknown error"
        if "getaddrinfo" in msg or "11001" in msg or "Name or service" in msg:
            msg += " — DNS lookup failed. Check: (1) Supabase project is not paused, (2) host field contains only the hostname (not the full URL)."
        raise HTTPException(status_code=422, detail=f"Connection failed: {msg}")
    return ds


@router.post("/organisations/{org_id}/datasources/{ds_id}/set-active", response_model=DataSourceOut)
async def set_active_datasource(
    org_id: int,
    ds_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Activate this datasource independently — does NOT deactivate other datasources."""
    ds = (await db.execute(
        select(DataSource).where(DataSource.id == ds_id, DataSource.organisation_id == org_id)
    )).scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    ds.is_active = True

    # If there is no other active default, also mark this one as default
    # so that analytics endpoints without a datasource_key still resolve correctly.
    other_default = (await db.execute(
        select(DataSource).where(
            DataSource.organisation_id == org_id,
            DataSource.is_default == True,
            DataSource.is_active == True,
            DataSource.id != ds_id,
        )
    )).scalar_one_or_none()
    if not other_default:
        ds.is_default = True

    await db.commit()
    await db.refresh(ds)
    invalidate_engine(ds_id)
    return ds


@router.post("/organisations/{org_id}/datasources/{ds_id}/set-inactive", response_model=DataSourceOut)
async def set_inactive_datasource(
    org_id: int,
    ds_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Deactivate this datasource — other datasources are not affected."""
    ds = (await db.execute(
        select(DataSource).where(DataSource.id == ds_id, DataSource.organisation_id == org_id)
    )).scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Data source not found")

    ds.is_active = False
    if ds.is_default:
        ds.is_default = False

    await db.commit()
    await db.refresh(ds)
    invalidate_engine(ds_id)
    return ds


