"""Recreate dashboard builder tables with updated schema."""
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())

if __name__ == "__main__":
    import asyncio
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine
    from app.core.config import settings
    from app.models.base import Base
    from app.models.dashboard_builder import MasterDashboard, SubDashboard, ChartWidget
    
    async def migrate():
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        engine = create_async_engine(
            settings.DATABASE_URL,
            connect_args={"ssl": ctx, "statement_cache_size": 0},
        )
        
        print("\nRecreating dashboard builder tables...")
        async with engine.begin() as conn:
            await conn.run_sync(lambda sync_conn: Base.metadata.create_all(
                sync_conn,
                tables=[
                    MasterDashboard.__table__,
                    SubDashboard.__table__,
                    ChartWidget.__table__,
                ],
            ))
            print("  CREATE   master_dashboards (organisation_id nullable)")
            print("  CREATE   sub_dashboards")
            print("  CREATE   chart_widgets")
        
        await engine.dispose()
        print("Done.")
    
    asyncio.run(migrate())