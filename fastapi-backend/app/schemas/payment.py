from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PaymentBase(BaseModel):
    store_id: str
    amount: float
    currency: str = "INR"
    status: str
    provider: str = "razorpay"
    razorpay_payment_id: Optional[str] = None
    type: str  # 'subscription_fee', 'transaction_commission', 'order_payment'

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: str
    _id: str
    store_name: Optional[str] = None
    owner_name: Optional[str] = None
    created_at: str
    createdAt: str
    paymentId: Optional[str] = None

class PaymentListResponse(BaseModel):
    items: List[PaymentResponse]
    total: int
    total_amount: float = 0
