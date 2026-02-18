from fastapi import APIRouter, HTTPException
from app.core.supabase_client import supabase_admin
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats():
    """Get all statistics for the Admin Dashboard overview."""
    try:
        # 1. Total Users
        users_res = supabase_admin.table("profiles").select("id", count="exact").execute()
        total_users = users_res.count or 0
        
        # 2. Total Stores
        stores_res = supabase_admin.table("stores").select("id", count="exact").execute()
        total_stores = stores_res.count or 0
        
        # 3. Active Stores
        active_stores_res = supabase_admin.table("stores").select("id", count="exact").ilike("status", "active").execute()
        active_stores = active_stores_res.count or 0
        
        # 4. Total Revenue (sum of all captured payments)
        payments_res = supabase_admin.table("payments").select("amount").ilike("status", "captured").execute()
        total_revenue = 0
        for p in (payments_res.data or []):
            try:
                total_revenue += float(p.get("amount", 0))
            except (ValueError, TypeError):
                pass
        
        # 5. Active Subscriptions
        subs_res = supabase_admin.table("subscriptions").select("id", count="exact").ilike("status", "active").execute()
        active_subscriptions = subs_res.count or 0
        
        # 6. Total Plans
        plans_res = supabase_admin.table("subscription_plans").select("id", count="exact").execute()
        total_plans = plans_res.count or 0
        
        # 7. Recent Payments (last 7 days)
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        recent_payments_res = supabase_admin.table("payments").select("amount").ilike("status", "captured").gte("created_at", week_ago).execute()
        recent_revenue = 0
        for p in (recent_payments_res.data or []):
            try:
                recent_revenue += float(p.get("amount", 0))
            except (ValueError, TypeError):
                pass
        
        # 8. Merchant count (role = merchant)
        merchants_res = supabase_admin.table("profiles").select("id", count="exact").ilike("role", "merchant").execute()
        total_merchants = merchants_res.count or 0
        
        return {
            "success": True,
            "data": {
                "total_users": total_users,
                "total_merchants": total_merchants,
                "total_stores": total_stores,
                "active_stores": active_stores,
                "total_revenue": total_revenue,
                "recent_revenue": recent_revenue,
                "active_subscriptions": active_subscriptions,
                "total_plans": total_plans,
                "currency": "INR"
            }
        }
        
    except Exception as e:
        print(f"❌ Dashboard stats error: {str(e)}")
        # Return empty stats instead of 400 to keep UI alive
        return {
            "success": False,
            "message": str(e),
            "data": {
                "total_users": 0,
                "total_merchants": 0,
                "total_stores": 0,
                "active_stores": 0,
                "total_revenue": 0,
                "recent_revenue": 0,
                "active_subscriptions": 0,
                "total_plans": 0,
                "currency": "INR"
            }
        }

@router.get("/recent-activity")
async def get_recent_activity():
    """Get recent platform activity for dashboard feed."""
    try:
        activities = []
        
        # Recent Users (last 5)
        users_res = supabase_admin.table("profiles").select("id, email, first_name, last_name, created_at").order("created_at", desc=True).limit(5).execute()
        for u in (users_res.data or []):
            activities.append({
                "type": "new_user",
                "message": f"New user: {u.get('first_name', '')} {u.get('last_name', '')}",
                "email": u.get("email"),
                "timestamp": u.get("created_at")
            })
        
        # Recent Stores (last 5)
        stores_res = supabase_admin.table("stores").select("id, name, slug, created_at").order("created_at", desc=True).limit(5).execute()
        for s in (stores_res.data or []):
            activities.append({
                "type": "new_store",
                "message": f"New store: {s.get('name', '')}",
                "slug": s.get("slug"),
                "timestamp": s.get("created_at")
            })
        
        # Recent Payments (last 5)
        payments_res = supabase_admin.table("payments").select("id, amount, status, created_at").order("created_at", desc=True).limit(5).execute()
        for p in (payments_res.data or []):
            activities.append({
                "type": "payment",
                "message": f"Payment received: ₹{p.get('amount', 0)}",
                "status": p.get("status"),
                "timestamp": p.get("created_at")
            })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return {
            "success": True,
            "data": {
                "items": activities[:10]
            }
        }
        
    except Exception as e:
        print(f"❌ Recent activity error: {str(e)}")
        return {
            "success": False,
            "message": str(e),
            "data": {"items": []}
        }
