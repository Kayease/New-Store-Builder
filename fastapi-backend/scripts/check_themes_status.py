from app.core.supabase_client import supabase_admin

def check_themes():
    try:
        res = supabase_admin.table("themes").select("*").execute()
        print(f"--- Found {len(res.data)} Themes ---")
        for theme in res.data:
            print(f"SLUG: {theme['slug']}")
            print(f"  Status: {theme['status']}")
            print(f"  Description: {theme.get('description')}")
            print("-" * 20)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_themes()
