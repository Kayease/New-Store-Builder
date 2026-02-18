
from fastapi import APIRouter, HTTPException, Depends
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
        # Fetch specifically the columns we know exist
        res = supabase_admin.table("customers").select("id, email, first_name, last_name, store_id").eq("email", cred.email).eq("store_id", cred.store_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=400, detail="Invalid email or password")
            
        customer = res.data[0]
        
        # Retrieve hash from the 'last_name' vault
        stored_hash_field = customer.get("last_name", "")
        if not stored_hash_field.startswith("PWD:"):
             raise HTTPException(status_code=400, detail="Authentication not enabled for this account")
        
        hashed = stored_hash_field.replace("PWD:", "")
             
        if not verify_password(cred.password, hashed):
            raise HTTPException(status_code=400, detail="Invalid email or password")
            
        token = create_customer_token(customer['id'], cred.store_id)
        
        # Cleanup response data
        customer['name'] = customer['first_name']
        
        return {"success": True, "token": token, "customer": customer}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_customers(storeId: str, current_user: dict = Depends(verify_token)):
    try:
        response = supabase_admin.table("customers").select("id, email, first_name, created_at").eq("store_id", storeId).execute()
        return {"success": True, "data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
