
from app.core.supabase_client import supabase_admin
import json

def diagnostic():
    print("🔍 DIAGNOSTIC: Checking Manager Accounts...")
    
    # 1. Check Profiles
    profiles = supabase_admin.table("profiles").select("*").execute()
    print(f"\n--- Registered Profiles ({len(profiles.data)}) ---")
    for p in profiles.data:
        print(f"UID: {p['id']} | Email: {p['email']} | Role: {p['role']} | Status: {p['status']}")

    # 2. Check Store Managers (Links)
    links = supabase_admin.table("store_managers").select("*").execute()
    print(f"\n--- Store-Manager Links ({len(links.data)}) ---")
    for l in links.data:
        print(f"User ID: {l['user_id']} | Store ID: {l['store_id']} | Role: {l['role']}")

    # 3. Check Stores owner_id
    stores = supabase_admin.table("stores").select("id, slug, owner_id").execute()
    print(f"\n--- Store Owners ({len(stores.data)}) ---")
    for s in stores.data:
        print(f"Store: {s['slug']} | Owner UID: {s['owner_id']}")

if __name__ == "__main__":
    diagnostic()
