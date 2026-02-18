import sys
import os

# Add the parent directory to sys.path to allow importing 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.supabase_client import supabase_admin

def reset_passwords():
    # Setting a common password as requested
    new_password = "Merchant@123" 
    print(f"--- Merchant Password Reset Tool ---")
    print(f"Target Password: {new_password}\n")
    
    try:
        # Get all profiles with role 'merchant' or 'MERCHANT'
        # Supabase doesn't support case-insensitive 'in' easily in some clients, so we fetch both
        try:
            merchants_lower = supabase_admin.table("profiles").select("*").eq("role", "merchant").execute()
            merchants_upper = supabase_admin.table("profiles").select("*").eq("role", "MERCHANT").execute()
            all_merchants = merchants_lower.data + merchants_upper.data
        except Exception as e:
            print(f"Error fetching profiles: {e}")
            return
        
        if not all_merchants:
            print("No merchants found in the profiles table.")
            return

        print(f"Found {len(all_merchants)} merchants. Starting password reset...")
        
        success_count = 0
        fail_count = 0
        
        for merchant in all_merchants:
            email = merchant.get("email")
            user_id = merchant.get("id")
            
            if not email or not user_id:
                print(f"⚠️ Skipping incomplete profile: {merchant}")
                continue
                
            try:
                # Update the user's password in Supabase Auth
                supabase_admin.auth.admin.update_user_by_id(
                    user_id,
                    {"password": new_password}
                )
                print(f"✅ Reset password for: {email}")
                success_count += 1
            except Exception as e:
                print(f"❌ Failed to reset for {email}: {e}")
                fail_count += 1
                
        print(f"\n--- Summary ---")
        print(f"Total Success: {success_count}")
        print(f"Total Failed: {fail_count}")
        print(f"\nAll merchants can now login with the password: {new_password}")
        
        print("\nMerchant Login List:")
        for m in all_merchants:
            print(f"- {m.get('email')}")

    except Exception as e:
        print(f"FATAL Error: {e}")

if __name__ == "__main__":
    reset_passwords()
