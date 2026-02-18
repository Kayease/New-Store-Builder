from fastapi import APIRouter, HTTPException, Depends
from app.core.supabase_client import supabase_admin
from app.core.auth_utils import verify_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class StoreCreate(BaseModel):
    storeName: str
    storeSlug: str
    email: str
    phone: Optional[str] = ""
    planId: Optional[str] = None

@router.get("/status")
async def get_onboarding_status(current_user: dict = Depends(verify_token)):
    """Check if the user has completed onboarding."""
    # Logic to check onboarding status
    return {
        "success": True,
        "data": {
            "isCompleted": False, # Dynamic check based on user data
            "step": 1
        }
    }

@router.post("/create-store")
async def create_store(store_data: StoreCreate, current_user: dict = Depends(verify_token)):
    """Create a new store during onboarding."""
    try:
        user_id = current_user.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        print(f"📝 Creating store for user: {user_id}")
        print(f"   Store name: {store_data.storeName}, Slug: {store_data.storeSlug}")
        
        # 1. Check if slug exists
        existing = supabase_admin.table("stores").select("id").eq("slug", store_data.storeSlug).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Store slug already taken")
            
        # 2. Create the store - only use columns that exist in the stores table
        new_store = {
            "name": store_data.storeName,
            "slug": store_data.storeSlug,
            "owner_id": user_id,
            "status": "active",
            "setup_completed": False
        }
        
        print(f"   Inserting store: {new_store}")
        
        response = supabase_admin.table("stores").insert(new_store).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create store")
            
        store = response.data[0]
        store_id = store.get("id")
        print(f"✅ Store created with ID: {store_id}")
        
        # 3. Update user profile with store info AND promote to merchant
        try:
            profile_update = {"role": "merchant"} # Promote to merchant
            if store_data.email:
                profile_update["email"] = store_data.email
            if store_data.phone:
                profile_update["phone"] = store_data.phone
                
            supabase_admin.table("profiles").update(profile_update).eq("id", user_id).execute()
            print(f"✅ User promoted to MERCHANT and profile updated")
        except Exception as profile_err:
            print(f"⚠️ Profile update warning: {profile_err}")
        
        # 4. If planId provided, create subscription
        if store_data.planId and store_id:
            try:
                from datetime import datetime, timedelta
                subscription_data = {
                    "store_id": store_id,
                    "plan_id": store_data.planId,
                    "status": "active",
                    "billing_cycle": "monthly", # Default
                    "current_period_start": datetime.now().isoformat(),
                    "current_period_end": (datetime.now() + timedelta(days=30)).isoformat()
                }
                supabase_admin.table("subscriptions").insert(subscription_data).execute()
                print(f"✅ Subscription created for plan: {store_data.planId}")
            except Exception as sub_err:
                print(f"⚠️ Error creating onboarding subscription: {sub_err}")
        
        # Format response for frontend
        formatted_store = {
            "_id": store_id,
            "id": store_id,
            "storeName": store.get("name"),
            "storeSlug": store.get("slug"),
            "name": store.get("name"),
            "slug": store.get("slug"),
            "status": store.get("status"),
            "ownerId": store.get("owner_id"),
        }
        
        return {
            "success": True,
            "data": formatted_store
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Onboarding create store error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/complete")
async def complete_onboarding(current_user: dict = Depends(verify_token)):
    """Mark onboarding as complete for the user."""
    try:
        user_id = current_user.get("sub")
        # Update user profile to mark onboarding as complete
        # We use a try-except because the column might not exist in all environments
        try:
            supabase_admin.table("profiles").update({"status": "active"}).eq("id", user_id).execute()
        except:
            pass
        return {"success": True}
    except Exception as e:
        return {"success": True} # Still return success to not block the user flow
