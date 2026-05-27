"""
Dynamic per-data-source connection pool.
Engines are cached by datasource id and reused across requests.
"""
from __future__ import annotations

import ssl
from typing import Dict, Tuple, Optional
from urllib.parse import quote_plus

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    create_async_engine, AsyncEngine, AsyncSession, async_sessionmaker,
)

_engine_cache: Dict[int, AsyncEngine] = {}

DB_TYPE_DRIVER = {
    "postgres":   "postgresql+asyncpg",
    "postgresql": "postgresql+asyncpg",
    "mysql":      "mysql+aiomysql",
    "mssql":      "mssql+aioodbc",
    "sqlite":     "sqlite+aiosqlite",
    "redshift":   "postgresql+asyncpg",
    "snowflake":  "snowflake",
    "bigquery":   "bigquery",
}


def _build_url(db_type: str, host: str, port: int, database: str, username: str, password: str) -> str:
    driver = DB_TYPE_DRIVER.get(db_type.lower(), "postgresql+asyncpg")
    if db_type.lower() == "sqlite":
        return f"{driver}:///{database}"
    return f"{driver}://{quote_plus(username)}:{quote_plus(password)}@{host}:{port}/{database}"


def _pg_connect_args(ssl_enabled: bool) -> dict:
    """Build asyncpg connect_args for any postgres-wire-protocol database."""
    args: dict = {"statement_cache_size": 0}
    if ssl_enabled:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        args["ssl"] = ctx
    return args


def _is_pg(db_type: str) -> bool:
    return db_type.lower() in ("postgres", "postgresql", "redshift")


def _make_engine(
    db_type: str,
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
    ssl_enabled: bool,
    pool_size: int = 5,
    max_overflow: int = 10,
) -> AsyncEngine:
    url = _build_url(db_type, host, port, database, username, password)
    connect_args = _pg_connect_args(ssl_enabled) if _is_pg(db_type) else {}
    return create_async_engine(
        url,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


# ── Public API ─────────────────────────────────────────────────────────────────

def get_cached_engine(
    datasource_id: int,
    db_type: str,
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
    ssl_enabled: bool = False,
) -> AsyncEngine:
    """Return cached engine, creating one if not yet cached. Synchronous — no lock needed."""
    if datasource_id not in _engine_cache:
        _engine_cache[datasource_id] = _make_engine(
            db_type, host, port, database, username, password, ssl_enabled
        )
    return _engine_cache[datasource_id]


def invalidate_engine(datasource_id: int) -> None:
    """Remove engine from cache when credentials change."""
    _engine_cache.pop(datasource_id, None)


async def test_connection(
    db_type: str,
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
    ssl_enabled: bool = False,
) -> Tuple[bool, Optional[str]]:
    """Create a fresh (uncached) engine, run SELECT 1, dispose. Returns (success, error_msg)."""
    engine = None
    try:
        engine = _make_engine(
            db_type, host, port, database, username, password,
            ssl_enabled, pool_size=1, max_overflow=0,
        )
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True, None
    except Exception as exc:
        return False, str(exc)
    finally:
        if engine:
            await engine.dispose()


async def get_org_engine(
    organisation_id: int,
    app_db: "AsyncSession",
    datasource_key: "Optional[str]" = None,
) -> "tuple[AsyncEngine, str]":
    """
    Resolve an active datasource for the org from the platform DB.

    When *datasource_key* is given, the datasource whose ``datasource_key``
    matches is returned (enables multiple active DBs — one per dashboard).
    When omitted the datasource marked ``is_default=True`` is preferred;
    if none is default the first active one is used as fallback.

    Returns (AsyncEngine, db_type).
    Raises HTTP 400 if no matching active datasource is found.
    """
    from app.models.datasource import DataSource
    from app.core.encryption import decrypt
    from fastapi import HTTPException
    from sqlalchemy import select

    q = (
        select(DataSource)
        .where(DataSource.organisation_id == organisation_id)
        .where(DataSource.is_active == True)
    )
    if datasource_key:
        q = q.where(DataSource.datasource_key == datasource_key)
    else:
        # Prefer the default one; fall back to any active datasource.
        q = q.order_by(DataSource.is_default.desc())

    result = await app_db.execute(q.limit(1))
    ds = result.scalar_one_or_none()

    if not ds:
        detail = (
            f"No active database with key '{datasource_key}' found for this organisation."
            if datasource_key
            else "No active database configured for this organisation. "
                 "Go to Admin Portal → Data Sources and activate at least one."
        )
        raise HTTPException(status_code=400, detail=detail)

    password = decrypt(ds.encrypted_password) if ds.encrypted_password else ""
    engine = get_cached_engine(
        ds.id, ds.db_type,
        ds.host or "", ds.port or 5432,
        ds.database_name or "", ds.username or "",
        password, ds.ssl_enabled,
    )
    return engine, ds.db_type.lower()


async def get_session_for_datasource(
    datasource_id: int,
    db_type: str,
    host: str,
    port: int,
    database: str,
    username: str,
    password: str,
    ssl_enabled: bool = False,
) -> AsyncSession:
    engine = get_cached_engine(
        datasource_id, db_type, host, port, database, username, password, ssl_enabled
    )
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return Session()
