from app.core.supabase_client import supabase_admin

def reset_admin():
    email = "admin@storecraft.com"
    password = "AdminPassword123!"
    
    try:
        users = supabase_admin.auth.admin.list_users()
        admin_user = next((u for u in users if u.email == email), None)
        
        if admin_user:
            supabase_admin.auth.admin.update_user_by_id(
                admin_user.id,
                {"password": password}
            )
            print(f"✅ Admin password reset successfully.")
        else:
            # Create if doesn't exist
            supabase_admin.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "first_name": "Portal",
                    "last_name": "Admin",
                    "role": "admin"
                }
            })
            print(f"✅ Admin user created successfully.")
            
        print(f"Login details:\nEmail: {email}\nPassword: {password}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_admin()
