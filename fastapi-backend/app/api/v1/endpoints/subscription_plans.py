from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from app.core.supabase_client import supabase_admin
from app.schemas.subscription_plan import (
    SubscriptionPlanCreate, 
    SubscriptionPlanUpdate, 
    SubscriptionPlanResponse, 
    SubscriptionPlanListResponse
)

router = APIRouter()

def map_plan_response(plan: dict) -> dict:
    plan_id = plan.get("id", "")
    created_at = plan.get("created_at", "")
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    return {
        "id": plan_id,
        "_id": plan_id,
        "name": plan.get("name", ""),
        "price_monthly": plan.get("price_monthly", 0),
        "price_yearly": plan.get("price_yearly", 0),
        "priceMonthly": plan.get("price_monthly", 0),
        "priceYearly": plan.get("price_yearly", 0),
        "features": plan.get("features", []),
        "is_active": plan.get("is_active", True),
        "isActive": plan.get("is_active", True),
        "created_at": created_at,
        "createdAt": created_at
    }

@router.get("/plans", response_model=SubscriptionPlanListResponse)
async def list_plans():
    """List all subscription plans."""
    try:
        response = supabase_admin.table("subscription_plans").select("*").order("created_at", desc=True).execute()
        plans = response.data or []
        mapped_plans = [map_plan_response(p) for p in plans]
        return {"items": mapped_plans, "total": len(mapped_plans)}
    except Exception as e:
        print(f"Error fetching plans: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def get_plan(plan_id: str):
    """Get a single subscription plan by ID."""
    try:
        response = supabase_admin.table("subscription_plans").select("*").eq("id", plan_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Plan not found")
        return map_plan_response(response.data)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Plan not found")

@router.post("/plans", response_model=SubscriptionPlanResponse)
async def create_plan(plan: SubscriptionPlanCreate):
    """Create a new subscription plan."""
    try:
        data = {
            "name": plan.name,
            "price_monthly": plan.price_monthly,
            "price_yearly": plan.price_yearly,
            "features": plan.features,
            "is_active": plan.is_active
        }
        response = supabase_admin.table("subscription_plans").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create plan")
        return map_plan_response(response.data[0])
    except Exception as e:
        print(f"Error creating plan: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def update_plan(plan_id: str, plan: SubscriptionPlanUpdate):
    """Update an existing subscription plan."""
    try:
        update_data = {}
        if plan.name is not None:
            update_data["name"] = plan.name
        if plan.price_monthly is not None:
            update_data["price_monthly"] = plan.price_monthly
        if plan.price_yearly is not None:
            update_data["price_yearly"] = plan.price_yearly
        if plan.features is not None:
            update_data["features"] = plan.features
        if plan.is_active is not None:
            update_data["is_active"] = plan.is_active
            
        response = supabase_admin.table("subscription_plans").update(update_data).eq("id", plan_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Plan not found")
        return map_plan_response(response.data[0])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str):
    """Delete a subscription plan."""
    try:
        response = supabase_admin.table("subscription_plans").delete().eq("id", plan_id).execute()
        return {"success": True, "message": "Plan deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
