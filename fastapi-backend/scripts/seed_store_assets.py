"""
Seed Script: Adds Products and Manager Details to all existing stores.
Run with: python scripts/seed_store_assets.py
"""
import os
import sys
import uuid
import random
import string
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Sample Products Data (Jewellery Focused)
PRODUCT_TEMPLATES = [
    {"name": "Diamond Solitaire Ring", "price": 45000, "img": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600"},
    {"name": "22k Gold Wedding Band", "price": 32000, "img": "https://images.unsplash.com/photo-1544441893-675973e31985?w=600"},
    {"name": "Emerald Drop Earrings", "price": 18500, "img": "https://images.unsplash.com/photo-1535633302723-997f858d4aed?w=600"},
    {"name": "Rose Gold Bracelet", "price": 12000, "img": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600"},
    {"name": "Pearl Necklace", "price": 8500, "img": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600"},
    {"name": "Ruby Studded Pendant", "price": 24000, "img": "https://images.unsplash.com/photo-1620656798579-1984d0089069?w=600"},
    {"name": "Silver Anklets (Pair)", "price": 4500, "img": "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=600"},
    {"name": "Platinum Couple Rings", "price": 75000, "img": "https://images.unsplash.com/photo-1605100084411-30bbff017551?w=600"},
]

MANAGER_NAMES = ["Amit Verma", "Sneha Rao", "Rohan Malhotra", "Anjali Gupta", "Vikram Shah"]

def slugify(text):
    return text.lower().replace(" ", "-").replace("'", "").strip()

def generate_random_id(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def seed_store_assets():
    print("=" * 60)
    print("💎 StoreCraft: Product & Personnel Seeder (V2)")
    print("=" * 60)

    try:
        # 1. Fetch all stores
        stores_res = supabase.table("stores").select("*").execute()
        stores = stores_res.data or []
        
        if not stores:
            print("❌ No stores found in database.")
            return

        print(f"📍 Found {len(stores)} stores to seed.")

        for store in stores:
            store_id = store["id"]
            store_slug = store["slug"]
            owner_id = store["owner_id"]
            print(f"\n📦 Processing Store: {store.get('name')} (/{store_slug})")

            # --- A. Update Manager Details in Stores Table ---
            mgr_name = random.choice(MANAGER_NAMES)
            mgr_email = f"{mgr_name.lower().replace(' ', '.')}@{store_slug}.com"
            mgr_phone = f"+91 9{random.randint(700000000, 999999999)}"
            
            try:
                supabase.table("stores").update({
                    "manager_name": mgr_name,
                    "manager_email": mgr_email,
                    "manager_phone": mgr_phone,
                    "manager_id": str(uuid.uuid4())
                }).eq("id", store_id).execute()
                print(f"   👤 Manager Configured in Registry Settings")
            except Exception as e:
                print(f"   ⚠️ Error setting manager: {e}")

            # --- B. Seed 5 Products ---
            products_to_insert = []
            for item in random.sample(PRODUCT_TEMPLATES, 5):
                item_slug = f"{slugify(item['name'])}-{generate_random_id()}"
                products_to_insert.append({
                    "name": item["name"],
                    "slug": item_slug,
                    "description": f"Exquisite crafted {item['name']}.",
                    "price": item["price"],
                    "inventory_quantity": random.randint(5, 50),
                    "status": "active",
                    "store_id": store_id,
                    "images": [item["img"]]
                })
            
            try:
                # Insert one by one to avoid bulk fail if one has issue
                for p in products_to_insert:
                    supabase.table("products").insert(p).execute()
                print(f"   ✅ Seeded 5 inventory items.")
            except Exception as e:
                print(f"   ⚠️ Product Error: {e}")

            # --- C. Update Owner Profile to show as Manager in the list ---
            # This is a safe way to show AT LEAST one person in the registry
            try:
                supabase.table("profiles").update({
                    "role": "Manager",
                    "phone": mgr_phone,
                    "store_slug": store_slug
                }).eq("id", owner_id).execute()
                print(f"   ✅ Synchronized Owner as Primary Manager in Personnel Registry.")
            except Exception as e:
                print(f"   ⚠️ Profile Sync Error: {e}")

        print("\n" + "=" * 60)
        print("🎉 Seeding Finished Successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"❌ General Error: {e}")

if __name__ == "__main__":
    seed_store_assets()
