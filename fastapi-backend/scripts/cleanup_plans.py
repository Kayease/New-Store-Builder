import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def cleanup_plans():
    print("Cleaning up duplicate subscription plans...")
    res = supabase.table("subscription_plans").select("*").order("created_at", desc=True).execute()
    plans = res.data or []
    
    seen_names = set()
    to_delete = []
    
    for p in plans:
        name = p["name"]
        if name in seen_names:
            to_delete.append(p["id"])
        else:
            seen_names.add(name)
            
    if not to_delete:
        print("No duplicates found.")
        return
        
    print(f"Deleting {len(to_delete)} duplicate plans...")
    for pid in to_delete:
        try:
            supabase.table("subscription_plans").delete().eq("id", pid).execute()
            print(f"   Deleted plan ID: {pid}")
        except Exception as e:
            print(f"   Failed to delete {pid}: {e}")
            
    print("Cleanup complete.")

if __name__ == "__main__":
    cleanup_plans()
