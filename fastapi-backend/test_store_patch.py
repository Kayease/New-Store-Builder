from pathlib import Path
import re

def patch_store_links(root_path: Path, store_slug: str, theme_slug: str):
    base_path_val = f"/uploads/stores/{store_slug}/out"
    
    for file_path in root_path.rglob("*.tsx"):
        if file_path.name == "kx-identity.tsx": continue
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        original_content = content
        
        # 1. Aggressively kill Next.js Router for Store deployments too
        if '<Link' in content or '</Link>' in content:
            content = re.sub(r'<Link\b', '<a', content)
            content = content.replace('</Link>', '</a>')
        
        # 2. Redirect themes base to stores base
        old_base = f"/uploads/themes/{theme_slug}/out"
        if old_base in content:
            content = content.replace(old_base, base_path_val)
        
        # Double-check relative unpatched links
        if 'href="/' in content or 'href={`/' in content:
            content = re.sub(r'href="/((?!api/|http|https|_next|favicon|uploads)[^"]+?)"', f'href="{base_path_val}/\\1"', content)
            content = content.replace('href="/"', f'href="{base_path_val}/"')
            content = re.sub(r'href=\{`\/((?!api/|http|https|_next|favicon|uploads)[^`]+?)`\}', f'href={{`{base_path_val}/\\1`}}', content)
            content = content.replace('href={`/`}', f'href={{`{base_path_val}/`}}')
        
        # 3. Product Fetching Hardcoding
        if file_path.name == "page.tsx":
            content = content.replace(f"/api/v1/s/live/${{storeId}}", f"/api/v1/s/live/{store_slug}")
            content = content.replace(f"api/v1/s/live/${{storeId}}", f"api/v1/s/live/{store_slug}")
            
            if "products" in file_path.parts or "product" in file_path.parts:
                content = re.sub(r"const\s+storeId\s*=\s*(?:searchParams|params)\.get\(['\"]store['\"]\)", f"const storeId = '{store_slug}'", content)
        
        if original_content != content:
            file_path.write_text(content, encoding='utf-8')
            print(f"🔗 Patched {file_path}")

# Run for my-crust
store_dir = Path('D:/CHIRANKSHI/Store-Builder/uploads/stores/my-crust')
patch_store_links(store_dir, 'my-crust', 'nexus-mall')
print("Done manual store patching.")
