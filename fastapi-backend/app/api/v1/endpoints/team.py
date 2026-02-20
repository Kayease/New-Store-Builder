from fastapi import APIRouter, Depends, HTTPException, Query, Body, Path
from typing import List, Optional
from datetime import datetime
from app.core.supabase_client import supabase_admin, supabase
from app.core.auth_utils import verify_token as get_current_user
from app.schemas.team import TeamListResponse, TeamMemberCreate, TeamMemberResponse
import uuid

router = APIRouter()

@router.get("/")
@router.get("")
async def list_store_team(
    storeId: str = Query(..., description="Store ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Resolve store_id if it's a slug
        target_store_id = storeId
        try:
            uuid.UUID(storeId)
        except ValueError:
            # It's a slug, fetch the ID
            s_res = supabase_admin.table("stores").select("id").eq("slug", storeId).single().execute()
            if s_res.data:
                target_store_id = s_res.data["id"]
            else:
                return {"items": [], "total": 0}

        query = supabase_admin.table("store_managers").select("*", count="exact").eq("store_id", target_store_id)
        
        if search:
            query = query.or_(f"first_name.ilike.%{search}%,email.ilike.%{search}%")
            
        start = (page - 1) * limit
        end = start + limit - 1
        query = query.range(start, end).order("created_at", desc=True)
        
        res = query.execute()
        
        # Security: Only owner or admin of the store should see this.
        # We assume RLS or logic handles this, but for now we trust `storeId` matches token scope (TODO: Verify)
        
        return {
            "items": res.data or [],
            "total": res.count or 0
        }
    except Exception as e:
        print(f"Error listing team: {e}")
        # Return empty list gracefully if table missing
        return {"items": [], "total": 0}

@router.post("/")
@router.post("")
async def create_team_member(
    member: TeamMemberCreate = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Invite/Create a new Team Member (Manager).
    """
    try:
        # 0. Resolve Store ID
        store_id = member.store_id
        if not store_id and member.store_slug:
             # Fetch store by slug
             s_res = supabase_admin.table("stores").select("id").eq("slug", member.store_slug).single().execute()
             if s_res.data:
                 store_id = s_res.data["id"]
        
        if not store_id:
             raise HTTPException(status_code=400, detail="Store ID or Slug is required to add a team member.")

        # 1. Create User in Supabase Auth
        try:
            auth_res = supabase_admin.auth.admin.create_user({
                "email": member.email,
                "password": member.password,
                "email_confirm": True,
                "user_metadata": {
                    "first_name": member.first_name,
                    "last_name": member.last_name,
                    "phone": member.phone,
                    "role": member.role  # e.g., 'manager', 'editor'
                }
            })
            user_id = auth_res.user.id
            is_new_user = True
        except Exception as auth_err:
            # If user exists, we try to fetch their ID to link them
            # This handles "Invite existing user" scenario
            if "already registered" in str(auth_err) or "user_already_exists" in str(auth_err):
                 # We need to find the user ID. 
                 # Admin API to list users by email is safer.
                 # For now, failing if user exists to simplify MVP - or ask them to invite by email.
                 # Let's try to get user by ID if we can (hard without listing), so we error for now.
                 raise HTTPException(status_code=400, detail="User with this email already exists. Please use 'Invite Existing' feature (coming soon).")
            raise auth_err

        # 2. Insert into store_managers (The link table)
        manager_entry = {
            "id": str(uuid.uuid4()),
            "store_id": store_id,
            "user_id": user_id,
            "role": member.role,
            "first_name": member.first_name,
            "last_name": member.last_name,
            "email": member.email, # denormalized for easy display
            "phone": member.phone,
            # Sensitive / KYB info
            "aadhar_no": member.aadhar_no,
            "pan_no": member.pan_no,
            "address": member.address,
            "pin_code": member.pin_code,
            "status": member.status,
            "created_at": datetime.utcnow().isoformat()
        }
        
        res = supabase_admin.table("store_managers").insert(manager_entry).execute()
        
        return {"success": True, "data": res.data[0]}

    except Exception as e:
        print(f"Error creating team member: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{id}")
async def update_team_member(
    id: str,
    updates: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        # We only update the store_managers table record
        # If password changed, update auth too
        if "password" in updates and updates["password"]:
             pass # TODO: call auth.admin.update_user_password(user_id, pwd)
        
        # Clean updates
        valid_fields = ["first_name", "last_name", "role", "phone", "aadhar_no", "pan_no", "address", "pin_code", "status"]
        db_updates = {k: v for k, v in updates.items() if k in valid_fields and v is not None}
        db_updates["updated_at"] = datetime.utcnow().isoformat()
        
        if not db_updates:
             return {"success": True, "message": "No changes detected"}

        res = supabase_admin.table("store_managers").update(db_updates).eq("id", id).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}")
async def remove_team_member(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove access for a manager. 
    Does NOT delete the user account (they might manage other stores).
    Only deletes the link in `store_managers`.
    """
    try:
        res = supabase_admin.table("store_managers").delete().eq("id", id).execute()
        return {"success": True, "message": "Team member removed"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
