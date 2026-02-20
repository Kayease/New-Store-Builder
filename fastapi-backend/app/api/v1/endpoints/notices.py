from fastapi import APIRouter, Depends, HTTPException, Query, Body, Path
from typing import List, Optional
from datetime import datetime
from app.core.supabase_client import supabase_admin
from app.core.auth_utils import verify_token as get_current_user
import uuid

router = APIRouter()

@router.get("/")
async def list_notices(
    storeId: str = Query(..., description="Store ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    active_only: bool = Query(False),
    current_user: dict = Depends(get_current_user)
):
    try:
        query = supabase_admin.table("notices").select("*", count="exact").eq("store_id", storeId)
        
        if active_only:
            query = query.eq("is_active", True)
            
        start = (page - 1) * limit
        end = start + limit - 1
        query = query.range(start, end).order("created_at", desc=True)
        
        res = query.execute()
        
        items = []
        for n in (res.data or []):
            items.append({
                "_id": n["id"],
                "title": n.get("title"),
                "content": n.get("content"),
                "startDate": n.get("start_date"),
                "endDate": n.get("end_date"),
                "isActive": n.get("is_active", False),
                "createdAt": n.get("created_at"),
                "updatedAt": n.get("updated_at")
            })

        return {
            "items": items,
            "total": res.count or 0
        }
    except Exception as e:
        print(f"Error listing notices: {e}")
        return {"items": [], "total": 0}

@router.get("/active")
async def get_active_notices(
    storeId: str = Query(..., description="Store ID")
):
    """Public endpoint to get active notices for a store"""
    try:
        query = supabase_admin.table("notices").select("*").eq("store_id", storeId).eq("is_active", True)
        res = query.execute()
        return {"items": res.data or []}
    except Exception as e:
        return {"items": []}

@router.get("/stats")
async def get_notice_stats(
    storeId: str = Query(..., description="Store ID"),
    current_user: dict = Depends(get_current_user)
):
    try:
        total_res = supabase_admin.table("notices").select("id", count="exact").eq("store_id", storeId).execute()
        active_res = supabase_admin.table("notices").select("id", count="exact").eq("store_id", storeId).eq("is_active", True).execute()
        return {
            "total": total_res.count or 0,
            "active": active_res.count or 0
        }
    except Exception as e:
        return {"total": 0, "active": 0}

@router.post("/")
async def create_notice(
    notice: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        if "storeId" not in notice:
             raise HTTPException(status_code=400, detail="storeId is required")

        new_notice = {
            "store_id": notice["storeId"],
            "title": notice.get("title"),
            "content": notice.get("content"),
            "start_date": notice.get("startDate"),
            "end_date": notice.get("endDate"),
            "is_active": notice.get("isActive", True),
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("sub") or current_user.get("id")
        }
        
        res = supabase_admin.table("notices").insert(new_notice).execute()
        if res.data:
             return {"success": True, "data": res.data[0]}
        else:
             raise HTTPException(status_code=500, detail="Failed to create notice")

    except Exception as e:
        print(f"Error creating notice: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_notice(
    id: str,
    notice: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        update_data = {
            "title": notice.get("title"),
            "content": notice.get("content"),
            "start_date": notice.get("startDate"),
            "end_date": notice.get("endDate"),
            "is_active": notice.get("isActive"),
            "updated_at": datetime.utcnow().isoformat(),
            "last_modified_by": current_user.get("sub") or current_user.get("id")
        }
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}

        res = supabase_admin.table("notices").update(update_data).eq("id", id).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_notice(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        res = supabase_admin.table("notices").delete().eq("id", id).execute()
        return {"success": True, "message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{id}/toggle")
async def toggle_notice_active(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        curr = supabase_admin.table("notices").select("is_active").eq("id", id).single().execute()
        if not curr.data:
             raise HTTPException(status_code=404, detail="Notice not found")
        
        new_status = not curr.data.get("is_active", False)
        res = supabase_admin.table("notices").update({"is_active": new_status}).eq("id", id).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
