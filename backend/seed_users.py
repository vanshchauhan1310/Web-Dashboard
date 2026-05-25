"""
User & Dashboard Access Management
====================================
This file is the single source of truth for which company gets access to
which master dashboards. Edit USERS_TO_CREATE and re-run the script.

Usage:
    python seed_users.py          — create new users (skips existing emails)
    python seed_users.py --list   — print current company → dashboard mapping from DB
    python seed_users.py --update — update dashboards for existing users (use after editing list)

Available master dashboard keys (must match keys in frontend/src/config/dashboards.ts):
    "sales"  → Sales Dashboard  (Executive, Geography, Products, Shipping)
    "procurement" → Procurement Dashboard (Spend, Supplier, Orders, Inventory)

To add a new master dashboard:
    1. Add its key + config to frontend/src/config/dashboards.ts
    2. Assign it here in the dashboards list for the relevant company users
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, text

from app.core.config import settings
from app.models.base import Base
from app.models.user import User
from app.auth.security import hash_password


# ══════════════════════════════════════════════════════════════════
#  COMPANY → DASHBOARD MAPPING
#  One entry per user. To give a company access to more dashboards,
#  add more keys to their "dashboards" list e.g. ["sales", "ops"]
# ══════════════════════════════════════════════════════════════════
USERS_TO_CREATE = [
    # ── Internal admin ─────────────────────────────────────────────
    {
        "email":      "admin@nexus.com",
        "password":   "Admin@123",
        "full_name":  "Nexus Admin",
        "company":    "Nexus Analytics",
        "dashboards": ["sales"],          # full access
    },

    # ── Client: Acme Corp ──────────────────────────────────────────
    {
        "email":      "client@acmecorp.com",
        "password":   "Acme@2024",
        "full_name":  "Acme Client",
        "company":    "Acme Corp",
        "dashboards": ["sales","procurement"],
    },

    # ── Add more clients below ─────────────────────────────────────
    # {
    #     "email":      "user@newclient.com",
    #     "password":   "Temp@1234",
    #     "full_name":  "New Client User",
    #     "company":    "New Client Ltd",
    #     "dashboards": ["sales"],
    # },
]
# ══════════════════════════════════════════════════════════════════


def _make_engine():
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return create_async_engine(
        settings.DATABASE_URL,
        connect_args={"ssl": ctx, "statement_cache_size": 0},
    )


async def list_access():
    """Print current company → dashboard mapping from the database."""
    engine = _make_engine()
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        result = await db.execute(
            select(User.company, User.email, User.dashboards, User.is_active)
            .order_by(User.company, User.email)
        )
        rows = result.all()

    await engine.dispose()

    if not rows:
        print("No users found in database.")
        return

    print(f"\n{'Company':<25} {'Email':<30} {'Dashboards':<20} Active")
    print("-" * 85)
    for company, email, dashboards, active in rows:
        dash_str = ", ".join(dashboards or [])
        status   = "yes" if active else "no (disabled)"
        print(f"{(company or '-'):<25} {email:<30} {dash_str:<20} {status}")
    print()


async def seed(update_existing: bool = False):
    engine = _make_engine()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        for u in USERS_TO_CREATE:
            result  = await db.execute(select(User).where(User.email == u["email"]))
            existing = result.scalar_one_or_none()

            if existing:
                if update_existing:
                    existing.dashboards = u["dashboards"]
                    existing.full_name  = u["full_name"]
                    existing.company    = u["company"]
                    existing.is_active  = True
                    print(f"  UPDATE {u['email']}  dashboards={u['dashboards']}")
                else:
                    print(f"  SKIP   {u['email']} — already exists (use --update to overwrite)")
                continue

            db.add(User(
                email           = u["email"],
                full_name       = u["full_name"],
                company         = u["company"],
                hashed_password = hash_password(u["password"]),
                is_active       = True,
                dashboards      = u["dashboards"],
            ))
            print(f"  CREATE {u['email']}  company={u['company']}  dashboards={u['dashboards']}")

        await db.commit()

    await engine.dispose()
    print("\nDone.")


if __name__ == "__main__":
    args = sys.argv[1:]
    if "--list" in args:
        asyncio.run(list_access())
    elif "--update" in args:
        asyncio.run(seed(update_existing=True))
    else:
        asyncio.run(seed(update_existing=False))
