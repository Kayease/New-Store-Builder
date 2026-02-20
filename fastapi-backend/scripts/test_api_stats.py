import asyncio
import os
import sys
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin

async def test_api_response(store_id):
    print(f"--- Testing Backend Logic for Store: {store_id} ---")
    try:
        # Simulate get_store logic
        response = supabase_admin.table("stores").select("*").eq("id", store_id).single().execute()
        if not response.data:
            print("Store not found")
            return
        
        store = response.data
        
        # Real statistics
        prod_count = getattr(supabase_admin.table("products").select("id", count="exact").eq("store_id", store_id).limit(1).execute(), 'count', 0)
        cust_count = getattr(supabase_admin.table("customers").select("id", count="exact").eq("store_id", store_id).limit(1).execute(), 'count', 0)
        cat_count = getattr(supabase_admin.table("categories").select("id", count="exact").eq("store_id", store_id).limit(1).execute(), 'count', 0)
        
        store_slug = store.get("slug")
        team_count = getattr(supabase_admin.table("profiles").select("id", count="exact").eq("store_slug", store_slug).limit(1).execute(), 'count', 0) if store_slug else 0

        # Construct what would be returned
        stats = {
            "activeProducts": prod_count,
            "activeCustomers": cust_count,
            "activeCategories": cat_count,
            "teamSize": team_count,
            "uptime": "99.98%",
            "latency": "22ms"
        }
        
        print(f"Computed Stats: {json.dumps(stats, indent=2)}")
        
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    asyncio.run(test_api_response("d7402757-8b2f-4635-aefe-e1a2fcff67db"))
