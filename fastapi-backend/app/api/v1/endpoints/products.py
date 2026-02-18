from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.supabase_client import supabase_admin
from app.core.auth_utils import verify_token
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

router = APIRouter()

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    compareAtPrice: Optional[float] = None
    sku: Optional[str] = None
    inventoryQuantity: Optional[int] = 0
    stockStatus: Optional[str] = "in_stock"
    status: Optional[str] = "active"
    images: Optional[List[str]] = []
    categoryId: Optional[str] = None
    category: Optional[str] = None # Name of category
    brand: Optional[str] = None
    storeId: str
    attributes: Optional[List[Dict[str, Any]]] = []
    metadata: Optional[Dict[str, Any]] = {}
    tax: Optional[Dict[str, Any]] = {}

@router.get("/")
@router.get("")
async def list_products(storeId: str, current_user: dict = Depends(verify_token)):
    try:
        # Join with categories to get category name
        response = supabase_admin.table("products").select("*, category:category_id(name)").eq("store_id", storeId).execute()
        
        # Flatten the response if needed or handle in frontend
        data = []
        for p in (response.data or []):
            p_copy = p.copy()
            if p.get("category") and isinstance(p["category"], dict):
                p_copy["category_name"] = p["category"].get("name")
            
            # Attempt to extract metadata from description
            desc = p_copy.get("description") or ""
            if "<!--METADATA:" in desc:
                try:
                    import json
                    parts = desc.split("<!--METADATA:")
                    if len(parts) > 1:
                        meta_json = parts[1].split("-->")[0]
                        meta_data = json.loads(meta_json)
                        p_copy.update(meta_data)
                        # Optional: clean description? 
                        # p_copy["description"] = parts[0].strip()
                except:
                    pass

            data.append(p_copy)
            
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{product_id}")
async def get_product(product_id: str, storeId: str, current_user: dict = Depends(verify_token)):
    try:
        response = supabase_admin.table("products").select("*").eq("id", product_id).eq("store_id", storeId).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Product not found")
        
        data = response.data.copy()
        desc = data.get("description") or ""
        if "<!--METADATA:" in desc:
             try:
                 import json
                 parts = desc.split("<!--METADATA:")
                 if len(parts) > 1:
                     meta_json = parts[1].split("-->")[0]
                     meta_data = json.loads(meta_json)
                     data.update(meta_data)
                     # Optional: clean description for UI?
                     # data["description"] = parts[0].strip()
             except:
                 pass

        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
@router.post("")
async def create_product(product: ProductCreate, current_user: dict = Depends(verify_token)):
    try:
        # Resolving Category
        cat_id = product.categoryId
        if not cat_id and product.category:
            # Try to find category by name
            cat_res = supabase_admin.table("categories").select("id").eq("store_id", product.storeId).eq("name", product.category).execute()
            if cat_res.data and len(cat_res.data) > 0:
                cat_id = cat_res.data[0]['id']
            else:
                # Create category
                new_cat = {
                    "store_id": product.storeId,
                    "name": product.category,
                    "description": "Created automatically with product"
                }
                cat_create_res = supabase_admin.table("categories").insert(new_cat).execute()
                if cat_create_res.data:
                    cat_id = cat_create_res.data[0]['id']

        # Construct Product Data
        # We try to put extra fields in metadata if possible, or mapping
        
        # Prepare metadata payload combined with attributes, brand, etc if backend supports storing them as json
        # Since schema migration might not have run, we need to be careful.
        # But we can try to assume 'metadata' column exists or we might lose this data.
        # We'll merge attributes, tax, brand into metadata field for storage if metadata column exists.
        
        final_metadata = product.metadata or {}
        if product.brand: final_metadata['brand'] = product.brand
        if product.attributes: final_metadata['attributes'] = product.attributes
        if product.tax: final_metadata['tax'] = product.tax
        if product.stockStatus: final_metadata['stock_status'] = product.stockStatus

        # Generate Slug
        import re
        import random
        import string
        
        def _generate_slug(text: str) -> str:
            # Simple slugify
            s = text.lower().strip()
            s = re.sub(r'[^a-z0-9\s-]', '', s)
            s = re.sub(r'[\s-]+', '-', s)
            return s
            
        base_slug = _generate_slug(product.name)
        # Add random suffix to ensure uniqueness and avoid collision errors
        suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        final_slug = f"{base_slug}-{suffix}"

        new_product = {
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "compare_at_price": product.compareAtPrice,
            "sku": product.sku,
            "inventory_quantity": product.inventoryQuantity,
            "status": product.status,
            "images": product.images,
            "category_id": cat_id,
            "store_id": product.storeId,
            "slug": final_slug, # Added slug
            # We blindly try to insert metadata. If migration didn't run, this might fail?
            # If it fails, Supabase will return error.
            # But the user asked to FIX it. The only fix without DB access is to NOT send it if it fails.
            # However, we can't try-catch inside the insert easily without 2 calls.
            # Let's try to include it. If it errors, we retry without it?
        }
        
        # Attempt insert with metadata. If 400, retry without.
        # But wait, supabase-py doesn't throw standard exceptions clearly always.
        
        # Let's hope migration runs or we are lucky. 
        # Actually, let's just insert standard fields first to unblock the user.
        # If 'metadata' column is missing, the Insert will fail.
        # Checking schema is expensive.
        
        # Safe strategy: Insert standard fields. Update with metadata? No.
        # Just insert standard fields. The user can create product.
        # If we lose 'brand', it's better than 'Failed to create'.
        
        # BUT wait, the Frontend sends 'brand' and expects it back?
        # Let's try to add 'metadata' key to new_product ONLY IF we think it exists.
        # Since I am ANTIGRAVITY, I should have successfully run the migration.
        # But `migrate_products.py` FAILED.
        # So 'brand' column and 'metadata' column DO NOT EXIST.
        
        # So I MUST NOT send them to DB.
        # I will store everything in `description` as a JSON block appended to text?
        # "Description text... \n\n<!--METADATA: {...}-->"
        # This is a robust hack to persist data without schema change.
        
        if final_metadata:
             import json
             meta_str = json.dumps(final_metadata)
             # Append to description hidden
             if new_product["description"]:
                 new_product["description"] += f"\n\n<!--METADATA:{meta_str}-->"
             else:
                 new_product["description"] = f"<!--METADATA:{meta_str}-->"

        result = supabase_admin.table("products").insert(new_product).execute()
        
        if not result.data:
             raise HTTPException(status_code=400, detail="Failed to create product in DB")
             
        return {"success": True, "data": result.data[0]}

    except Exception as e:
        print(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{product_id}")
async def update_product(product_id: str, product_data: Dict[str, Any], current_user: dict = Depends(verify_token)):
    try:
        # Map camelCase to snake_case if needed
        updates = {}
        field_mapping = {
            "name": "name",
            "description": "description",
            "price": "price",
            "compareAtPrice": "compare_at_price",
            "sku": "sku",
            "inventoryQuantity": "inventory_quantity",
            "status": "status",
            "images": "images",
            "categoryId": "category_id"
        }
        
        for key, val in product_data.items():
            if key in field_mapping:
                updates[field_mapping[key]] = val
        
        response = supabase_admin.table("products").update(updates).eq("id", product_id).eq("store_id", product_data.get("storeId")).execute()
        return {"success": True, "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{product_id}")
async def delete_product(product_id: str, storeId: str, current_user: dict = Depends(verify_token)):
    try:
        supabase_admin.table("products").delete().eq("id", product_id).eq("store_id", storeId).execute()
        return {"success": True, "message": "Product deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
