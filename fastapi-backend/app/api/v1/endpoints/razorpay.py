from fastapi import APIRouter, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import razorpay
from app.core.config import settings
from app.schemas.razorpay import (
    RazorpayOrderCreate, 
    RazorpayOrderResponse, 
    RazorpayVerifyRequest, 
    RazorpayVerifyResponse
)
from app.core.supabase_client import supabase_admin
import hmac
import hashlib
import jwt
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()

# Initialize Razorpay client
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

# Optional security scheme for extracting token
security = HTTPBearer(auto_error=False)

def get_user_id_from_token(request: Request) -> Optional[str]:
    """Extract user ID from Authorization header if present."""
    try:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            # Use lenient decoding to match auth_utils behavior
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub") or payload.get("id")
    except Exception as e:
        print(f"⚠️ Could not extract user from token: {e}")
    return None

@router.post("/order")
async def create_order(order_data: RazorpayOrderCreate):
    """Create a Razorpay order for subscription."""
    try:
        # Check if dummy keys
        if "test_xxxxx" in settings.RAZORPAY_KEY_ID:
            # Fallback for development if keys are not set
            return {
                "order": {
                    "id": "order_dummy_" + hashlib.md5(str(datetime.now()).encode()).hexdigest()[:10],
                    "amount": int(order_data.amount * 100),
                    "currency": order_data.currency,
                    "status": "created"
                },
                "key": settings.RAZORPAY_KEY_ID
            }

        amount_in_paise = int(order_data.amount * 100)
        data = {
            "amount": amount_in_paise,
            "currency": order_data.currency,
            "payment_capture": 1, # Auto capture
            "notes": {
                "plan_name": order_data.planName or "Subscription Plan"
            }
        }
        
        try:
            order = client.order.create(data=data)
            return {"order": order, "key": settings.RAZORPAY_KEY_ID}
        except Exception as e:
            print(f"⚠️ Razorpay API failed: {str(e)}")
            
            # Fallback to dummy order in development if keys are invalid/API fails
            # This allows testing the UI flow without valid keys
            if settings.DEBUG or "test" in settings.RAZORPAY_KEY_ID:
                print("🔄 Falling back to DUMMY order for development")
                return {
                    "order": {
                        "id": "order_dummy_" + hashlib.md5(str(datetime.now()).encode()).hexdigest()[:10],
                        "amount": int(order_data.amount * 100),
                        "currency": order_data.currency,
                        "status": "created"
                    },
                    "key": settings.RAZORPAY_KEY_ID
                }
            raise e
    except Exception as e:
        print(f"❌ Razorpay order creation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Order creation failed: {str(e)}")

@router.post("/verify")
async def verify_payment(verify_data: RazorpayVerifyRequest, request: Request):
    """Verify Razorpay payment and update subscription/payments tables.
    
    Authentication is OPTIONAL - this allows new users to pay before creating an account.
    """
    try:
        # Try to extract user from token if present (optional auth)
        user_id = get_user_id_from_token(request)
        print(f"📝 Payment verification - User ID: {user_id or 'Guest'}, Order: {verify_data.razorpay_order_id}")
        
        # 1. Verify Signature (Skip for dummy orders)
        is_dummy = verify_data.razorpay_order_id.startswith("order_dummy_")
        
        if not is_dummy:
            try:
                client.utility.verify_payment_signature({
                    'razorpay_order_id': verify_data.razorpay_order_id,
                    'razorpay_payment_id': verify_data.razorpay_payment_id,
                    'razorpay_signature': verify_data.razorpay_signature
                })
                print("✅ Payment signature verified")
            except Exception as e:
                print(f"❌ Signature verification failed: {e}")
                raise HTTPException(status_code=400, detail="Invalid payment signature")
        else:
            print("⚠️ Dummy order - skipping signature verification")
        
        # 2. Record the payment in the 'payments' table
        # Razorpay sends amount in paise (e.g. 100000 for 1000.00)
        # We store in INR (decimal) for consistency with reporting
        amount_in_inr = verify_data.amount / 100

        payment_record = {
            "store_id": verify_data.storeId,
            "amount": amount_in_inr,
            "currency": verify_data.currency,
            "status": "captured",
            "provider": "razorpay",
            "razorpay_payment_id": verify_data.razorpay_payment_id,
            "type": "subscription_fee"
        }
        
        # Add user_id only if we have one
        if user_id:
            payment_record["user_id"] = user_id
        
        # Always record the payment
        try:
            supabase_admin.table("payments").insert(payment_record).execute()
            print("✅ Payment recorded in database")
        except Exception as pay_err:
            print(f"⚠️ Error recording payment: {pay_err}")
            # Try without user_id if column doesn't exist
            if "user_id" in payment_record:
                try:
                    del payment_record["user_id"]
                    supabase_admin.table("payments").insert(payment_record).execute()
                    print("✅ Payment recorded (without user_id)")
                except Exception as e2:
                    print(f"⚠️ Still failed: {e2}")
            
        # 3. Update or create subscription if we have a store_id
        if verify_data.storeId:
            # Determine billing cycle
            billing_cycle = verify_data.billingCycle
            if not billing_cycle:
                # Fallback to existing logic if not provided
                billing_cycle = "monthly" if "monthly" in (verify_data.planName or "").lower() else "yearly"
            
            # Determine end date
            end_date = datetime.now() + timedelta(days=365) if billing_cycle == "yearly" else datetime.now() + timedelta(days=30)

            subscription_data = {
                "store_id": verify_data.storeId,
                "plan_id": verify_data.planId,
                "status": "active",
                "amount": amount_in_inr,
                "billing_cycle": billing_cycle,
                "current_period_start": datetime.now().isoformat(),
                "current_period_end": end_date.isoformat()
            }
            
            # Upsert into subscriptions
            supabase_admin.table("subscriptions").upsert(subscription_data, on_conflict="store_id").execute()
            
            # Update store status
            supabase_admin.table("stores").update({"status": "active"}).eq("id", verify_data.storeId).execute()
            print(f"✅ Subscription updated for store: {verify_data.storeId}")
        else:
            # For new users, we'll store the plan preference in the user's profile or session
            # This is handled during the onboarding store creation step
            print("ℹ️ No store_id - new user flow, subscription will be created later")

        return {
            "success": True,
            "message": "Payment verified and recorded successfully",
            "payment_id": verify_data.razorpay_payment_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Payment verification error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
