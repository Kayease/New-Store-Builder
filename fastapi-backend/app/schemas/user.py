from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = "merchant"
    status: Optional[str] = "active"
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    # Extra fields for store creation logic
    storeName: Optional[str] = None
    storeSlug: Optional[str] = None
    address: Optional[dict] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    storeName: Optional[str] = None # For completeness, though updating store usually happens via store API

class UserInDB(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: str
    _id: str 
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    created_at: Optional[str]
    createdAt: Optional[str]
    
    # Custom validator/constructor might be needed to map 'id' to '_id'
    
class UserListResponse(BaseModel):
    items: List[UserResponse]
    total: int
