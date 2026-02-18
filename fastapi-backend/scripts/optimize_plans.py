import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

new_plans = [
    {
        "name": "Basic Plus",
        "price_monthly": 299,
        "price_yearly": 2999,
        "features": ["30 Products", "Custom Colors", "Email Support", "Digital Downloads"],
        "is_active": True
    },
    {
        "name": "Startup",
        "price_monthly": 799,
        "price_yearly": 7999,
        "features": ["100 Products", "Premium Theme", "Priority Support", "Basic Analytics"],
        "is_active": True
    },
    {
        "name": "Business Pro",
        "price_monthly": 2499,
        "price_yearly": 24999,
        "features": ["Unlimited Products", "Custom Domain", "24/7 Support", "Advanced Reporting", "Multi-user Access"],
        "is_active": True
    },
    {
        "name": "Elite",
        "price_monthly": 9999,
        "price_yearly": 99999,
        "features": ["Dedicated Account Manager", "Custom SSL", "White-label Dashboard", "Global CDN", "Fraud Protection"],
        "is_active": True
    }
]

def add_missing_plans():
    print("Generating additional plans to reach 10 total...")
    for plan in new_plans:
        # Check if exists
        check = supabase.table("subscription_plans").select("id").eq("name", plan["name"]).execute()
        if not check.data:
            supabase.table("subscription_plans").insert(plan).execute()
            print(f"   Added plan: {plan['name']}")
        else:
            print(f"   Plan {plan['name']} already exists.")
            
    print("Optimization complete.")

if __name__ == "__main__":
    add_missing_plans()
