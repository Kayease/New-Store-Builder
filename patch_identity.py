
import os
import re
from pathlib import Path

def patch_store(store_path, store_name, base_path, store_slug):
    print(f"🕵️ AI Quality Audit Starting for: {store_name}")
    api_base = "http://localhost:8000/api/v1"
    
    for file_path in store_path.rglob("*.tsx"):
        if "node_modules" in str(file_path): continue
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        orig = content
        
        # 1. Identity Swap
        content = content.replace("Nexus Mall", store_name)
        
        # 2. Fix Links (Disable Router for Static Export)
        content = re.sub(r'<Link\b', '<a', content)
        content = content.replace('</Link>', '</a>')
        content = re.sub(r'href="/((?!api/|http|https|_next|favicon|uploads)[^"]*)"', f'href="{base_path}/\\1"', content)

        # 3. Product Injection (ONLY for non-auth pages)
        is_auth = any(x in str(file_path).lower() for x in ["login", "signup"])
        if not is_auth and "fetch(" in content and ("product" in content or "store" in content):
            new_fetch = f"""
                const res = await fetch('{api_base}/s/live/{store_slug}')
                const json = await res.json()
                if (json.data && json.data.products) {{
                    setProducts(json.data.products.map(p => ({{
                        ...p,
                        image: p.images?.[0] || 'https://via.placeholder.com/400?text=' + p.name
                    }})))
                }}
            """
            content = re.sub(r'const\s+res\s*=\s*await\s+fetch\(.*?\).*?if\s*\(res\.ok\)\s*\{.*?\}', new_fetch.strip(), content, flags=re.DOTALL)

        if content != orig:
            file_path.write_text(content, encoding='utf-8')

if __name__ == "__main__":
    store_dir = Path(r"d:\CHIRANKSHI\Store-Builder\uploads\stores\my-crust")
    patch_store(store_dir, "My Crust", "/uploads/stores/my-crust/out", "my-crust")
    print("✅ Smarter AI Auditor Complete.")
