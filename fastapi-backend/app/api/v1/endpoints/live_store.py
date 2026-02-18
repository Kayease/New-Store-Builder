"""
Public Live Store API - Serves store data for the public-facing storefront.
Returns theme details, products, categories, and store info for live rendering.
"""
from fastapi import APIRouter, HTTPException
from app.core.supabase_client import supabase_admin

router = APIRouter()


@router.get("/live/{store_slug}")
async def get_live_store(store_slug: str):
    """
    Get all data needed to render a live store page.
    No authentication required - this is the public storefront.
    
    Returns: store info, active theme, products, categories
    """
    try:
        # 1. Get store by slug
        store_res = supabase_admin.table("stores").select("*").eq("slug", store_slug).limit(1).execute()
        if not store_res.data:
            raise HTTPException(status_code=404, detail="Store not found")
        
        store = store_res.data[0]
        config = store.get("config") or {}
        
        # Check if store is active
        if store.get("status") != "active":
            raise HTTPException(status_code=403, detail="This store is not currently active")
        
        # 2. Get theme details if set
        theme_id = config.get("theme_id")
        theme = None
        if theme_id:
            try:
                theme_res = supabase_admin.table("themes").select("*").eq("id", theme_id).single().execute()
                if theme_res.data:
                    t = theme_res.data
                    theme = {
                        "id": t.get("id"),
                        "name": t.get("name"),
                        "slug": t.get("slug"),
                        "description": t.get("description", ""),
                        "thumbnailUrl": t.get("thumbnail_url", ""),
                        "buildPath": t.get("zip_url", ""),
                    }
            except Exception as e:
                print(f"Warning: Could not fetch theme {theme_id}: {e}")
        
        # 3. Get products for this store
        products = []
        try:
            products_res = supabase_admin.table("products").select("*").eq("store_id", store["id"]).eq("status", "active").execute()
            for p in (products_res.data or []):
                products.append({
                    "id": p.get("id"),
                    "name": p.get("name"),
                    "description": p.get("description", ""),
                    "price": p.get("price", 0),
                    "compareAtPrice": p.get("compare_at_price"),
                    "images": p.get("images", []),
                    "sku": p.get("sku"),
                    "inventoryQuantity": p.get("inventory_quantity", 0),
                    "categoryId": p.get("category_id"),
                })
        except Exception as e:
            print(f"Warning: Could not fetch products: {e}")
        
        # 4. Get categories for this store
        categories = []
        try:
            cats_res = supabase_admin.table("categories").select("*").eq("store_id", store["id"]).execute()
            for c in (cats_res.data or []):
                categories.append({
                    "id": c.get("id"),
                    "name": c.get("name"),
                    "description": c.get("description", ""),
                    "image": c.get("image_url", ""),
                })
        except Exception as e:
            print(f"Warning: Could not fetch categories: {e}")
        
        # 5. Build response
        return {
            "success": True,
            "data": {
                "store": {
                    "id": store.get("id"),
                    "name": store.get("name"),
                    "slug": store.get("slug"),
                    "logoUrl": store.get("logo_url"),
                    "status": store.get("status"),
                    "description": config.get("description", ""),
                    "tagline": config.get("tagline", ""),
                    "email": config.get("email"),
                    "phone": config.get("phone"),
                    "social": config.get("social", {}),
                    "seo": config.get("seo", {}),
                    "favicons": config.get("favicons", {}),
                },
                "theme": theme,
                "products": products,
                "categories": categories,
                "totalProducts": len(products),
                "totalCategories": len(categories),
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching live store: {e}")
        raise HTTPException(status_code=500, detail=str(e))
