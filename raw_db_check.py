
from supabase import create_client
import json

url = "https://iudccmfgaljflbbbnsbm.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1ZGNjbWZnYWxqZmxiYmJuc2JtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTgyOTY5MCwiZXhwIjoyMDg1NDA1NjkwfQ.-Z5nQh00CyjI3ERQGz8VtO5KJNbPKqC4Upvt_LYs1CM"

sb = create_client(url, key)

def check():
    print("--- RAW DB CHECK ---")
    try:
        # Check Stores
        stores = sb.table("stores").select("*").execute()
        print(f"STORES: {len(stores.data)}")
        for s in stores.data:
            print(f"- Store: {s['slug']} | ID: {s['id']} | Owner: {s['owner_id']}")

        # Check Profiles
        profiles = sb.table("profiles").select("*").execute()
        print(f"PROFILES: {len(profiles.data)}")
        for p in profiles.data:
            print(f"- Profile: {p['email']} | Role: {p['role']} | ID: {p['id']}")

        # Check Managers
        managers = sb.table("store_managers").select("*").execute()
        print(f"MANAGERS: {len(managers.data)}")
        for m in managers.data:
            print(f"- Link: User {m['user_id']} -> Store {m['store_id']} ({m['role']})")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    check()
