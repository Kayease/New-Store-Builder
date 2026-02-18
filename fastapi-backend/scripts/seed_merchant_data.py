import sys
import os
import uuid
import random
from datetime import datetime, timedelta

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin

def seed_store_data(store_slug: str):
    print(f"🚀 Seeding data for store: {store_slug}")
    
    # 1. Get store ID
    store_res = supabase_admin.table("stores").select("id").eq("slug", store_slug).single().execute()
    if not store_res.data:
        print(f"❌ Store not found: {store_slug}")
        return
    
    store_id = store_res.data["id"]
    
    # 2. Seed Categories
    print("📦 Seeding categories...")
    categories = [
        {"name": "Pizzas", "description": "Hand-tossed delicious pizzas", "slug": "pizzas"},
        {"name": "Sides", "description": "Garlic bread, wraps and more", "slug": "sides"},
        {"name": "Beverages", "description": "Cold drinks and shakes", "slug": "beverages"},
        {"name": "Desserts", "description": "Sweet treats", "slug": "desserts"}
    ]
    
    cat_ids = []
    for cat in categories:
        cat["store_id"] = store_id
        res = supabase_admin.table("categories").insert(cat).execute()
        if res.data:
            cat_ids.append(res.data[0]["id"])
            
    # 3. Seed Products
    print("🍎 Seeding products...")
    pizzas = [
        {"name": "Margherita Pizza", "price": 299, "description": "Classic cheese pizza", "category_id": cat_ids[0], "slug": "margherita-pizza"},
        {"name": "Farmhouse Pizza", "price": 449, "description": "Loaded with veggies", "category_id": cat_ids[0], "slug": "farmhouse-pizza"},
        {"name": "Peppy Paneer", "price": 499, "description": "Spicy paneer and capsicum", "category_id": cat_ids[0], "slug": "peppy-paneer"},
        {"name": "Pepper BBQ Chicken", "price": 549, "description": "Smokey BBQ chicken", "category_id": cat_ids[0], "slug": "pepper-bbq-chicken"}
    ]
    
    sides = [
        {"name": "Garlic Breadsticks", "price": 99, "description": "Freshly baked bread", "category_id": cat_ids[1], "slug": "garlic-breadsticks"},
        {"name": "Stuffed Garlic Bread", "price": 149, "description": "Bread with cheese and corn", "category_id": cat_ids[1], "slug": "stuffed-garlic-bread"}
    ]
    
    products = pizzas + sides
    prod_ids = []
    
    for prod in products:
        prod["store_id"] = store_id
        prod["status"] = "active"
        prod["inventory_quantity"] = random.randint(50, 200)
        res = supabase_admin.table("products").insert(prod).execute()
        if res.data:
            prod_ids.append(res.data[0])
            
    # 4. Seed Customers
    print("👤 Seeding customers...")
    customers = [
        {"first_name": "Amit", "last_name": "Sharma", "email": "amit@example.com", "phone": "9876543210"},
        {"first_name": "Priya", "last_name": "Singh", "email": "priya@example.com", "phone": "9876543211"},
        {"first_name": "Rahul", "last_name": "Verma", "email": "rahul@example.com", "phone": "9876543212"},
        {"first_name": "Sneha", "last_name": "Reddy", "email": "sneha@example.com", "phone": "9876543213"}
    ]
    
    cust_ids = []
    for cust in customers:
        cust["store_id"] = store_id
        res = supabase_admin.table("customers").insert(cust).execute()
        if res.data:
            cust_ids.append(res.data[0]["id"])
            
    # 5. Seed Orders (20-30 orders for the last 30 days)
    print("🛒 Seeding orders...")
    statuses = ["completed", "completed", "completed", "completed", "pending", "pending", "cancelled"]
    
    for i in range(25):
        # Random date in the last 30 days
        days_ago = random.randint(0, 30)
        order_date = (datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23))).isoformat()
        
        # Random items for this order
        num_items = random.randint(1, 3)
        order_items_list = random.sample(prod_ids, num_items)
        
        total_amount = sum([item["price"] for item in order_items_list])
        status = random.choice(statuses)
        customer_id = random.choice(cust_ids)
        
        # Create order
        order = {
            "store_id": store_id,
            "customer_id": customer_id,
            "order_number": f"ORD-{random.randint(100000, 999999)}",
            "total_amount": total_amount,
            "status": status,
            "shipping_address": "Test Address, India",
            "created_at": order_date
        }
        
        order_res = supabase_admin.table("orders").insert(order).execute()
        if order_res.data:
            order_id = order_res.data[0]["id"]
            
            # Create order items
            for item in order_items_list:
                order_item = {
                    "order_id": order_id,
                    "product_id": item["id"],
                    "name": item["name"],
                    "quantity": 1,
                    "price": item["price"],
                    "total": item["price"], # quantity is 1
                    "store_id": store_id
                }
                supabase_admin.table("order_items").insert(order_item).execute()
                
    print("✅ Seeding completed successfully!")

if __name__ == "__main__":
    slug = sys.argv[1] if len(sys.argv) > 1 else "my-crust"
    seed_store_data(slug)
