from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.supabase_client import supabase, supabase_admin
from app.core.auth_utils import verify_token
from typing import Optional, Dict, Any
import jwt
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter()

class StoreCreate(BaseModel):
    storeName: str
    storeSlug: str
    email: Optional[str] = None
    phone: Optional[str] = None
    planId: Optional[str] = None

class StoreUpdate(BaseModel):
    storeName: Optional[str] = None
    storeSlug: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    businessName: Optional[str] = None
    taxId: Optional[str] = None
    description: Optional[str] = None
    tagline: Optional[str] = None
    social: Optional[Dict[str, Any]] = None
    analytics: Optional[Dict[str, Any]] = None
    seo: Optional[Dict[str, Any]] = None
    favicons: Optional[Dict[str, Any]] = None
    logoUrl: Optional[str] = None

def get_optional_user_id(request: Request) -> Optional[str]:
    """Extract user ID from token if present."""
    try:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            # Use lenient decoding to match auth_utils (emergency mode)
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub")
    except Exception as e:
        print(f"Token extraction error: {e}")
        pass
    return None

@router.get("/")
async def get_stores(request: Request):
    """
    List Stores (General Page API - List)
    
    Fetch stores for the current user.
    """
    try:
        user_id = get_optional_user_id(request)
        
        if user_id:
            # Authenticated user - fetch their stores
            response = supabase_admin.table("stores").select("*").eq("owner_id", user_id).execute()
        else:
            # No auth - return empty or limited data
            return {"data": [], "items": [], "total": 0}
        
        stores = response.data or []
        
        # Format for frontend
        formatted = []
        for store in stores:
            formatted.append({
                "_id": store.get("id"),
                "id": store.get("id"),
                "storeName": store.get("store_name") or store.get("name", ""),
                "storeSlug": store.get("slug", ""),
                "name": store.get("store_name") or store.get("name", ""),
                "slug": store.get("slug", ""),
                "status": store.get("status", "active"),
                "isActive": store.get("status") == "active",
                "ownerId": store.get("owner_id"),
                "planId": store.get("plan_id"),
                "themeId": (store.get("config") or {}).get("theme_id"),
                "createdAt": store.get("created_at"),
            })
        
        return {
            "success": True,
            "data": formatted, 
            "items": formatted, 
            "total": len(formatted)
        }
    except Exception as e:
        print(f"Error fetching stores: {e}")
        return {
            "success": False, 
            "data": [], 
            "items": [], 
            "total": 0,
            "error": str(e)
        }

