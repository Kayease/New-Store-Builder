from fastapi import APIRouter, HTTPException, Depends
from app.core.supabase_client import supabase_admin
from app.core.auth_utils import verify_token
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

router = APIRouter()

@router.get("/")
async def list_orders(storeId: str, status: Optional[str] = None, current_user: dict = Depends(verify_token)):
    try:
        query = supabase_admin.table("orders").select("*, customers(first_name, last_name, email), order_items(id)").eq("store_id", storeId)
        if status:
            query = query.eq("status", status)
        
        response = query.order("created_at", desc=True).execute()
        
        data = []
        for o in (response.data or []):
            o_copy = o.copy()
            cust = o.get("customers")
            if cust:
                o_copy["customer_name"] = f"{cust.get('first_name', '')} {cust.get('last_name', '')}".strip()
                o_copy["customer_email"] = cust.get("email")
            
            # Count items
            o_copy["items_count"] = len(o.get("order_items", []))
            data.append(o_copy)
            
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{order_id}")
async def get_order(order_id: str, storeId: str, current_user: dict = Depends(verify_token)):
    try:
        response = supabase_admin.table("orders").select("*, order_items(*)").eq("id", order_id).eq("store_id", storeId).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Order not found")
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, payload: Dict[str, Any], current_user: dict = Depends(verify_token)):
    try:
        status = payload.get("status")
        if not status:
            raise HTTPException(status_code=400, detail="Status is required")
            
        store_id = payload.get("storeId")
        
        response = supabase_admin.table("orders").update({"status": status}).eq("id", order_id).eq("store_id", store_id).execute()
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
