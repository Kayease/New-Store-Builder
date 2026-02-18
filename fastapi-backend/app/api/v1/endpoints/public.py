"""
Public API endpoints - No authentication required
"""
from fastapi import APIRouter, HTTPException
from app.core.supabase_client import supabase_admin

router = APIRouter()

@router.get("/subscription-plans")
async def list_public_plans():
    """
    List all active subscription plans for public display.
    No authentication required.
    """
    print("📡 GET /subscription-plans requested")
    try:
        response = supabase_admin.table("subscription_plans").select("*").eq("is_active", True).order("price_monthly", desc=False).execute()
        plans = response.data or []
        print(f"✅ Found {len(plans)} active plans")
        
        # Map to frontend-expected format
        mapped_plans = []
        for plan in plans:
            plan_id = plan.get("id", "")
            mapped_plans.append({
                "id": plan_id,
                "_id": plan_id,
                "name": plan.get("name", ""),
                "slug": plan.get("slug", plan.get("name", "").lower().replace(" ", "-")),
                "price_monthly": plan.get("price_monthly", 0),
                "price_yearly": plan.get("price_yearly", 0),
                "priceMonthly": plan.get("price_monthly", 0),
                "priceYearly": plan.get("price_yearly", 0),
                "features": plan.get("features", []),
                "is_active": plan.get("is_active", True),
                "isActive": plan.get("is_active", True),
            })
        
        return {"items": mapped_plans, "total": len(mapped_plans), "data": mapped_plans}
    except Exception as e:
        print(f"Error fetching public plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subscription-plans/{plan_id}")
async def get_public_plan(plan_id: str):
    """
    Get a single subscription plan by ID.
    No authentication required.
    """
    try:
        response = supabase_admin.table("subscription_plans").select("*").eq("id", plan_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        plan = response.data
        plan_id = plan.get("id", "")
        return {
            "id": plan_id,
            "_id": plan_id,
            "name": plan.get("name", ""),
            "slug": plan.get("slug", plan.get("name", "").lower().replace(" ", "-")),
            "price_monthly": plan.get("price_monthly", 0),
            "price_yearly": plan.get("price_yearly", 0),
            "priceMonthly": plan.get("price_monthly", 0),
            "priceYearly": plan.get("price_yearly", 0),
            "features": plan.get("features", []),
            "is_active": plan.get("is_active", True),
            "isActive": plan.get("is_active", True),
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail="Plan not found")


@router.get("/themes")
async def list_public_themes():
    """
    List all active themes for public display.
    No authentication required.
    """
    try:
        response = supabase_admin.table("themes").select("*").eq("status", "active").execute()
        themes = response.data or []
        
        mapped_themes = []
        for theme in themes:
            theme_id = theme.get("id", "")
            mapped_themes.append({
                "id": theme_id,
                "_id": theme_id,
                "name": theme.get("name", ""),
                "slug": theme.get("slug", ""),
                "description": theme.get("description", ""),
                "thumbnail_url": theme.get("thumbnail_url", ""),
                "thumbnailUrl": theme.get("thumbnail_url", ""),
                "build_url": theme.get("build_url", ""),
                "buildUrl": theme.get("build_url", ""),
                "status": theme.get("status", "active"),
            })
        
        return {"items": mapped_themes, "total": len(mapped_themes), "data": mapped_themes}
    except Exception as e:
        print(f"Error fetching public themes: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/themes/{slug}")
async def get_public_theme(slug: str):
    """
    Get a single theme by slug.
    No authentication required.
    """
    try:
        response = supabase_admin.table("themes").select("*").eq("slug", slug).eq("status", "active").single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Theme not found")
        
        theme = response.data
        theme_id = theme.get("id", "")
        return {
            "id": theme_id,
            "_id": theme_id,
            "name": theme.get("name", ""),
            "slug": theme.get("slug", ""),
            "description": theme.get("description", ""),
            "thumbnail_url": theme.get("thumbnail_url", ""),
            "thumbnailUrl": theme.get("thumbnail_url", ""),
            "build_url": theme.get("zip_url", ""),
            "buildUrl": theme.get("zip_url", ""),
            "buildPath": theme.get("zip_url", ""), # Consistency with map_theme
            "status": theme.get("status", "active"),
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail="Theme not found")
