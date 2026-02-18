"""
Seed Script: Adds realistic demo data to all platform tables.
Run with: python scripts/seed_demo_data.py
"""
import os
import sys
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ============================================
# 1. SUBSCRIPTION PLANS (5 Real Plans)
# ============================================
plans_data = [
    {
        "name": "Starter",
        "price_monthly": 499,
        "price_yearly": 4999,
        "features": ["Up to 50 Products", "Basic Analytics", "Email Support", "1 Staff Account"],
        "is_active": True
    },
    {
        "name": "Growth",
        "price_monthly": 999,
        "price_yearly": 9999,
        "features": ["Up to 500 Products", "Advanced Analytics", "Priority Support", "5 Staff Accounts", "Custom Domain"],
        "is_active": True
    },
    {
        "name": "Professional",
        "price_monthly": 1999,
        "price_yearly": 19999,
        "features": ["Unlimited Products", "Full Analytics Suite", "24/7 Phone Support", "Unlimited Staff", "Custom Domain", "API Access"],
        "is_active": True
    },
    {
        "name": "Enterprise",
        "price_monthly": 4999,
        "price_yearly": 49999,
        "features": ["Everything in Pro", "Dedicated Account Manager", "Custom Integrations", "SLA Guarantee", "White Label Option"],
        "is_active": True
    },
    {
        "name": "Free Trial",
        "price_monthly": 0,
        "price_yearly": 0,
        "features": ["Up to 10 Products", "Basic Theme", "Community Support", "14-Day Trial"],
        "is_active": True
    }
]

# ============================================
# 2. PROFILES (5 Real Indian Merchants)
# ============================================
profiles_data = [
    {
        "email": "priya.fashion@gmail.com",
        "first_name": "Priya",
        "last_name": "Kapoor",
        "phone": "+91 98765 43210",
        "role": "merchant",
        "status": "active",
        "store_name": "Priya's Fashion Hub",
        "store_slug": "priya-fashion"
    },
    {
        "email": "rahul.electronics@gmail.com",
        "first_name": "Rahul",
        "last_name": "Sharma",
        "phone": "+91 87654 32109",
        "role": "merchant",
        "status": "active",
        "store_name": "TechZone Electronics",
        "store_slug": "techzone-electronics"
    },
    {
        "email": "anita.handicrafts@gmail.com",
        "first_name": "Anita",
        "last_name": "Desai",
        "phone": "+91 76543 21098",
        "role": "merchant",
        "status": "active",
        "store_name": "Anita's Handicrafts",
        "store_slug": "anita-handicrafts"
    },
    {
        "email": "vikram.sports@gmail.com",
        "first_name": "Vikram",
        "last_name": "Singh",
        "phone": "+91 65432 10987",
        "role": "merchant",
        "status": "active",
        "store_name": "SportsFit India",
        "store_slug": "sportsfit-india"
    },
    {
        "email": "meera.organic@gmail.com",
        "first_name": "Meera",
        "last_name": "Patel",
        "phone": "+91 54321 09876",
        "role": "merchant",
        "status": "active",
        "store_name": "Organic Bazaar",
        "store_slug": "organic-bazaar"
    }
]

def seed_plans():
    print("\n📦 Seeding Subscription Plans...")
    for plan in plans_data:
        try:
            supabase.table("subscription_plans").insert(plan).execute()
            print(f"   ✅ Plan: {plan['name']}")
        except Exception as e:
            print(f"   ⚠️ {plan['name']}: {e}")

def seed_merchants():
    print("\n👤 Seeding Merchants (Profiles, Stores, Subscriptions, Payments)...")
    
    # Get plan IDs
    plans_res = supabase.table("subscription_plans").select("id, name").execute()
    plans_map = {p["name"]: p["id"] for p in (plans_res.data or [])}
    
    plan_assignments = ["Growth", "Professional", "Starter", "Enterprise", "Growth"]
    amounts = [999, 1999, 499, 4999, 999]
    
    for i, profile in enumerate(profiles_data):
        try:
            # Create Auth User
            auth_response = supabase.auth.admin.create_user({
                "email": profile["email"],
                "password": "Demo@123456",
                "email_confirm": True,
                "user_metadata": {
                    "first_name": profile["first_name"],
                    "last_name": profile["last_name"],
                    "role": "merchant"
                }
            })
            
            if not auth_response.user:
                print(f"   ⚠️ Auth failed for {profile['email']}")
                continue
                
            user_id = auth_response.user.id
            
            # Insert Profile
            profile_record = {
                "id": user_id,
                "email": profile["email"],
                "first_name": profile["first_name"],
                "last_name": profile["last_name"],
                "phone": profile["phone"],
                "role": profile["role"],
                "status": profile["status"],
                "store_name": profile["store_name"],
                "store_slug": profile["store_slug"]
            }
            supabase.table("profiles").upsert(profile_record).execute()
            
            # Insert Store
            store_record = {
                "owner_id": user_id,
                "name": profile["store_name"],
                "slug": profile["store_slug"],
                "status": "active",
                "setup_completed": True
            }
            store_res = supabase.table("stores").insert(store_record).execute()
            store_id = store_res.data[0]["id"]
            
            # Insert Subscription
            plan_name = plan_assignments[i]
            plan_id = plans_map.get(plan_name)
            if plan_id:
                sub_record = {
                    "store_id": store_id,
                    "plan_id": plan_id,
                    "status": "active",
                    "billing_cycle": "monthly",
                    "amount": amounts[i],
                    "current_period_start": datetime.now().isoformat(),
                    "current_period_end": (datetime.now() + timedelta(days=30)).isoformat()
                }
                supabase.table("subscriptions").insert(sub_record).execute()
            
            # Insert Payment
            payment_record = {
                "store_id": store_id,
                "amount": amounts[i],
                "currency": "INR",
                "status": "captured",
                "provider": "razorpay",
                "razorpay_payment_id": f"pay_demo_{profile['store_slug']}_{i}",
                "type": "subscription_fee"
            }
            supabase.table("payments").insert(payment_record).execute()
            
            print(f"   ✅ {profile['first_name']} {profile['last_name']} - {profile['store_name']}")
            
        except Exception as e:
            print(f"   ⚠️ {profile['email']}: {e}")

def main():
    print("=" * 50)
    print("🌱 StoreCraft Demo Data Seeder")
    print("=" * 50)
    
    seed_plans()
    seed_merchants()
    
    print("\n" + "=" * 50)
    print("✅ Seed complete! Check your Supabase tables.")
    print("=" * 50)

if __name__ == "__main__":
    main()
