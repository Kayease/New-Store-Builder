import sys
import os

# Fix path before imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin

def get_my_crust_id():
    try:
        res = supabase_admin.table("stores").select("id").eq("slug", "my-crust").single().execute()
        print(f"STORE_ID: {res.data['id']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_my_crust_id()
