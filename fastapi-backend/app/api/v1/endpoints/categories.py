from fastapi import APIRouter, HTTPException, Depends
from app.core.supabase_client import supabase_admin
from app.core.auth_utils import verify_token
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

router = APIRouter()

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image: Optional[str] = None
    storeId: str

@router.get("/")
async def list_categories(storeId: str, current_user: dict = Depends(verify_token)):
    try:
        response = supabase_admin.table("categories").select("*").eq("store_id", storeId).execute()
        return {"success": True, "data": response.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_category(category: CategoryCreate, current_user: dict = Depends(verify_token)):
    try:
        new_category = {
            "name": category.name,
            "description": category.description,
            "image": category.image,
            "store_id": category.storeId
        }
        response = supabase_admin.table("categories").insert(new_category).execute()
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{category_id}")
async def delete_category(category_id: str, storeId: str, current_user: dict = Depends(verify_token)):
    try:
        supabase_admin.table("categories").delete().eq("id", category_id).eq("store_id", storeId).execute()
        return {"success": True, "message": "Category deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
