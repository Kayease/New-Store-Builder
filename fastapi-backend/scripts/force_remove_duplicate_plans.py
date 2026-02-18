
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin
import pprint

def force_remove_duplicate_plans():
    print("--- 🚨 FORCING Duplicate Plan Removal 🚨 ---")
    
    # 1. Fetch plans
    res = supabase_admin.table('subscription_plans').select('*').order('created_at', desc=True).execute()
    all_plans = res.data or []
    print(f"Total plans: {len(all_plans)}")
    
    # 2. Group by name
    plans_by_name = {}
    for plan in all_plans:
        name = plan['name'].strip()
        if name not in plans_by_name:
            plans_by_name[name] = []
        plans_by_name[name].append(plan)
        
    for name, plans in plans_by_name.items():
        if len(plans) > 1:
            print(f"\nProcessing '{name}' ({len(plans)} versions)")
            # Newest one to keep
            new_plan = plans[0]
            old_plans = plans[1:]
            
            new_id = new_plan['id']
            print(f"  ✅ Keeping New Plan: {new_id} ({new_plan['created_at']})")
            
            for old_plan in old_plans:
                old_id = old_plan['id']
                print(f"  🔸 Migrating old plan {old_id}...")
                
                # Migrate Stores
                stores = supabase_admin.table('stores').select('id').eq('plan_id', old_id).execute()
                for store in stores.data:
                    print(f"    Updating store {store['id']} -> new plan {new_id}")
                    supabase_admin.table('stores').update({'plan_id': new_id}).eq('id', store['id']).execute()
                    
                # Migrate Subscriptions
                subs = supabase_admin.table('subscriptions').select('id').eq('plan_id', old_id).execute()
                for sub in subs.data:
                    print(f"    Updating subscription {sub['id']} -> new plan {new_id}")
                    supabase_admin.table('subscriptions').update({'plan_id': new_id}).eq('id', sub['id']).execute()

                # Delete old plan
                print(f"    🗑️ Deleting old plan {old_id}...")
                del_res = supabase_admin.table('subscription_plans').delete().eq('id', old_id).execute()
                if del_res.data:
                    print("      ✅ Deleted.")
                else:
                    print(f"      ❌ Failed to delete: {del_res.error if hasattr(del_res, 'error') else 'Unknown error'}")

    print("\n--- Done ---")

if __name__ == "__main__":
    force_remove_duplicate_plans()
