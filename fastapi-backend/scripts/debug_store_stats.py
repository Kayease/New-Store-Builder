import asyncio
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin

async def get_real_stats(store_id):
    print(f"--- Fetching Real Stats for Store: {store_id} ---")
    try:
        # Count Products
        prod_res = supabase_admin.table("products").select("id", count="exact").eq("store_id", store_id).limit(1).execute()
        prod_count = prod_res.count if hasattr(prod_res, 'count') else 0
        
        # Count Customers
        cust_res = supabase_admin.table("customers").select("id", count="exact").eq("store_id", store_id).limit(1).execute()
        cust_count = cust_res.count if hasattr(cust_res, 'count') else 0
        
        # Count Categories
        cat_res = supabase_admin.table("categories").select("id", count="exact").eq("store_id", store_id).limit(1).execute()
        cat_count = cat_res.count if hasattr(cat_res, 'count') else 0

        print(f"REAL_PRODUCTS: {prod_count}")
        print(f"REAL_CUSTOMERS: {cust_count}")
        print(f"REAL_CATEGORIES: {cat_count}")
        
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    # Use the store ID from the screenshot: d7402757-8b2f-4635-aefe-e1a2fcff67db
    asyncio.run(get_real_stats("d7402757-8b2f-4635-aefe-e1a2fcff67db"))
