
import os
import sys
# Add parent dir to path to import app.core
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.supabase_client import supabase_admin

def debug_data():
    try:
        print("--- Stores ---")
        stores = supabase_admin.table("stores").select("id, slug, name").execute()
        store_map = {}
        for s in stores.data:
            print(f"Slug: {s['slug']:<20} | ID: {s['id']}")
            store_map[s['id']] = s['slug']

        print("\n--- Customer Counts per Store ---")
        # We can't do group by easily with basic supabase client sometimes, so let's fetch all and count in python for now (assuming small dataset)
        customers = supabase_admin.table("customers").select("store_id").execute()
        
        from collections import Counter
        counts = Counter([c['store_id'] for c in customers.data if c.get('store_id')])
        
        for store_id, count in counts.items():
            slug = store_map.get(store_id, "UNKNOWN_STORE_ID")
            print(f"Store: {slug:<20} | ID: {store_id} | Count: {count}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_data()
