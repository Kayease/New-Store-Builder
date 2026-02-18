from fastapi import APIRouter, HTTPException
from typing import Optional, List
from datetime import datetime
from app.core.supabase_client import supabase_admin
from pydantic import BaseModel

router = APIRouter()

class SubscriptionResponse(BaseModel):
    id: str
    _id: str
    store_id: str
    store_name: str
    owner_name: str
    plan_id: str
    plan_name: str
    status: str
    billing_cycle: str
    amount: float
    current_period_start: Optional[str]
    current_period_end: Optional[str]
    startedAt: Optional[str]
    expiresAt: Optional[str]
    created_at: str
    createdAt: str
    storeId: str
    planId: str

class SubscriptionListResponse(BaseModel):
    items: List[SubscriptionResponse]
    total: int
    active_count: int
    cancelled_count: int

def map_subscription(sub: dict, store: dict, plan: dict, owner: dict) -> dict:
    sub_id = sub.get("id", "")
    created_at = sub.get("created_at", "")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
        
    return {
        "id": sub_id,
        "_id": sub_id,
        "store_id": sub.get("store_id", ""),
        "storeId": sub.get("store_id", ""),
        "store_name": store.get("name", "Unknown Store"),
        "owner_name": f"{owner.get('first_name', '')} {owner.get('last_name', '')}".strip() or "Unknown",
        "plan_id": sub.get("plan_id", ""),
        "planId": sub.get("plan_id", ""),
        "plan_name": plan.get("name", "Unknown Plan"),
        "status": sub.get("status", "inactive"),
        "billing_cycle": sub.get("billing_cycle", "monthly"),
        "amount": sub.get("amount", 0),
        "current_period_start": sub.get("current_period_start"),
        "current_period_end": sub.get("current_period_end"),
        "startedAt": sub.get("current_period_start"),
        "expiresAt": sub.get("current_period_end"),
        "created_at": created_at,
        "createdAt": created_at
    }

@router.get("/subscriptions", response_model=SubscriptionListResponse)
async def list_subscriptions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """List all subscriptions with store and plan details."""
    try:
        # 1. Fetch subscriptions
        query = supabase_admin.table("subscriptions").select("*")
        if status:
            query = query.eq("status", status)
        response = query.order("created_at", desc=True).execute()
        subscriptions = response.data or []
        
        # 2. Get stores, plans, profiles for mapping
        stores_res = supabase_admin.table("stores").select("id, name, owner_id").execute()
        stores_map = {s["id"]: s for s in (stores_res.data or [])}
        
        plans_res = supabase_admin.table("subscription_plans").select("id, name").execute()
        plans_map = {p["id"]: p for p in (plans_res.data or [])}
        
        profiles_res = supabase_admin.table("profiles").select("id, first_name, last_name").execute()
        profiles_map = {p["id"]: p for p in (profiles_res.data or [])}
        
        # 3. Map
        mapped = []
        for sub in subscriptions:
            store = stores_map.get(sub.get("store_id"), {})
            plan = plans_map.get(sub.get("plan_id"), {})
            owner = profiles_map.get(store.get("owner_id"), {})
            mapped.append(map_subscription(sub, store, plan, owner))
        
        # 4. Counts
        active_count = len([s for s in mapped if s["status"] == "active"])
        cancelled_count = len([s for s in mapped if s["status"] == "cancelled"])
        
        return {
            "items": mapped[skip:skip + limit],
            "total": len(mapped),
            "active_count": active_count,
            "cancelled_count": cancelled_count
        }
        
    except Exception as e:
        print(f"❌ Subscriptions list error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/subscriptions/{sub_id}")
async def get_subscription(sub_id: str):
    """Get single subscription details."""
    try:
        res = supabase_admin.table("subscriptions").select("*").eq("id", sub_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        sub = res.data
        
        # Get related data
        store_res = supabase_admin.table("stores").select("id, name, owner_id").eq("id", sub["store_id"]).single().execute()
        store = store_res.data or {}
        
        plan_res = supabase_admin.table("subscription_plans").select("id, name").eq("id", sub["plan_id"]).single().execute()
        plan = plan_res.data or {}
        
        owner_res = supabase_admin.table("profiles").select("id, first_name, last_name").eq("id", store.get("owner_id")).single().execute()
        owner = owner_res.data or {}
        
        return map_subscription(sub, store, plan, owner)
        
    except Exception:
        raise HTTPException(status_code=404, detail="Subscription not found")

@router.put("/subscriptions/{sub_id}")
async def update_subscription(sub_id: str, status: str):
    """Update subscription status (activate/cancel)."""
    try:
        res = supabase_admin.table("subscriptions").update({"status": status}).eq("id", sub_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Subscription not found")
        return {"success": True, "message": f"Subscription status updated to {status}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
