from fastapi import APIRouter, HTTPException, Depends
from app.schemas.auth import SendOTPRequest, VerifyOTPRequest, UserRegister, UserLogin, UserMe
from app.core.supabase_client import supabase, supabase_admin
from app.core.auth_utils import create_access_token, verify_token
import random

router = APIRouter()

# Temporary in-memory storage for OTPs (In production, use Redis or Database)
otp_storage = {}

@router.post("/send-otp")
async def send_otp(request: SendOTPRequest):
    """
    Simulates sending internal OTP. 
    In development mode, it returns the OTP in the response.
    """
    phone = request.phone
    otp = str(random.randint(100000, 999999))
    
    # Store OTP with phone as key
    otp_storage[phone] = otp
    
    # In real world: Call MSG91 here
    # For now: Just return it so user can see it on screen
    print(f"DEBUG: OTP for {phone} is {otp}")
    
    return {
        "success": True, 
        "message": "OTP sent successfully (Dummy)", 
        "data": {
            "otp": otp
        }
    }

@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """
    Verifies the dummy OTP
    """
    phone = request.phone
    otp = request.otp
    
    if phone in otp_storage and otp_storage[phone] == otp:
        # Remove OTP after verification
        del otp_storage[phone]
        return {"success": True, "message": "OTP verified successfully"}
    
    raise HTTPException(status_code=400, detail="Invalid or expired OTP")

@router.post("/register")
async def register_user(user: UserRegister):
    """
    Registers a new merchant/user in Supabase Auth and Profiles table
    """
    try:
        print(f"📝 Registration attempt for: {user.email}")
        
        # 1. Create user in Supabase Auth (bypasses email verification)
        auth_response = supabase_admin.auth.admin.create_user({
            "email": user.email,
            "password": user.password,
            "email_confirm": True,
            "user_metadata": {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "role": "MERCHANT"
            }
        })
        
        if not auth_response.user:
            print("❌ No user returned from Supabase")
            raise HTTPException(status_code=400, detail="Registration failed - no user created")

        user_id = auth_response.user.id
        print(f"✅ Auth user created: {user_id}")
        
        # 2. Also insert into profiles table so data is visible in Supabase dashboard
        try:
            profile_data = {
                "id": user_id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "role": "MERCHANT",
                "status": "active"
            }
            supabase_admin.table("profiles").upsert(profile_data).execute()
            print(f"✅ Profile record created in profiles table")
        except Exception as profile_error:
            print(f"⚠️ Profile insert warning: {profile_error}")
            # Don't fail registration if profile insert fails
        
        # 3. For development: Generate a dummy OTP and store it
        otp = str(random.randint(100000, 999999))
        otp_storage[user.phone] = otp
        print(f"DEBUG: Registration OTP for {user.phone} is {otp}")
        
        return {
            "success": True, 
            "message": "User registered successfully. Please verify your phone.", 
            "user_id": user_id,
            "data": {
                "otp": otp
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Registration Error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login_user(user: UserLogin):
    """
    Standard Email/Password login for Admin/Merchants
    """
    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })
        
        if not response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Extract user details from auth response
        user_data = response.user
        metadata = user_data.user_metadata or {}
            
        # 2. Fetch additional profile data from Supabase Profiles table
        profile = {}
        try:
            profile_response = supabase_admin.table("profiles").select("*").eq("id", user_data.id).single().execute()
            profile = profile_response.data or {}
        except Exception as profile_err:
            print(f"⚠️ Profile fetch failed during login: {profile_err}")

        # 3. Fetch user's stores
        stores = []
        try:
            stores_response = supabase_admin.table("stores").select("*").eq("owner_id", user_data.id).execute()
            # Map id to _id for frontend compatibility if needed
            stores = []
            for s in stores_response.data:
                s_copy = s.copy()
                s_copy["_id"] = s.get("id")
                stores.append(s_copy)
        except Exception as stores_err:
            print(f"⚠️ Stores fetch failed during login: {stores_err}")

        # 4. Determine role (lowercase for frontend consistency)
        role = (profile.get("role") or metadata.get("role") or "user").lower()
        
        # 5. Token Handling: If Admin, generate a long-lived custom token
        token = response.session.access_token
        if role == "admin":
            print(f"👑 Admin login detected ({user_data.email}) - Issuing 30-day token")
            token = create_access_token({
                "sub": user_data.id,
                "email": user_data.email,
                "role": role
            })
        
        # 6. Return comprehensive user data
        return {
            "success": True,
            "data": {
                "token": token,
                "user": {
                    "_id": user_data.id,
                    "id": user_data.id,
                    "email": user_data.email,
                    "role": role,
                    "firstName": profile.get("first_name") or metadata.get("first_name", ""),
                    "lastName": profile.get("last_name") or metadata.get("last_name", ""),
                    "fullName": f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or f"{metadata.get('first_name', '')} {metadata.get('last_name', '')}".strip(),
                    "phone": profile.get("phone") or metadata.get("phone", ""),
                    "storeId": stores[0].get("id") if stores else None,
                    "stores": stores,
                    "status": profile.get("status", "active")
                }
            }
        }
    except Exception as e:
        # Check if it's a specific auth error
        error_msg = str(e)
        if "Invalid login credentials" in error_msg:
             raise HTTPException(status_code=401, detail="Invalid email or password")
        raise HTTPException(status_code=400, detail=error_msg)

