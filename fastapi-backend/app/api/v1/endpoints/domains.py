"""
Domains API - Merchant Store Domain Management
Allows merchants to connect, verify, and manage custom domains for their stores.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.core.supabase_client import supabase_admin
from app.core.auth_utils import verify_token
from typing import Optional, List
from pydantic import BaseModel
import uuid
import secrets
import re

router = APIRouter()


# ============================================
# Pydantic Models
# ============================================

class DomainConnect(BaseModel):
    """Request model for connecting a new domain"""
    domain: str
    storeId: str


class DomainSetPrimary(BaseModel):
    """Request model for setting primary domain"""
    domain: str
    storeId: str


class DomainVerify(BaseModel):
    """Request model for verifying domain DNS"""
    domain: str
    storeId: str


class DomainTransfer(BaseModel):
    """Request model for domain transfer"""
    domain: str
    authCode: str
    storeId: str


# ============================================
# Helper Functions
# ============================================

def validate_domain_format(domain: str) -> bool:
    """Validate domain format"""
    # Basic domain validation regex
    pattern = r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'
    return bool(re.match(pattern, domain.lower()))


def generate_verification_token() -> str:
    """Generate a unique verification token for DNS TXT record"""
    return f"storecraft-verify={secrets.token_hex(16)}"


def get_dns_instructions(domain: str, verification_token: str) -> dict:
    """Generate DNS configuration instructions for a domain"""
    return {
        "txt": {
            "name": "@",
            "type": "TXT",
            "value": verification_token,
            "description": "Add this TXT record to verify domain ownership"
        },
        "cname": {
            "name": "www",
            "type": "CNAME",
            "value": "stores.storecraft.com",
            "description": "Point www subdomain to our servers"
        },
        "aRecords": [
            {
                "type": "A",
                "value": "76.76.21.21",  # Example IP - replace with actual server IP
                "description": "Point root domain to our server"
            }
        ],
        "instructions": [
            "1. Log in to your domain registrar (GoDaddy, Namecheap, etc.)",
            "2. Go to DNS settings for your domain",
            "3. Add the TXT record for verification",
            "4. Add the CNAME or A record as shown above",
            "5. Wait for DNS propagation (can take up to 48 hours)",
            "6. Click 'Verify' to confirm your domain setup"
        ]
    }


# ============================================
# API Endpoints
# ============================================

@router.get("/domains")
async def list_domains(storeId: str, current_user: dict = Depends(verify_token)):
    """
    List all domains connected to a store
    
    Returns both custom domains and the system-generated subdomain.
    """
    try:
        user_id = current_user.get("sub")
        
        # Verify store ownership
        store_resp = supabase_admin.table("stores").select("id, slug, owner_id").eq("id", storeId).single().execute()
        
        if not store_resp.data:
            raise HTTPException(status_code=404, detail="Store not found")
            
        store = store_resp.data
        if store.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this store")
        
        # Fetch domains from store_domains table
        domains_resp = supabase_admin.table("store_domains").select("*").eq("store_id", storeId).order("created_at", desc=False).execute()
        
        domains_list = []
        primary_domain = None
        
        for d in (domains_resp.data or []):
            domain_obj = {
                "id": d.get("id"),
                "domain": d.get("domain"),
                "type": d.get("type", "custom"),
                "status": d.get("status", "pending").capitalize(),
                "isPrimary": d.get("is_primary", False),
                "sslStatus": d.get("ssl_status", "pending"),
                "verificationToken": d.get("verification_token"),
                "createdAt": d.get("created_at"),
                "verifiedAt": d.get("dns_verified_at")
            }
            domains_list.append(domain_obj)
            
            if d.get("is_primary"):
                primary_domain = d.get("domain")
        
        # Generate system domain
        store_slug = store.get("slug", "")
        system_domain = f"{store_slug}.storecraft.com" if store_slug else None
        
        return {
            "success": True,
            "data": {
                "domains": domains_list,
                "primaryDomain": primary_domain,
                "systemDomain": system_domain,
                "total": len(domains_list)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error listing domains: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/domains/connect")
async def connect_domain(payload: DomainConnect, current_user: dict = Depends(verify_token)):
    """
    Connect a new custom domain to the store
    
    Returns DNS configuration instructions for the merchant to set up.
    """
    try:
        user_id = current_user.get("sub")
        domain = payload.domain.lower().strip()
        store_id = payload.storeId
        
        # Validate domain format
        if not validate_domain_format(domain):
            raise HTTPException(status_code=400, detail="Invalid domain format")
        
        # Verify store ownership
        store_resp = supabase_admin.table("stores").select("id, owner_id").eq("id", store_id).single().execute()
        
        if not store_resp.data:
            raise HTTPException(status_code=404, detail="Store not found")
            
        if store_resp.data.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this store")
        
        # Check if domain already exists for any store
        existing_resp = supabase_admin.table("store_domains").select("id, store_id").eq("domain", domain).execute()
        
        if existing_resp.data:
            existing_store_id = existing_resp.data[0].get("store_id")
            if existing_store_id == store_id:
                raise HTTPException(status_code=400, detail="Domain already connected to this store")
            else:
                raise HTTPException(status_code=400, detail="Domain is already connected to another store")
        
        # Generate verification token
        verification_token = generate_verification_token()
        
        # Create domain record
        new_domain = {
            "id": str(uuid.uuid4()),
            "store_id": store_id,
            "domain": domain,
            "type": "custom",
            "status": "pending",
            "is_primary": False,
            "ssl_status": "pending",
            "verification_token": verification_token
        }
        
        insert_resp = supabase_admin.table("store_domains").insert(new_domain).execute()
        
        if not insert_resp.data:
            raise HTTPException(status_code=400, detail="Failed to add domain")
        
        created_domain = insert_resp.data[0]
        dns_instructions = get_dns_instructions(domain, verification_token)
        
        return {
            "success": True,
            "message": "Domain added successfully. Please configure DNS records to verify ownership.",
            "data": {
                "id": created_domain.get("id"),
                "domain": domain,
                "status": "Pending",
                "dns": dns_instructions
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error connecting domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/domains/verify")
async def verify_domain(payload: DomainVerify, current_user: dict = Depends(verify_token)):
    """
    Verify domain DNS configuration
    
    In production, this would actually check DNS records.
    For development, we simulate verification.
    """
    try:
        user_id = current_user.get("sub")
        domain = payload.domain.lower().strip()
        store_id = payload.storeId
        
        # Verify store ownership
        store_resp = supabase_admin.table("stores").select("id, owner_id").eq("id", store_id).single().execute()
        
        if not store_resp.data:
            raise HTTPException(status_code=404, detail="Store not found")
            
        if store_resp.data.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this store")
        
        # Get domain record
        domain_resp = supabase_admin.table("store_domains").select("*").eq("store_id", store_id).eq("domain", domain).single().execute()
        
        if not domain_resp.data:
            raise HTTPException(status_code=404, detail="Domain not found for this store")
        
        domain_record = domain_resp.data
        
        # In production: Actually verify DNS records using DNS lookup
        # For development: Auto-verify
        # TODO: Implement actual DNS verification using dnspython or similar
        
        # Simulate DNS verification (always passes in dev)
        dns_verified = True
        
        if dns_verified:
            # Update domain status
            from datetime import datetime
            
            update_resp = supabase_admin.table("store_domains").update({
                "status": "connected",
                "ssl_status": "active",
                "dns_verified_at": datetime.utcnow().isoformat()
            }).eq("id", domain_record.get("id")).execute()
            
            return {
                "success": True,
                "message": "Domain verified successfully!",
                "data": {
                    "domain": domain,
                    "verified": True,
                    "status": "Connected",
                    "sslStatus": "active",
                    "checks": {
                        "txtRecord": True,
                        "cnameRecord": True,
                        "sslProvisioned": True
                    }
                }
            }
        else:
            return {
                "success": False,
                "message": "DNS verification failed. Please check your DNS settings.",
                "data": {
                    "domain": domain,
                    "verified": False,
                    "checks": {
                        "txtRecord": False,
                        "cnameRecord": False,
                        "sslProvisioned": False
                    }
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/domains/primary")
async def set_primary_domain(payload: DomainSetPrimary, current_user: dict = Depends(verify_token)):
    """
    Set a domain as the primary domain for the store
    
    Only verified (connected) domains can be set as primary.
    """
    try:
        user_id = current_user.get("sub")
        domain = payload.domain.lower().strip()
        store_id = payload.storeId
        
        # Verify store ownership
        store_resp = supabase_admin.table("stores").select("id, owner_id").eq("id", store_id).single().execute()
        
        if not store_resp.data:
            raise HTTPException(status_code=404, detail="Store not found")
            
        if store_resp.data.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this store")
        
        # Get domain record
        domain_resp = supabase_admin.table("store_domains").select("*").eq("store_id", store_id).eq("domain", domain).single().execute()
        
        if not domain_resp.data:
            raise HTTPException(status_code=404, detail="Domain not found for this store")
        
        domain_record = domain_resp.data
        
        # Check if domain is verified
        if domain_record.get("status") != "connected":
            raise HTTPException(status_code=400, detail="Only verified domains can be set as primary")
        
        # Remove primary from all other domains for this store
        supabase_admin.table("store_domains").update({
            "is_primary": False
        }).eq("store_id", store_id).execute()
        
        # Set this domain as primary
        update_resp = supabase_admin.table("store_domains").update({
            "is_primary": True
        }).eq("id", domain_record.get("id")).execute()
        
        if not update_resp.data:
            raise HTTPException(status_code=400, detail="Failed to set primary domain")
        
        return {
            "success": True,
            "message": f"Primary domain set to {domain}",
            "data": {
                "domain": domain,
                "isPrimary": True
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error setting primary domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/domains/{domain_id}")
async def get_domain_details(domain_id: str, storeId: str, current_user: dict = Depends(verify_token)):
    """
    Get details for a specific domain including DNS configuration
    """
    try:
        user_id = current_user.get("sub")
        
        # Get domain record
        domain_resp = supabase_admin.table("store_domains").select("*, stores(owner_id)").eq("id", domain_id).single().execute()
        
        if not domain_resp.data:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        domain_record = domain_resp.data
        store_data = domain_record.get("stores", {})
        
        # Verify ownership
        if store_data.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this domain")
        
        # Generate DNS instructions
        dns_instructions = get_dns_instructions(
            domain_record.get("domain"),
            domain_record.get("verification_token", "")
        )
        
        return {
            "success": True,
            "data": {
                "id": domain_record.get("id"),
                "domain": domain_record.get("domain"),
                "type": domain_record.get("type"),
                "status": domain_record.get("status", "pending").capitalize(),
                "isPrimary": domain_record.get("is_primary", False),
                "sslStatus": domain_record.get("ssl_status"),
                "verificationToken": domain_record.get("verification_token"),
                "createdAt": domain_record.get("created_at"),
                "verifiedAt": domain_record.get("dns_verified_at"),
                "dns": dns_instructions
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting domain details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/domains/{domain_id}")
async def delete_domain(domain_id: str, storeId: str, current_user: dict = Depends(verify_token)):
    """
    Remove a custom domain from the store
    """
    try:
        user_id = current_user.get("sub")
        
        # Get domain record with store info
        domain_resp = supabase_admin.table("store_domains").select("*, stores(owner_id)").eq("id", domain_id).single().execute()
        
        if not domain_resp.data:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        domain_record = domain_resp.data
        store_data = domain_record.get("stores", {})
        
        # Verify ownership
        if store_data.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this domain")
        
        # Check if it's a system domain (can't delete)
        if domain_record.get("type") == "system":
            raise HTTPException(status_code=400, detail="Cannot delete system domain")
        
        # Delete the domain
        del_resp = supabase_admin.table("store_domains").delete().eq("id", domain_id).execute()
        
        return {
            "success": True,
            "message": "Domain removed successfully",
            "data": {
                "domain": domain_record.get("domain"),
                "deleted": True
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting domain: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/domains/transfer")
async def initiate_domain_transfer(payload: DomainTransfer, current_user: dict = Depends(verify_token)):
    """
    Initiate domain transfer from another registrar
    
    Note: This is a placeholder. Actual domain transfer requires
    integration with a domain registrar API (like Namecheap, GoDaddy, etc.)
    """
    try:
        user_id = current_user.get("sub")
        domain = payload.domain.lower().strip()
        auth_code = payload.authCode
        store_id = payload.storeId
        
        # Validate domain format
        if not validate_domain_format(domain):
            raise HTTPException(status_code=400, detail="Invalid domain format")
        
        if not auth_code or len(auth_code) < 4:
            raise HTTPException(status_code=400, detail="Invalid authorization code")
        
        # Verify store ownership
        store_resp = supabase_admin.table("stores").select("id, owner_id").eq("id", store_id).single().execute()
        
        if not store_resp.data:
            raise HTTPException(status_code=404, detail="Store not found")
            
        if store_resp.data.get("owner_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this store")
        
        # In production: This would integrate with a domain registrar API
        # For now, we return a placeholder response
        
        return {
            "success": True,
            "message": "Domain transfer initiated. This process can take 5-7 days.",
            "data": {
                "domain": domain,
                "status": "transfer_pending",
                "estimatedCompletion": "5-7 business days",
                "note": "You will receive email updates about the transfer status."
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error initiating domain transfer: {e}")
        raise HTTPException(status_code=500, detail=str(e))
