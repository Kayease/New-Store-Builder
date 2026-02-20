import asyncio
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin

async def list_all_themes():
    print("--- Listing All Themes ---")
    try:
        res = supabase_admin.table("themes").select("id, name, slug").execute()
        if not res.data:
            print("No themes found.")
            return

        for t in res.data:
            print(f"[{t['name']}] Slug: {t['slug']}")

    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    asyncio.run(list_all_themes())