@router.get("/me", response_model=UserMe)
async def get_me(user_data: dict = Depends(verify_token)):
    """
    Returns current logged-in user details using JWT
    """
    user_id = user_data.get("sub")
    
    # Fetch additional profile data from Supabase
    try:
        # Note: You need a 'profiles' or 'users' table in Supabase for this
        result = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
        profile = result.data
        
        # Normalize the response format for frontend
        return {
            "id": profile.get("id"),
            "email": profile.get("email", ""),
            "first_name": profile.get("first_name", ""),
            "last_name": profile.get("last_name", ""),
            "phone": profile.get("phone", ""),
            "role": profile.get("role", "user"),
            "firstName": profile.get("first_name", ""),
            "lastName": profile.get("last_name", ""),
            "status": profile.get("status", "active")
        }
    except Exception as e:
        print(f"⚠️ Profile fetch error: {e}")
        # Fallback to data in JWT if table doesn't exist yet
        return {
            "id": user_id,
            "email": user_data.get("email", ""),
            "first_name": user_data.get("user_metadata", {}).get("first_name", "User"),
            "last_name": user_data.get("user_metadata", {}).get("last_name", ""),
            "phone": user_data.get("user_metadata", {}).get("phone", ""),
            "role": user_data.get("user_metadata", {}).get("role", "USER"),
            "firstName": user_data.get("user_metadata", {}).get("first_name", "User"),
            "lastName": user_data.get("user_metadata", {}).get("last_name", ""),
            "status": "active"
        }

@router.get("/profile")
async def get_profile(user_data: dict = Depends(verify_token)):
    """
    Get current user profile - Returns data in format expected by frontend.
    """
    user_id = user_data.get("sub")
    
    # Fetch profile from database
    try:
        result = supabase_admin.table("profiles").select("*").eq("id", user_id).single().execute()
        profile = result.data
        
        # Also fetch user's stores
        stores = []
        try:
            stores_response = supabase_admin.table("stores").select("*").eq("owner_id", user_id).execute()
            for s in (stores_response.data or []):
                stores.append({
                    "_id": s.get("id"),
                    "id": s.get("id"),
                    "storeName": s.get("store_name") or s.get("name", ""),
                    "storeSlug": s.get("slug", ""),
                    "slug": s.get("slug", ""),
                    "status": s.get("status", "active"),
                    "isActive": s.get("status") == "active",
                })
        except Exception as stores_err:
            print(f"⚠️ Stores fetch error: {stores_err}")
        
        # Self-healing: If user has stores but role is 'user', promote to 'merchant'
        role = (profile.get("role") or "user").lower()
        if stores and role != "merchant" and role != "admin":
            print(f"🔧 Auto-promoting user {user_id} to merchant because they own stores")
            try:
                supabase_admin.table("profiles").update({"role": "merchant"}).eq("id", user_id).execute()
                role = "merchant"
            except Exception as e:
                print(f"Failed to auto-promote: {e}")
        
        user_response = {
            "_id": profile.get("id"),
            "id": profile.get("id"),
            "email": profile.get("email", ""),
            "firstName": profile.get("first_name", ""),
            "lastName": profile.get("last_name", ""),
            "fullName": f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip(),
            "phone": profile.get("phone", ""),
            "role": role,
            "status": profile.get("status", "active"),
            "storeId": stores[0].get("id") if stores else None,
            "storeSlug": stores[0].get("slug") if stores else None,
            "stores": stores,
        }
        
        return {
            "success": True,
            "data": {
                "user": user_response
            }
        }
    except Exception as e:
        print(f"⚠️ Profile fetch error: {e}")
        
        # Even if profile fetch fails, TRY TO FETCH STORES anyway
        # This fixes the issue where missing profile row hides the stores
        stores = []
        try:
            print(f"🔄 Attempting to fetch stores for fallback user: {user_id}")
            stores_response = supabase_admin.table("stores").select("*").eq("owner_id", user_id).execute()
            for s in (stores_response.data or []):
                stores.append({
                    "_id": s.get("id"),
                    "id": s.get("id"),
                    "storeName": s.get("store_name") or s.get("name", ""),
                    "storeSlug": s.get("slug", ""),
                    "slug": s.get("slug", ""),
                    "status": s.get("status", "active"),
                    "isActive": s.get("status") == "active",
                })
            print(f"✅ Found {len(stores)} stores in fallback mode")
        except Exception as store_err:
            print(f"❌ Fallback store fetch error: {store_err}")

        # Fallback to JWT data but include found stores
        return {
            "success": True,
            "data": {
                "user": {
                    "_id": user_id,
                    "id": user_id,
                    "email": user_data.get("email", ""),
                    "firstName": user_data.get("user_metadata", {}).get("first_name", "User"),
                    "lastName": user_data.get("user_metadata", {}).get("last_name", ""),
                    "role": (user_data.get("user_metadata", {}).get("role") or "user").lower(),
                    "status": "active",
                    "storeId": stores[0].get("id") if stores else None,
                    "storeSlug": stores[0].get("slug") if stores else None,
                    "stores": stores,
                }
            }
        }


