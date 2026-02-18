from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SubscriptionPlanBase(BaseModel):
    name: str
    price_monthly: float
    price_yearly: float
    features: List[str] = []
    is_active: bool = True

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None

class SubscriptionPlanResponse(SubscriptionPlanBase):
    id: str
    _id: str  # For frontend compatibility
    priceMonthly: float
    priceYearly: float
    isActive: bool
    created_at: Optional[str] = None
    createdAt: Optional[str] = None

class SubscriptionPlanListResponse(BaseModel):
    items: List[SubscriptionPlanResponse]
    total: int
