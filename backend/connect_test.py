import asyncio
import traceback
from app.db.session import engine

async def main():
    try:
        async with engine.begin() as conn:
            print("connected")
    except Exception:
        traceback.print_exc()

asyncio.run(main())
