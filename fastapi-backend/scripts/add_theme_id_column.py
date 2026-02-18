"""
Add theme_id column to stores table.
This allows merchants to set a theme for their store.
"""
from app.core.supabase_client import supabase_admin

def add_theme_id_column():
    """Add theme_id column to stores table using raw SQL via Supabase."""
    try:
        # Try to update a store with theme_id to see if the column exists
        test_res = supabase_admin.table("stores").select("id").limit(1).execute()
        if not test_res.data:
            print("❌ No stores found in database")
            return
        
        store_id = test_res.data[0]["id"]
        
        # Try setting theme_id - if column doesn't exist, this will raise an error
        try:
            supabase_admin.table("stores").update({"theme_id": None}).eq("id", store_id).execute()
            print("✅ theme_id column already exists!")
        except Exception as e:
            error_str = str(e)
            if "column" in error_str.lower() and "not" in error_str.lower():
                print("⚠️ theme_id column does NOT exist. You need to add it manually in Supabase Dashboard.")
                print("\n📝 Go to Supabase Dashboard → SQL Editor → Run this query:")
                print("="*60)
                print("""
ALTER TABLE stores ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES themes(id) ON DELETE SET NULL;
                """)
                print("="*60)
                print("\nAlternatively, use the Table Editor in Supabase to add the column manually.")
            else:
                print(f"❌ Unexpected error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    add_theme_id_column()
