from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class StoreBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    status: Optional[str] = "active"
    setup_completed: Optional[bool] = False

class StoreCreate(StoreBase):
    owner_id: str

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    status: Optional[str] = None
    setup_completed: Optional[bool] = None
    custom_domain: Optional[str] = None

class StoreResponse(BaseModel):
    id: str
    _id: str
    name: str
    slug: str
    owner_id: Optional[str] = None
    owner_email: Optional[str] = None
    owner_name: Optional[str] = None
    logo_url: Optional[str] = None
    status: str
    setup_completed: bool
    human_id: Optional[str] = None
    custom_domain: Optional[str] = None
    plan_id: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    manager_email: Optional[str] = None
    manager_phone: Optional[str] = None
    created_at: Optional[str] = None

class StoreListResponse(BaseModel):
    items: List[StoreResponse]
    total: int
