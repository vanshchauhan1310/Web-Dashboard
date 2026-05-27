"""
Aion Tech — Database Migration & Admin Seed
============================================
Usage:
    python seed_users.py          — migrate schema + create admin user (safe to re-run)
    python seed_users.py --list   — print current users from DB
    python seed_users.py --reset  — drop NEW tables only (organisations, data_sources) and re-create
"""

import asyncio
import sys
import os
import re

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, text

from app.core.config import settings
from app.models.base import Base
from app.models.user import User
from app.models.organisation import Organisation
from app.models.datasource import DataSource
from app.auth.security import hash_password


def _make_engine():
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return create_async_engine(
        settings.DATABASE_URL,
        connect_args={"ssl": ctx, "statement_cache_size": 0},
    )


async def _migrate_users_table(conn):
    """Add new columns to existing users table without touching existing data."""
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS organisation_id INTEGER",
    ]
    for sql in migrations:
        await conn.execute(text(sql))
        print(f"  MIGRATE  {sql}")


async def _create_new_tables(conn):
    """Create only the new tables. Never touch orders/products/customers."""
    await conn.run_sync(lambda sync_conn: Base.metadata.create_all(
        sync_conn,
        tables=[
            Organisation.__table__,
            DataSource.__table__,
        ],
    ))
    print("  CREATE   organisations table (if not exists)")
    print("  CREATE   data_sources table (if not exists)")


async def list_users():
    engine = _make_engine()
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        users = (await db.execute(select(User).order_by(User.email))).scalars().all()

    await engine.dispose()

    if not users:
        print("No users found.")
        return

    print(f"\n{'Email':<35} {'Name':<20} {'Admin':<7} {'Org ID':<8} {'Active'}")
    print("-" * 80)
    for u in users:
        print(
            f"{u.email:<35} {(u.full_name or '-'):<20} "
            f"{'yes' if u.is_admin else 'no':<7} "
            f"{(str(u.organisation_id) if u.organisation_id else '-'):<8} "
            f"{'yes' if u.is_active else 'no'}"
        )
    print()


async def seed():
    engine = _make_engine()

    print("\nRunning migrations...")
    async with engine.begin() as conn:
        await _migrate_users_table(conn)
        await _create_new_tables(conn)

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("\nSeeding admin user...")
    async with Session() as db:
        existing = (
            await db.execute(select(User).where(User.email == "admin@aiontech.com"))
        ).scalar_one_or_none()

        if not existing:
            admin = User(
                email="admin@aiontech.com",
                full_name="Aion Tech Admin",
                company="Aion Tech",
                organisation_id=None,
                hashed_password=hash_password("Admin@Aion2024"),
                is_active=True,
                is_admin=True,
                dashboards=["sales", "procurement"],
            )
            db.add(admin)
            print("  CREATE   admin@aiontech.com  (is_admin=True)")
        else:
            existing.is_admin = True
            print("  UPDATE   admin@aiontech.com  ensured is_admin=True")

        await db.commit()

    await engine.dispose()

    print("\nDone.")
    print("\nAdmin credentials:")
    print("  Email:    admin@aiontech.com")
    print("  Password: Admin@Aion2024")
    print("\n  WARNING: Change this password after first login!\n")


async def reset_new_tables():
    confirm = input("This will DROP organisations + data_sources tables only. Type 'yes' to confirm: ")
    if confirm.strip().lower() != "yes":
        print("Aborted.")
        return

    engine = _make_engine()
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS data_sources CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS organisations CASCADE"))
        print("  DROPPED  data_sources, organisations")
        await _create_new_tables(conn)

    await engine.dispose()
    print("Reset complete. Run seed_users.py again to re-seed admin.")


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--list" in args:
        asyncio.run(list_users())
    elif "--reset" in args:
        asyncio.run(reset_new_tables())
    else:
        asyncio.run(seed())
