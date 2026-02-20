from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class TeamMemberBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    role: str = "manager"  # Default role
    phone: Optional[str] = None
    
    # New KYB details requested
    aadhar_no: Optional[str] = None
    pan_no: Optional[str] = None
    address: Optional[str] = None
    pin_code: Optional[str] = None
    
    status: str = "active"

class TeamMemberCreate(TeamMemberBase):
    password: str
    store_id: Optional[str] = None
    store_slug: Optional[str] = None # Added support for resolving by slug

class TeamMemberUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    aadhar_no: Optional[str] = None
    pan_no: Optional[str] = None
    address: Optional[str] = None
    pin_code: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None  # To allow password resets

class TeamMemberResponse(TeamMemberBase):
    id: str
    user_id: str  # The Supabase Auth ID
    store_id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class TeamListResponse(BaseModel):
    items: List[TeamMemberResponse]
    total: int
