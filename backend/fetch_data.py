import asyncio
from sqlalchemy import text
from app.db.session import engine

async def main():
    async with engine.connect() as conn:
        print("=== public tables ===")
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"))
        tables = [row[0] for row in result.fetchall()]
        print(tables)

        print("=== trying lower-case orders ===")
        result = await conn.execute(text("SELECT * FROM orders LIMIT 5"))
        rows = result.mappings().all()
        print(f"orders rows: {len(rows)}")
        for row in rows:
            print(dict(row))

        print("=== trying quoted Orders ===")
        result = await conn.execute(text('SELECT * FROM "Orders" LIMIT 5'))
        rows = result.mappings().all()
        print(f'"Orders" rows: {len(rows)}')
        for row in rows:
            print(dict(row))

if __name__ == "__main__":
    asyncio.run(main())
