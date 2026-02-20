import asyncio
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin

async def find_urban_kicks():
    print("--- Searching for 'Urban Kicks' Theme ---")
    try:
        res = supabase_admin.table("themes").select("*").ilike("name", "%Urban Kicks%").execute()
        if not res.data:
            print("ERROR: Theme 'Urban Kicks' not found in database.")
            return

        for t in res.data:
            print(f"ID: {t['id']}")
            print(f"Name: {t['name']}")
            print(f"Slug: {t['slug']}")
            
            # Check disk
            slug = t['slug']
            path = f"D:/CHIRANKSHI/Store-Builder/uploads/themes/{slug}/out/index.html"
            if os.path.exists(path):
                print(f"FOUND_INDEX: {path}")
            else:
                print(f"NOT_FOUND: {path}")

    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    asyncio.run(find_urban_kicks())
