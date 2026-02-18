import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def create_super_admin(email, password, first_name, last_name):
    print(f"🚀 Creating Super Admin: {email}...")
    
    try:
        # 1. Create user in Supabase Auth (using service_role to bypass verification)
        user_response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "first_name": first_name,
                "last_name": last_name,
                "role": "SUPER_ADMIN"
            }
        })
        
        if not user_response.user:
            print("❌ Failed to create auth user.")
            return

        user_id = user_response.user.id
        print(f"✅ Auth user created with ID: {user_id}")

        # 2. Insert into 'profiles' or 'users' table
        # We try 'profiles' first as it's the Supabase standard
        try:
            profile_data = {
                "id": user_id,
                "email": email,
                "first_name": first_name,
                "last_name": last_name,
                "role": "SUPER_ADMIN"
            }
            supabase.table("profiles").upsert(profile_data).execute()
            print("✅ Profile record created in 'profiles' table.")
        except Exception as e:
            print(f"⚠️ Could not create profile in 'profiles' table: {e}")
            print("Note: Make sure your 'profiles' table exists in Supabase.")

        print("\n🎉 SUPER ADMIN CREATED SUCCESSFULLY!")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print("\nYou can now log in through your frontend or Postman.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/create_super_admin.py <email> <password> <first_name> <last_name>")
    else:
        email = sys.argv[1]
        password = sys.argv[2]
        f_name = sys.argv[3] if len(sys.argv) > 3 else "Super"
        l_name = sys.argv[4] if len(sys.argv) > 4 else "Admin"
        create_super_admin(email, password, f_name, l_name)
