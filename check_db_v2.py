
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(r"d:\CHIRANKSHI\Store-Builder\fastapi-backend")

from app.core.supabase_client import supabase_admin

def diagnostic():
    print("🔍 DIAGNOSTIC: Checking Manager Accounts...")
    
    try:
        # 1. Check Profiles
        profiles = supabase_admin.table("profiles").select("*").execute()
        print(f"\n--- Registered Profiles ({len(profiles.data)}) ---")
        for p in profiles.data:
            print(f"UID: {p['id']} | Email: {p.get('email', 'N/A')} | Role: {p.get('role', 'N/A')} | Status: {p.get('status', 'N/A')}")

        # 2. Check Store Managers (Links)
        links = supabase_admin.table("store_managers").select("*").execute()
        print(f"\n--- Store-Manager Links ({len(links.data)}) ---")
        for l in links.data:
            print(f"User ID: {l['user_id']} | Store ID: {l['store_id']} | Role: {l['role']}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    diagnostic()
