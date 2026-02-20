from fastapi import APIRouter, Depends, HTTPException, Query, Body, Path
from typing import List, Optional
from datetime import datetime
from app.core.supabase_client import supabase_admin
from app.core.auth_utils import verify_token as get_current_user
import uuid

router = APIRouter()

@router.get("/")
@router.get("")
async def list_brands(
    storeId: str = Query(..., description="Store ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = supabase_admin.table("brands").select("*", count="exact").eq("store_id", storeId)
        
        if search:
            query = query.ilike("name", f"%{search}%")
            
        start = (page - 1) * limit
        end = start + limit - 1
        query = query.range(start, end).order("created_at", desc=True)
        
        res = query.execute()
        
        return {
            "items": res.data or [],
            "total": res.count or 0
        }
    except Exception as e:
        print(f"Error listing brands: {e}")
        return {"items": [], "total": 0}

@router.get("/{id}")
async def get_brand(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        res = supabase_admin.table("brands").select("*").eq("id", id).single().execute()
        if not res.data:
             raise HTTPException(status_code=404, detail="Brand not found")
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_brand(
    brand: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        if "storeId" not in brand:
             # Try to get from snake_case
             if "store_id" in brand:
                 brand["storeId"] = brand["store_id"]
             else:
                 raise HTTPException(status_code=400, detail="storeId is required")

        new_brand = {
            "store_id": brand["storeId"],
            "name": brand.get("name"),
            "slug": brand.get("slug") or str(uuid.uuid4()), # simple fallback
            "logo": brand.get("logo"),
            "description": brand.get("description"),
            "active": brand.get("active", True),
            "created_at": datetime.utcnow().isoformat()
        }
        
        res = supabase_admin.table("brands").insert(new_brand).execute()
        if res.data:
             return {"success": True, "data": res.data[0]}
        else:
             raise HTTPException(status_code=500, detail="Failed to create brand")

    except Exception as e:
        print(f"Error creating brand: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_brand(
    id: str,
    brand: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        update_data = {
            "name": brand.get("name"),
            "slug": brand.get("slug"),
            "logo": brand.get("logo"),
            "description": brand.get("description"),
            "active": brand.get("active"),
            "updated_at": datetime.utcnow().isoformat()
        }
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        res = supabase_admin.table("brands").update(update_data).eq("id", id).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_brand(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        res = supabase_admin.table("brands").delete().eq("id", id).execute()
        return {"success": True, "message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
