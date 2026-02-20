
from fastapi import APIRouter, HTTPException, Depends, Body
from app.core.supabase_client import supabase_admin
from app.core.auth_utils import verify_token
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import jwt
import datetime

# Using PBKDF2 for reliability
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

router = APIRouter()

class CustomerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    store_id: str

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str
    store_id: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_customer_token(customer_id: str, store_id: str):
    payload = {
        "sub": customer_id,
        "store_id": store_id,
        "role": "customer",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, "CUSTOMER_SECRET_KEY", algorithm="HS256")

@router.post("/register")
async def register_customer(customer: CustomerRegister):
    try:
        # Check if email exists
        existing = supabase_admin.table("customers").select("id").eq("email", customer.email).eq("store_id", customer.store_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered for this store")
        
        hashed_pw = get_password_hash(customer.password)
        
        # MAPPING TO SURVIVE WITHOUT SCHEMA MIGRATIONS
        # Database Columns available: id, store_id, first_name, last_name, email, phone, total_spent
        # We store the Full Name in first_name
        # We store the Password Hash in last_name with a prefix
        
        new_customer = {
            "first_name": customer.name,
            "last_name": f"PWD:{hashed_pw}",
            "email": customer.email,
            "store_id": customer.store_id,
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        
        res = supabase_admin.table("customers").insert(new_customer).execute()
        if not res.data:
             raise HTTPException(status_code=500, detail="Failed to create account")
             
        token = create_customer_token(res.data[0]['id'], customer.store_id)
        return {"success": True, "token": token, "customer": res.data[0]}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login_customer(cred: CustomerLogin):
    try:
        # 1. Attempt Customer Login (Legacy/Table-based)
        res = supabase_admin.table("customers").select("id, email, first_name, last_name, store_id").eq("email", cred.email).eq("store_id", cred.store_id).execute()
        
        if res.data:
            customer = res.data[0]
            stored_hash_field = customer.get("last_name", "")
            if stored_hash_field.startswith("PWD:"):
                hashed = stored_hash_field.replace("PWD:", "")
                if verify_password(cred.password, hashed):
                    token = create_customer_token(customer['id'], cred.store_id)
                    customer['name'] = customer['first_name']
                    return {"success": True, "token": token, "customer": customer, "role": "customer"}

        # 2. Attempt Staff/Manager Login (Supabase Auth-based)
        from app.core.supabase_client import supabase
        try:
            auth_res = supabase.auth.sign_in_with_password({
                "email": str(cred.email),
                "password": cred.password
            })
            
            if auth_res.session:
                user_id = auth_res.user.id
                print(f"🎯 Auth Success: {cred.email} ({user_id}) for Store: {cred.store_id}")
                
                # Verify if this user has access to THIS specific store
                # Check store_managers table
                manager_res = supabase_admin.table("store_managers").select("role").eq("user_id", user_id).eq("store_id", cred.store_id).execute()
                print(f"🕵️ Manager Check: {len(manager_res.data)} match(es)")
                
                # Also check if they are the OWNER of the store
                owner_res = supabase_admin.table("stores").select("owner_id, slug").eq("id", cred.store_id).single().execute()
                print(f"👤 Owner Check: Store Owner ID = {owner_res.data.get('owner_id') if owner_res.data else 'None'}")
                
                is_manager = len(manager_res.data) > 0
                is_owner = owner_res.data and owner_res.data.get("owner_id") == user_id
                
                if is_manager or is_owner:
                    role = manager_res.data[0]["role"] if is_manager else "merchant"
                    store_slug = owner_res.data["slug"]
                    
                    # Fetch full store data for compatibility with AuthContext
                    full_store_res = supabase_admin.table("stores").select("*").eq("id", cred.store_id).single().execute()
                    store_data = full_store_res.data or {}
                    store_data["_id"] = store_data.get("id")
                    store_data["storeSlug"] = store_data.get("slug")
                    
                    target_redirect = f"/manager/{store_slug}/home" if role == "manager" else f"/store/{store_slug}/general"
                    
                    # Construct rich user profile object exactly as needed by frontend
                    rich_customer = {
                        "_id": user_id,
                        "id": user_id,
                        "email": str(cred.email),
                        "role": role.lower(),
                        "firstName": auth_res.user.user_metadata.get("first_name", role.capitalize()),
                        "lastName": auth_res.user.user_metadata.get("last_name", ""),
                        "is_staff": True,
                        "storeId": cred.store_id,
                        "storeSlug": store_slug,
                        "stores": [store_data],
                        "status": "active"
                    }
                    
                    with open("login_debug.log", "a") as f:
                        f.write(f"[{datetime.datetime.now()}] SUCCESS (Rich): {cred.email} role={role} redirect={target_redirect}\n")
                    
                    return {
                        "success": True,
                        "token": auth_res.session.access_token,
                        "customer": rich_customer,
                        "role": role,
                        "redirect": target_redirect
                    }
                else:
                    with open("login_debug.log", "a") as f:
                        f.write(f"[{datetime.datetime.now()}] FAILURE: {cred.email} No manager/owner role for {cred.store_id}\n")
        except Exception as auth_err:
            with open("login_debug.log", "a") as f:
                f.write(f"[{datetime.datetime.now()}] ERROR: {cred.email} Auth error: {auth_err}\n")
            pass

        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unified Login Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/")
@router.get("")
async def list_customers(
    storeId: str,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    current_user: dict = Depends(verify_token)
):
    try:
        query = supabase_admin.table("customers").select("*, orders:orders(count)", count="exact").eq("store_id", storeId)
        
        if search:
            # Search by name or email
            query = query.or_(f"first_name.ilike.%{search}%,email.ilike.%{search}%")
            
        # Pagination
        start = (page - 1) * limit
        end = start + limit - 1
        query = query.range(start, end).order("created_at", desc=True)
        
        res = query.execute()
        
        items = []
        for c in (res.data or []):
            # Map to frontend expected format
            items.append({
                "_id": c["id"],
                "storeId": c.get("store_id"),
                "name": c.get("first_name", "Unknown"),
                "email": c.get("email"),
                "phone": c.get("phone"),
                "status": "active", # Defaulting to active as status col might not exist
                "createdAt": c.get("created_at"),
                "totalOrders": c.get("orders", [{}])[0].get("count", 0) if c.get("orders") else 0
            })
            
        return {
            "items": items,
            "total": res.count or 0
        }
    except Exception as e:
        print(f"Error listing customers: {e}")
        return {"items": [], "total": 0}

@router.get("/{customer_id}")
async def get_customer(customer_id: str, storeId: str, current_user: dict = Depends(verify_token)):
    try:
        customer_res = supabase_admin.table("customers").select("id, email, first_name, created_at").eq("id", customer_id).eq("store_id", storeId).limit(1).execute()
        if not customer_res.data:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        orders_res = supabase_admin.table("orders").select("id, total_amount, status, created_at").eq("customer_id", customer_id).eq("store_id", storeId).execute()
        
        data = customer_res.data[0]
        data["name"] = data["first_name"]
        data["orders"] = orders_res.data or []
        
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_customer_manager(
    customer: dict = Body(...),
    current_user: dict = Depends(verify_token)
):
    try:
        if not customer.get("email") or not customer.get("password") or not customer.get("name"):
            raise HTTPException(status_code=400, detail="Name, email and password are required")
            
        store_id = customer.get("storeId")
        if not store_id:
             # Try snake_case fallback
             store_id = customer.get("store_id")
        
        if not store_id:
            raise HTTPException(status_code=400, detail="Store ID required")

        # Check existing
        existing = supabase_admin.table("customers").select("id").eq("email", customer["email"]).eq("store_id", store_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_pw = get_password_hash(customer["password"])
        
        new_customer = {
            "store_id": store_id,
            "first_name": customer["name"],
            "last_name": f"PWD:{hashed_pw}",
            "email": customer["email"],
            "phone": customer.get("phone"),
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        
        res = supabase_admin.table("customers").insert(new_customer).execute()
        if res.data:
            return {"success": True, "data": res.data[0]}
        else:
            raise HTTPException(status_code=500, detail="Failed to create customer")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_customer(
    id: str,
    customer: dict = Body(...),
    current_user: dict = Depends(verify_token)
):
    try:
        update_data = {}
        if "name" in customer:
            update_data["first_name"] = customer["name"]
        if "email" in customer:
            update_data["email"] = customer["email"]
        if "phone" in customer:
            update_data["phone"] = customer["phone"]
            
        if not update_data:
             return {"success": True, "message": "No changes"}

        res = supabase_admin.table("customers").update(update_data).eq("id", id).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_customer(
    id: str,
    current_user: dict = Depends(verify_token)
):
    try:
        res = supabase_admin.table("customers").delete().eq("id", id).execute()
        return {"success": True, "message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
