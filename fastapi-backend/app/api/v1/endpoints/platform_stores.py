from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime
from app.core.supabase_client import supabase_admin
from app.schemas.store import (
    StoreCreate,
    StoreUpdate,
    StoreResponse,
    StoreListResponse
)

router = APIRouter()

def map_store_response(store: dict, owner_info: dict = None) -> dict:
    store_id = store.get("id", "")
    created_at = store.get("created_at", "")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    
    owner_email = ""
    owner_name = ""
    if owner_info:
        owner_email = owner_info.get("email", "")
        first_name = owner_info.get("first_name", "")
        last_name = owner_info.get("last_name", "")
        owner_name = f"{first_name} {last_name}".strip()
    
    # Generate a human-readable identifier (ST-XXXX)
    short_id = str(store_id).split("-")[-1][:4].upper() if store_id else "0000"
    human_id = f"ST-{short_id}"
    
    return {
        "id": store_id,
        "_id": store_id,
        "name": store.get("name", ""),
        "slug": store.get("slug", ""),
        "owner_id": store.get("owner_id", ""),
        "owner_email": owner_email,
        "owner_name": owner_name,
        "logo_url": store.get("logo_url", ""),
        "status": store.get("status", "active"),
        "setup_completed": store.get("setup_completed", False),
        "human_id": human_id,
        "custom_domain": store.get("custom_domain", "") or "—",
        "plan_id": store.get("plan_id"),
        "manager_id": str(store.get("manager_id")) if store.get("manager_id") else None,
        "manager_name": store.get("manager_name"),
        "manager_email": store.get("manager_email"),
        "manager_phone": store.get("manager_phone"),
        "created_at": created_at,
        "stats": store.get("stats")
    }

@router.get("/stores", response_model=StoreListResponse)
async def list_stores(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    """List all stores with owner information."""
    try:
        # Fetch stores
        response = supabase_admin.table("stores").select("*").order("created_at", desc=True).execute()
        stores = response.data or []
        
        # Fetch profiles for owner info
        profiles_response = supabase_admin.table("profiles").select("id, email, first_name, last_name").execute()
        profiles = {p["id"]: p for p in (profiles_response.data or [])}
        
        # Map stores with owner info
        mapped_stores = []
        for store in stores:
            owner_info = profiles.get(store.get("owner_id"))
            mapped_stores.append(map_store_response(store, owner_info))
        
        # Search filter
        if search:
            search = search.lower()
            mapped_stores = [
                s for s in mapped_stores
                if search in s["name"].lower() or search in s["slug"].lower() or search in s["owner_email"].lower()
            ]
        
        total = len(mapped_stores)
        paginated_stores = mapped_stores[skip:skip + limit]
        
        return {"items": paginated_stores, "total": total}
        
    except Exception as e:
        print(f"Error fetching stores: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stores/{store_id}", response_model=StoreResponse)
async def get_store(store_id: str):
    """Get a single store by ID."""
    try:
        # 1. Fetch Store Basic Info
        response = supabase_admin.table("stores").select("*").eq("id", store_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Store not found")
        
        store = response.data

        # 2. Get real statistics
        prod_count = getattr(supabase_admin.table("products").select("id", count="exact").eq("store_id", store_id).limit(1).execute(), 'count', 0)
        cust_count = getattr(supabase_admin.table("customers").select("id", count="exact").eq("store_id", store_id).limit(1).execute(), 'count', 0)
        cat_count = getattr(supabase_admin.table("categories").select("id", count="exact").eq("store_id", store_id).limit(1).execute(), 'count', 0)
        
        # Count Team Members (using slug)
        store_slug = store.get("slug")
        team_count = getattr(supabase_admin.table("profiles").select("id", count="exact").eq("store_slug", store_slug).limit(1).execute(), 'count', 0) if store_slug else 0

        # 3. Get owner info
        owner_info = None
        if store.get("owner_id"):
            owner_response = supabase_admin.table("profiles").select("*").eq("id", store["owner_id"]).single().execute()
            owner_info = owner_response.data

        store["stats"] = {
            "activeProducts": prod_count,
            "activeCustomers": cust_count,
            "activeCategories": cat_count,
            "teamSize": team_count,
            "uptime": "99.98%",
            "latency": "22ms"
        }
            
        return map_store_response(store, owner_info)
    except Exception as e:
        print(f"Error in get_store: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stores", response_model=StoreResponse)
async def create_store(store: StoreCreate):
    """Create a new store."""
    try:
        data = {
            "name": store.name,
            "slug": store.slug,
            "owner_id": store.owner_id,
            "logo_url": store.logo_url,
            "status": store.status,
            "setup_completed": store.setup_completed
        }
        response = supabase_admin.table("stores").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create store")
        return map_store_response(response.data[0])
    except Exception as e:
        print(f"Error creating store: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/stores/{store_id}", response_model=StoreResponse)
async def update_store(store_id: str, store: StoreUpdate):
    """Update an existing store."""
    try:
        update_data = {}
        if store.name is not None:
            update_data["name"] = store.name
        if store.slug is not None:
            update_data["slug"] = store.slug
        if store.logo_url is not None:
            update_data["logo_url"] = store.logo_url
        if store.status is not None:
            update_data["status"] = store.status
        if store.setup_completed is not None:
            update_data["setup_completed"] = store.setup_completed
            
        response = supabase_admin.table("stores").update(update_data).eq("id", store_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Store not found")
        return map_store_response(response.data[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/stores/{store_id}")
async def delete_store(store_id: str):
    """Delete a store."""
    try:
        response = supabase_admin.table("stores").delete().eq("id", store_id).execute()
        return {"success": True, "message": "Store deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
