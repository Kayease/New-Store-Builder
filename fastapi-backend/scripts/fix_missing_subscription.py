
import sys
import os
import uuid
from datetime import datetime
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin

def fix_store_subscription(slug='my-crust'):
    print(f"\n--- Fixing Subscription for Store: {slug} ---")
    
    # 1. Get Store
    store_res = supabase_admin.table('stores').select('*').eq('slug', slug).single().execute()
    if not store_res.data:
        print(f"❌ Store '{slug}' not found!")
        return
    
    store = store_res.data
    store_id = store['id']
    print(f"✅ Found Store ID: {store_id}")
    
    # 2. Check for existing subscription (just in case)
    existing_sub = supabase_admin.table('subscriptions').select('*').eq('store_id', store_id).execute()
    if existing_sub.data:
        print(f"⚠️ Store already has subscriptions: {len(existing_sub.data)}")
        # If existing but plan_id is None, fix it?
        # But we saw earlier there were none.
    
    # 3. Find payments for this store
    payments = supabase_admin.table('payments').select('*').eq('store_id', store_id).eq('status', 'captured').execute()
    
    if not payments.data:
        print("❌ No successful payments found for this store. Cannot infer plan.")
        return

    # Assuming latest payment is the one
    latest_payment = sorted(payments.data, key=lambda x: x['created_at'], reverse=True)[0]
    amount = latest_payment['amount']
    print(f"✅ Found payment of {amount} created at {latest_payment['created_at']}")
    
    # 4. Find matching plan
    # Warning: Amount in payment might be float, db might be int/float.
    plans = supabase_admin.table('subscription_plans').select('*').eq('price_monthly', amount).execute()
    
    if not plans.data:
        print(f"❌ No plan found with price {amount}")
        return
        
    # Pick the most logical plan (earliest created one usually matches the old payment)
    # or just pick the first active one.
    plan = plans.data[0] 
    plan_id = plan['id']
    print(f"✅ Matched Plan: {plan['name']} ({plan_id})")

    # 5. Create Subscription Record
    new_sub = {
        "store_id": store_id,
        "plan_id": plan_id,
        "status": "active",
        "billing_cycle": "monthly",
        "amount": amount,
        # "currency": "INR", # Removed as column does not exist
        "current_period_start": datetime.now().isoformat(), # Ideally strictly from payment date, but for fix now is okay
        "current_period_end": "2030-01-01T00:00:00Z", # Set far future or correct date
        "created_at": latest_payment['created_at']
    }
    
    print("Creating subscription...")
    sub_res = supabase_admin.table('subscriptions').insert(new_sub).execute()
    
    if sub_res.data:
        print("✅ Subscription created successfully!")
        
        # 6. Update Store Record
        print("Updating store plan_id...")
        supabase_admin.table('stores').update({'plan_id': plan_id}).eq('id', store_id).execute()
        print("✅ Store updated!")
    else:
        print("❌ Failed to create subscription.")

if __name__ == "__main__":
    fix_store_subscription('my-crust')
    # Use if you want to fix 'my-studio' as well
    fix_store_subscription('my-studio')
