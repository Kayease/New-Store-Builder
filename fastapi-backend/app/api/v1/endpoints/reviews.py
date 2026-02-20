from fastapi import APIRouter, Depends, HTTPException, Query, Path, Body, UploadFile, File, Form
from typing import List, Optional, Any
from app.core.supabase_client import supabase_admin
from app.core.auth_utils import verify_token as get_current_user
from datetime import datetime
import uuid
import json

router = APIRouter()

@router.get("/")
@router.get("")
async def list_reviews(
    storeId: str = Query(..., description="Store ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    rating: Optional[str] = Query(None), # Could be "any", "5", etc.
    current_user: dict = Depends(get_current_user)
):
    try:
        query = supabase_admin.table("reviews").select("*", count="exact").eq("store_id", storeId)

        if status and status != "all":
            query = query.eq("status", status)
            
        if rating and rating != "any":
            try:
                r_val = int(rating)
                query = query.eq("rating", r_val)
            except:
                pass

        # Pagination logic
        start = (page - 1) * limit
        end = start + limit - 1
        query = query.range(start, end).order("created_at", desc=True)

        res = query.execute()
        
        # Transform response to match frontend expectations
        # Frontend expects: { items: [...], total: ... } or { data: { items: ..., total: ... } }
        items = []
        for item in (res.data or []):
            # Map backend snake_case to frontend camelCase where needed, or return as is
            # Frontend uses: _id, userName, userEmail, title, content, rating, status, images: [{url: ...}]
            
            # Backend might store images as JSON array of strings or objects
            imgs = item.get("images", [])
            if isinstance(imgs, str):
                try:
                    imgs = json.loads(imgs)
                except:
                    imgs = []
            
            # Ensure images are list of objects with url
            formatted_images = []
            for img in imgs:
                if isinstance(img, str):
                    formatted_images.append({"url": img})
                elif isinstance(img, dict) and "url" in img:
                    formatted_images.append(img)
            
            items.append({
                "_id": item["id"],
                "userName": item.get("user_name"),
                "userEmail": item.get("user_email"),
                "title": item.get("title"),
                "content": item.get("content"),
                "rating": item.get("rating"),
                "status": item.get("status"),
                "images": formatted_images,
                "createdAt": item.get("created_at")
            })

        return {
            "items": items,
            "total": res.count or 0
        }

    except Exception as e:
        print(f"Error listing reviews: {e}")
        return {"items": [], "total": 0}

@router.post("/")
async def create_review(
    storeId: str = Form(...),
    userName: str = Form(...),
    userEmail: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    content: Optional[str] = Form(None),
    rating: float = Form(...),
    productId: str = Form(...), # Usually required
    orderId: Optional[str] = Form(None),
    userId: Optional[str] = Form(None),
    images: List[UploadFile] = File(None),
    # current_user: dict = Depends(get_current_user) # Optional for dev/public create
):
    try:
        # Upload images if any
        image_urls = []
        if images:
            # Import upload utility here to avoid circular imports
            # Assuming a simple upload utility exists or implementing basic placeholder
            # For now, we'll skip actual file processing logic unless we import cloudinary
            pass

        # Use dummy image URLs for dev if uploads fail or not implemented
        # Real implementation would upload to storage
        
        new_review = {
            "store_id": storeId,
            "user_name": userName,
            "user_email": userEmail,
            "title": title,
            "content": content,
            "rating": rating,
            "product_id": productId,
            "order_id": orderId,
            "user_id": userId,
            "status": "new",
            "images": image_urls, # Store as JSONB
            "created_at": datetime.utcnow().isoformat()
        }
        
        res = supabase_admin.table("reviews").insert(new_review).execute()
        
        if res.data:
            return {"success": True, "data": res.data[0]}
        else:
            raise HTTPException(status_code=500, detail="Failed to create review")

    except Exception as e:
        print(f"Error creating review: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{id}/status")
async def update_review_status(
    id: str,
    status: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    try:
        res = supabase_admin.table("reviews").update({"status": status}).eq("id", id).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_review(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        res = supabase_admin.table("reviews").delete().eq("id", id).execute()
        return {"success": True, "message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
