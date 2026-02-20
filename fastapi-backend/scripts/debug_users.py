
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add parent directory to path to import app modules if needed
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

load_dotenv()


# DATABASE_URL = os.getenv("DATABASE_URL")
# Explicitly testing encoded password
DATABASE_URL = "postgresql://postgres:chirankshi%40123@db.iudccmfgaljflbbbnsbm.supabase.co:5432/postgres"

print(f"Testing SQL Connection string: {DATABASE_URL}")

try:
    # 1. Test SQL
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT count(*) FROM users;"))
        count = result.scalar()
        print(f"✅ SQL Success! User count: {count}")
except Exception as e:
    print(f"❌ SQL Failed: {e}")

try:
    # 2. Test Supabase Client
    from app.core.supabase_client import supabase_admin
    res = supabase_admin.auth.admin.list_users()
    print(f"✅ Supabase Auth Success! Users found: {len(res.users)}")
    # List emails for debugging
    for u in res.users[:5]:
        print(f"   - {u.email}")
except Exception as e:
    print(f"❌ Supabase Client Failed: {e}")
