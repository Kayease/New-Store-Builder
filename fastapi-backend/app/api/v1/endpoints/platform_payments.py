from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.core.supabase_client import supabase_admin
from app.schemas.payment import PaymentResponse, PaymentListResponse

router = APIRouter()

import traceback

def map_payment_response(payment: dict, extra_info: dict) -> dict:
    created_at = payment.get("created_at")
    if created_at:
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()
        else:
            created_at = str(created_at)
    else:
        created_at = datetime.now().isoformat()
    
    pay_id = str(payment.get("id") or payment.get("_id") or "")
    
    return {
        "id": pay_id,
        "_id": pay_id,
        "store_id": str(payment.get("store_id") or ""),
        "store_name": str(extra_info.get("store_name") or "N/A"),
        "store_slug": str(extra_info.get("store_slug") or ""),
        "owner_name": str(extra_info.get("owner_name") or "N/A"),
        "owner_email": str(extra_info.get("owner_email") or ""),
        "amount": float(payment.get("amount") or 0.0),
        "currency": str(payment.get("currency") or "INR"),
        "status": str(payment.get("status") or "pending"),
        "provider": str(payment.get("provider") or "razorpay"),
        "razorpay_payment_id": str(payment.get("razorpay_payment_id")) if payment.get("razorpay_payment_id") else None,
        "paymentId": str(payment.get("razorpay_payment_id") or payment.get("transaction_id") or ""), # For frontend
        "type": str(payment.get("type") or "subscription_fee"),
        "created_at": created_at,
        "createdAt": created_at # For frontend
    }

@router.get("/payments", response_model=PaymentListResponse)
async def list_payments(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    type: Optional[str] = None
):
    """List all platform payments with store and owner details."""
    try:
        # 1. Fetch all payments
        query = supabase_admin.table("payments").select("*")
        if status and status != "all":
            query = query.eq("status", status)
        if type and type != "all":
            query = query.eq("type", type)
            
        response = query.order("created_at", desc=True).execute()
        payments = response.data or []
        
        # 2. Fetch stores and profiles to get names
        stores_res = supabase_admin.table("stores").select("id, name, owner_id").execute()
        stores_map = {str(s["id"]): s for s in (stores_res.data or []) if s.get("id")}
        
        profiles_res = supabase_admin.table("profiles").select("id, first_name, last_name").execute()
        profiles_map = {str(p["id"]): p for p in (profiles_res.data or []) if p.get("id")}
        
        # 3. Map everything together
        mapped_items = []
        total_amount = 0.0
        
        for p in payments:
            try:
                store_id = str(p.get("store_id") or "")
                store = stores_map.get(store_id, {})
                owner_id = str(store.get("owner_id") or "")
                profile = profiles_map.get(owner_id, {})
                
                store_name = str(store.get("name") or "Unknown Store")
                store_slug = str(store.get("slug") or "")
                
                first = profile.get('first_name') or ''
                last = profile.get('last_name') or ''
                owner_name = f"{first} {last}".strip() or profile.get("email") or "Unknown Owner"
                owner_email = str(profile.get("email") or "")
                
                extra_info = {
                    "store_name": store_name,
                    "store_slug": store_slug,
                    "owner_name": owner_name,
                    "owner_email": owner_email
                }
                
                mapped_items.append(map_payment_response(p, extra_info))
                
                # Robust total amount calculation
                if str(p.get("status")).lower() == "captured":
                    amt = p.get("amount")
                    if amt is not None:
                        try:
                            total_amount += float(amt)
                        except (ValueError, TypeError):
                            pass
            except Exception as item_err:
                print(f"⚠️ Error mapping payment item: {item_err}")
                continue
        
        # Pagination
        total = len(mapped_items)
        result = {
            "items": mapped_items[skip : skip + limit],
            "total": total,
            "total_amount": total_amount
        }
        return result
        
    except Exception as e:
        print(f"❌ Error fetching payments: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str):
    """Get single payment details."""
    try:
        res = supabase_admin.table("payments").select("*").eq("id", payment_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        p = res.data
        # Get extra info
        store_res = supabase_admin.table("stores").select("name, owner_id").eq("id", p["store_id"]).single().execute()
        store = store_res.data or {}
        
        profile_res = supabase_admin.table("profiles").select("first_name, last_name").eq("id", store.get("owner_id")).single().execute()
        profile = profile_res.data or {}
        
        extra_info = {
            "store_name": store.get("name"),
            "store_slug": store.get("slug"),
            "owner_name": f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or profile.get("email"),
            "owner_email": profile.get("email")
        }
        
        return map_payment_response(p, extra_info)
    except Exception:
        raise HTTPException(status_code=404, detail="Payment not found")
