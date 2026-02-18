
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin
import pprint

def remove_duplicate_plans():
    print("--- Checking for Duplicate Subscription Plans ---")
    
    # 1. Fetch all plans
    res = supabase_admin.table('subscription_plans').select('*').order('created_at', desc=True).execute()
    all_plans = res.data or []
    
    print(f"Total plans found: {len(all_plans)}")
    
    # 2. Group by name
    plans_by_name = {}
    for plan in all_plans:
        name = plan['name'].strip()
        if name not in plans_by_name:
            plans_by_name[name] = []
        plans_by_name[name].append(plan)
        
    # 3. Process duplicates
    deleted_count = 0
    skipped_count = 0
    
    for name, plans in plans_by_name.items():
        if len(plans) > 1:
            print(f"\nFound {len(plans)} versions of '{name}'")
            # Keep the newest one (first in list due to sort desc)
            keep_plan = plans[0]
            remove_plans = plans[1:]
            
            print(f"  Keeping: ID {keep_plan['id']} (Created: {keep_plan['created_at']})")
            
            for remove_plan in remove_plans:
                pid = remove_plan['id']
                print(f"  Checking ID to remove: {pid} (Created: {remove_plan['created_at']})")
                
                # Check usage in stores
                store_usage = supabase_admin.table('stores').select('id').eq('plan_id', pid).execute()
                sub_usage = supabase_admin.table('subscriptions').select('id').eq('plan_id', pid).execute()
                
                is_used = len(store_usage.data) > 0 or len(sub_usage.data) > 0
                
                if is_used:
                    print(f"    ⚠️ SKIPPING: Plan is in use (Stores: {len(store_usage.data)}, Subs: {len(sub_usage.data)})")
                    skipped_count += 1
                else:
                    print(f"    🗑️ DELETING Plan ID: {pid}")
                    del_res = supabase_admin.table('subscription_plans').delete().eq('id', pid).execute()
                    if del_res.data:
                        print("      ✅ Deleted successfully.")
                        deleted_count += 1
                    else:
                        print("      ❌ Failed to delete.")
                        
    print(f"\n--- Cleanup Complete ---")
    print(f"Deleted: {deleted_count} plans")
    print(f"Skipped (In Use): {skipped_count} plans")

if __name__ == "__main__":
    remove_duplicate_plans()