@router.post("/")
async def create_store(store_data: StoreCreate, current_user: dict = Depends(verify_token)):
    """
    Create Store (General Page API - Create)
    
    Creates a new store for the authenticated user.
    """
    try:
        user_id = current_user.get("sub")
        
        # 1. Check uniqueness
        existing = supabase_admin.table("stores").select("id").eq("slug", store_data.storeSlug).execute()
        if existing.data:
             raise HTTPException(status_code=400, detail="Store slug already taken")
             
        # 2. Insert
        new_store = {
            "name": store_data.storeName,
            "slug": store_data.storeSlug,
            "owner_id": user_id,
            "status": "active",
            "config": {
                "email": store_data.email,
                "phone": store_data.phone
            }
        }
        
        if store_data.planId:
            new_store["plan_id"] = store_data.planId
            
        response = supabase_admin.table("stores").insert(new_store).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create store")
            
        store = response.data[0]
        
        return {
            "success": True,
            "data": {
                "_id": store.get("id"),
                "id": store.get("id"),
                "storeName": store.get("name"),
                "storeSlug": store.get("slug"),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating store: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/slug/{slug}")
async def get_store_by_slug(slug: str):
    """
    Get Store Details (General Page API - Read)
    
    Fetch store details by slug, including full configuration.
    """
    try:
        response = supabase_admin.table("stores").select("*").eq("slug", slug).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Store not found")
        
        store = response.data
        config = store.get("config") or {}
        
        # Format for frontend
        return {
            "success": True,
            "data": {
                "_id": store.get("id"),
                "id": store.get("id"),
                "storeName": store.get("name"),
                "storeSlug": store.get("slug"),
                "name": store.get("name"),
                "slug": store.get("slug"),
                "status": store.get("status", "active"),
                "isActive": store.get("status") == "active",
                "ownerId": store.get("owner_id"),
                "planId": store.get("plan_id"),
                "themeId": config.get("theme_id"),
                "logoUrl": store.get("logo_url"),
                
                # Unpack config fields
                "email": config.get("email"),
                "phone": config.get("phone"),
                "businessName": config.get("business_name"),
                "taxId": config.get("tax_id"),
                "description": config.get("description"),
                "tagline": config.get("tagline"),
                "social": config.get("social", {}),
                "analytics": config.get("analytics", {}),
                "seo": config.get("seo", {}),
                "favicons": config.get("favicons", {}),
                
                "createdAt": store.get("created_at"),
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching store by slug: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/slug/{slug}/check")
async def check_slug_availability(slug: str):
    """
    Check Slug Availability
    """
    try:
        response = supabase_admin.table("stores").select("id").eq("slug", slug).execute()
        
        is_available = len(response.data or []) == 0
        
        return {
            "success": True,
            "data": {
                "available": is_available,
                "slug": slug
            }
        }
    except Exception as e:
        print(f"Error checking slug availability: {e}")
        # On error, assume not available to be safe
        return {
            "success": True,
            "data": {
                "available": False,
                "slug": slug
            }
        }

@router.get("/slug/{slug}/subscription")
async def get_store_subscription(slug: str):
    """
    Get Store Active Subscription (Dedicated API)
    
    Fetches the current active subscription for a store directly from the subscriptions table.
    """
    try:
        # 1. Get Store ID
        store_res = supabase_admin.table("stores").select("id").eq("slug", slug).single().execute()
        if not store_res.data:
            raise HTTPException(status_code=404, detail="Store not found")
        
        store_id = store_res.data["id"]
        
        # 2. Get Active Subscription
        # Try to find an active one first
        sub_res = supabase_admin.table("subscriptions").select("*").eq("store_id", store_id).eq("status", "active").order("created_at", desc=True).limit(1).execute()
        
        subscription = None
        if sub_res.data:
            subscription = sub_res.data[0]
        else:
            # If no active, try to find *any* recent subscription to show status (e.g. cancelled, past_due)
            latest_res = supabase_admin.table("subscriptions").select("*").eq("store_id", store_id).order("created_at", desc=True).limit(1).execute()
            if latest_res.data:
                subscription = latest_res.data[0]
        
        if not subscription:
            return {
                "success": True,
                "data": None,
                "message": "No subscription found"
            }
            
        # 3. Get Plan Details
        plan_res = supabase_admin.table("subscription_plans").select("*").eq("id", subscription["plan_id"]).single().execute()
        plan = plan_res.data or {}
        
        # 4. Combine key data
        return {
            "success": True,
            "data": {
                "subscription_id": subscription["id"],
                "status": subscription["status"],
                "next_billing_date": subscription.get("current_period_end"),
                "billing_cycle": subscription.get("billing_cycle"),
                "plan": {
                    "id": plan.get("id"),
                    "name": plan.get("name"),
                    "price_monthly": plan.get("price_monthly"),
                    "features": plan.get("features")
                },
                "created_at": subscription["created_at"]
            }
        }
        
    except Exception as e:
        print(f"Error fetching store subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/store-check/{slug}")
async def resolve_store_slug(slug: str):
    """
    Resolve store slug to ID for frontend compatibility.
    """
    try:
        response = supabase_admin.table("stores").select("id").eq("slug", slug).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Store not found")
            
        return {
            "success": True,
            "data": {
                "store": {
                    "_id": response.data["id"],
                    "id": response.data["id"]
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{slug}")
async def update_store(slug: str, payload: Dict[str, Any], current_user: dict = Depends(verify_token)):
    """
    Update Store Settings (General Page API - Update)
    """
    user_id = current_user.get("sub")
    role = current_user.get("role")
    
    try:
        # 1. Fetch existing store to verify ownership/access
        response = supabase_admin.table("stores").select("*").eq("slug", slug).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Store not found")
        
        store = response.data
        
        # Check if user is owner, manager, or platform admin
        is_owner = store.get("owner_id") == user_id
        is_manager = store.get("manager_id") == user_id
        is_admin = role == "admin"
        
        if not (is_owner or is_manager or is_admin):
            raise HTTPException(status_code=403, detail="Not authorized to update this store")
            
        store_id = store.get("id")
        current_config = store.get("config") or {}
        
        # 2. Prepare updates
        updates = {
            "updated_at": "now()"
        }
        
        if "storeName" in payload:
            updates["name"] = payload["storeName"]
        if "storeSlug" in payload:
            updates["slug"] = payload["storeSlug"]
        if "logoUrl" in payload:
            updates["logo_url"] = payload["logoUrl"]
            
        # Config fields mapping
        new_config = current_config.copy()
        
        mapping = {
            "email": "email",
            "phone": "phone",
            "businessName": "business_name",
            "taxId": "tax_id",
            "description": "description",
            "tagline": "tagline",
            "social": "social",
            "analytics": "analytics",
            "seo": "seo",
            "favicons": "favicons",
            "themeId": "theme_id"
        }
        
        for key, config_key in mapping.items():
            if key in payload:
                new_config[config_key] = payload[key]
        
        updates["config"] = new_config
        
        # 3. Perform update
        print(f"DEBUG: Updating store {store_id} with: {updates}")
        update_res = supabase_admin.table("stores").update(updates).eq("id", store_id).execute()
        
        # In Supabase, update() returns the updated row. 
        # If it's empty, it might mean the row was not found (unlikely here) or nothing changed.
        if not update_res.data:
            print(f"⚠️ Update returned no data for store {store_id}. Checking if it exists...")
            # Verify it still exists
            check_res = supabase_admin.table("stores").select("id").eq("id", store_id).execute()
            if not check_res.data:
                 raise HTTPException(status_code=404, detail="Store lost during update")
            
            # If it exists, it was likely a no-op or successful but returned no data
            return {
                "success": True,
                "message": "Store updated (no changes detected or successfully applied)",
                "data": payload
            }
             
        updated_store = update_res.data[0]
        print(f"✅ Store {store_id} updated successfully")
        
        return {
            "success": True,
            "data": {
                **payload, 
                "storeSlug": updated_store.get("slug"),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating store: {e}")
        raise HTTPException(status_code=500, detail=f"Database Update Error: {str(e)}")

@router.delete("/slug/{slug}")
async def delete_store(slug: str, current_user: dict = Depends(verify_token)):
    """
    Delete Store (General Page API - Delete)
    
    Permanently delete a store and its data.
    """
    try:
        user_id = current_user.get("sub")
        
        # 1. Verify ownership
        response = supabase_admin.table("stores").select("id, owner_id").eq("slug", slug).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Store not found")
            
        store = response.data
        if store.get("owner_id") != user_id:
             raise HTTPException(status_code=403, detail="Not authorized to delete this store")
             
        # 2. Delete (Cascade should handle related data if set up in DB, else might need manual cleanup)
        # Assuming Safe/Soft delete or Hard delete based on requirements. using hard delete for now.
        del_res = supabase_admin.table("stores").delete().eq("id", store["id"]).execute()
        
        if not del_res.data:
             # It might return empty if deleted successfully but no data returned, check supabase behavior
             pass
             
        return {
            "success": True,
            "message": "Store deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting store: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class StoreSendOTP(BaseModel):
    storeId: str
    email: Optional[str] = None

class StoreVerifyOTP(BaseModel):
    storeId: str
    otp: str

# In-memory OTP storage for store settings
store_otp_storage = {}

# --- Team Management moved to team.py ---


@router.post("/send-otp")
async def send_store_otp(payload: StoreSendOTP, current_user: dict = Depends(verify_token)):
    """
    Send OTP for critical store updates (General Page)
    """
    import random
    email = payload.email
    # Generate dummy OTP
    otp = str(random.randint(100000, 999999))
    
    # Store it (keyed by storeId for simplicity as per frontend request, or email)
    store_otp_storage[payload.storeId] = otp
    
    print(f"DEBUG: Store OTP for {email} (Store: {payload.storeId}) is {otp}")
    
    return {
        "success": True,
        "message": "OTP sent successfully",
        "data": {
            "otp": otp # Return it so dev can see it
        }
    }

@router.post("/verify-otp")
async def verify_store_otp(payload: StoreVerifyOTP, current_user: dict = Depends(verify_token)):
    """
    Verify OTP for critical store updates
    """
    stored_otp = store_otp_storage.get(payload.storeId)
    
    if stored_otp and stored_otp == payload.otp:
        del store_otp_storage[payload.storeId]
        return {
            "success": True, 
            "message": "OTP verified",
            "data": {
                "verified": True
            }
        }
        
    raise HTTPException(status_code=400, detail="Invalid OTP")
    
@router.get("/{store_id}")
async def get_store_details(store_id: str):
    """
    Get Store By ID with Statistics
    """
    try:
        # 1. Fetch Store Basic Info
        response = supabase_admin.table("stores").select("*").eq("id", store_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Store not found")
        
        store = response.data

        # 2. Fetch Real Statistics
        # Count Products
        prod_res = supabase_admin.table("products").select("id", count="exact").eq("store_id", store_id).limit(1).execute()
        prod_count = getattr(prod_res, 'count', 0)
        
        # Count Customers
        cust_res = supabase_admin.table("customers").select("id", count="exact").eq("store_id", store_id).limit(1).execute()
        cust_count = getattr(cust_res, 'count', 0)
        
        # Count Categories
        cat_res = supabase_admin.table("categories").select("id", count="exact").eq("store_id", store_id).limit(1).execute()
        cat_count = getattr(cat_res, 'count', 0)
        
        # Count Team Members
        store_slug = store.get("slug")
        team_res = supabase_admin.table("profiles").select("id", count="exact").eq("store_slug", store_slug).limit(1).execute() if store_slug else None
        team_count = getattr(team_res, 'count', 0) if team_res else 0

        return {
            "success": True,
            "data": {
                "_id": store.get("id"),
                "id": store.get("id"),
                "storeName": store.get("store_name") or store.get("name", ""),
                "storeSlug": store.get("slug", ""),
                "name": store.get("store_name") or store.get("name", ""),
                "slug": store.get("slug", ""),
                "status": store.get("status", "active"),
                "isActive": store.get("status") == "active",
                "ownerId": store.get("owner_id"),
                "planId": store.get("plan_id"),
                "themeId": (store.get("config") or {}).get("theme_id"),
                "createdAt": store.get("created_at"),
                "custom_domain": store.get("custom_domain"),
                # Real Stats
                "stats": {
                    "activeProducts": prod_count,
                    "activeCustomers": cust_count,
                    "activeCategories": cat_count,
                    "teamSize": team_count,
                    "uptime": "99.99%", # Static for now
                    "latency": "24ms"    # Static for now
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching store details: {e}")
        return {
            "success": False,
            "error": str(e)
        }
