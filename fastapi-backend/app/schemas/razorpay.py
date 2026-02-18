from pydantic import BaseModel
from typing import Optional

class RazorpayOrderCreate(BaseModel):
    amount: float
    currency: str = "INR"
    planName: Optional[str] = None

class RazorpayOrderResponse(BaseModel):
    id: str
    amount: int
    currency: str
    status: str

class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    planId: str
    planName: Optional[str] = None
    amount: float
    currency: str = "INR"
    storeId: Optional[str] = None
    storeSlug: Optional[str] = None
    billingCycle: Optional[str] = None

class RazorpayVerifyResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
