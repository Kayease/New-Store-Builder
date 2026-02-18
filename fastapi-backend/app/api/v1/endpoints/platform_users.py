from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.core.supabase_client import supabase, supabase_admin
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse

from datetime import datetime

router = APIRouter()

def map_user_response(user) -> dict:
    # Handle different supabase client response structures
    # user object might be an object or dict depending on client version
    
    # Extract data safely
    # Extract data safely
    def get_v(obj, key, default=None):
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    uid = get_v(user, "id")
    email = get_v(user, "email")
    created_at = get_v(user, "created_at")
    
    # Fix for validation error: if created_at is a datetime object, convert to string
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat()
    
    metadata = get_v(user, "user_metadata", {}) or {}
    
    return {
        "id": uid,
        "_id": uid, 
        "email": email,
        "first_name": metadata.get("first_name", ""),
        "last_name": metadata.get("last_name", ""),
        "firstName": metadata.get("first_name", ""), 
        "lastName": metadata.get("last_name", ""),   
        "role": metadata.get("role", "merchant"),
        "status": metadata.get("status", "active"),
        "store_name": metadata.get("store_name", ""),
        "storeName": metadata.get("store_name", ""),
        "created_at": created_at,
        "createdAt": created_at 
    }

@router.get("/users", response_model=UserListResponse)
async def list_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):
    """
    List all users (merchants/admins).
    """
    try:
        # Use ADMIN client for listing users
        response = supabase_admin.auth.admin.list_users(page=1, per_page=1000) 
        users = response
        
        # Map to our schema
        mapped_users = [map_user_response(u) for u in users]
        
        # In-memory Filter (Search)
        if search:
            search = search.lower()
            mapped_users = [
                u for u in mapped_users 
                if search in u["email"].lower() 
                or search in u["first_name"].lower() 
                or search in u["last_name"].lower()
            ]
            
        # Pagination
        total = len(mapped_users)
        paginated_users = mapped_users[skip : skip + limit]
        
        return {"items": paginated_users, "total": total}
        
    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str):
    try:
        user = supabase_admin.auth.admin.get_user_by_id(user_id)
        if not user:
             raise HTTPException(status_code=404, detail="User not found")
        return map_user_response(user.user)
    except Exception as e:
         raise HTTPException(status_code=404, detail="User not found")

@router.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    try:
        # Create user in Supabase Auth
        metadata = {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "status": user.status,
            "phone": user.phone,
            "address": user.address
        }
        
        # Add store info if present
        if user.storeName:
            metadata["store_name"] = user.storeName
        if user.storeSlug:
            metadata["store_slug"] = user.storeSlug
            
        attributes = {
            "email": user.email,
            "password": user.password,
            "email_confirm": True,
            "user_metadata": metadata
        }
        
        # Use ADMIN client for creation
        response = supabase_admin.auth.admin.create_user(attributes)
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        new_user_id = response.user.id
        
        # Also insert into profiles table (in case trigger didn't fire)
        try:
            profile_data = {
                "id": new_user_id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "role": user.role,
                "status": user.status,
                "store_name": user.storeName,
                "store_slug": user.storeSlug,
                "address": user.address
            }
            supabase_admin.table("profiles").upsert(profile_data).execute()
        except Exception as profile_error:
            print(f"⚠️ Profile insert warning (may already exist): {profile_error}")
        
        # Create store record if storeName/storeSlug provided
        if user.storeName and user.storeSlug:
            try:
                store_data = {
                    "name": user.storeName,
                    "slug": user.storeSlug,
                    "owner_id": new_user_id,
                    "status": "active",
                    "setup_completed": False
                }
                supabase_admin.table("stores").insert(store_data).execute()
                print(f"✅ Store '{user.storeName}' created for user {new_user_id}")
            except Exception as store_error:
                print(f"⚠️ Store creation warning: {store_error}")
            
        return map_user_response(response.user)
        
    except Exception as e:
        print(f"❌ User creation error details: {str(e)}") 
        raise HTTPException(status_code=400, detail=f"Supabase Error: {str(e)}")

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user: UserUpdate):
    try:
        attributes = {}
        
        # Root attributes
        if user.email:
            attributes["email"] = user.email
        if user.password:
            attributes["password"] = user.password
            
        # Metadata attributes
        user_metadata = {}
        if user.first_name:
            user_metadata["first_name"] = user.first_name
        if user.last_name:
            user_metadata["last_name"] = user.last_name
        if user.role:
            user_metadata["role"] = user.role
        if user.status:
            user_metadata["status"] = user.status
            
        if user_metadata:
            attributes["user_metadata"] = user_metadata
            
        # Use ADMIN client for updates
        response = supabase_admin.auth.admin.update_user_by_id(user_id, attributes)
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Failed to update user")
            
        return map_user_response(response.user)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    try:
        # Use ADMIN client for deletion
        response = supabase_admin.auth.admin.delete_user(user_id)
        return {"success": True, "message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
