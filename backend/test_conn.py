"""Quick diagnostic — run: python test_conn.py"""
import asyncio
import socket
import sys

# Direct connection host (IPv6 only — won't work on most home/office networks)
# HOST = "db.fqknobdbilbvegaaqync.supabase.co"

# Session Pooler — IPv4 compatible
# Username for pooler = postgres.<project-ref>
HOST = "aws-1-ap-southeast-2.pooler.supabase.com"
PORT = 5432          # session pooler (use 6543 for transaction pooler)
DB   = "postgres"
USER = "postgres.fqknobdbilbvegaaqync"
PASS = "Vansh@131004"

print(f"\n1. Checking DNS for hostname: {HOST}")
try:
    ip = socket.gethostbyname(HOST)
    print(f"   OK  Resolved to {ip}")
except socket.gaierror as e:
    print(f"   FAIL  DNS failed: {e}")
    print("\n   Possible fixes:")
    print("   a) Your Supabase project is paused — go to supabase.com and restore it")
    print("   b) Wrong project ref in the hostname")
    print("   c) No internet from this machine/network")
    sys.exit(1)

print(f"\n2. Checking TCP port {PORT}...")
try:
    sock = socket.create_connection((HOST, PORT), timeout=5)
    sock.close()
    print(f"   OK  Port {PORT} is reachable")
except Exception as e:
    print(f"   FAIL  Cannot reach port {PORT}: {e}")
    print("\n   Try port 6543 (Supabase pooler) instead of 5432")
    sys.exit(1)

print(f"\n3. Testing asyncpg connection...")
async def _test():
    import sys, os
    sys.path.insert(0, os.path.dirname(__file__))
    from app.core.config import settings
    from app.db.dynamic_session import test_connection

    ok, err = await test_connection(
        db_type="postgres",
        host=HOST,
        port=PORT,
        database=DB,
        username=USER,
        password=PASS,
        ssl_enabled=True,
    )
    if ok:
        print("   OK  Connected successfully!")
    else:
        print(f"   FAIL  {err}")

asyncio.run(_test())
