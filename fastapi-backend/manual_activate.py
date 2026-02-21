from pathlib import Path
import re
import shutil
import zipfile
import subprocess
import os

PROJECT_ROOT = Path('D:/CHIRANKSHI/Store-Builder')
UPLOAD_DIR = PROJECT_ROOT / "uploads" / "themes"
STORES_DIR = PROJECT_ROOT / "uploads" / "stores"

def run_command(cmd, cwd):
    print(f"Executing: {cmd} in {cwd}")
    # Use powershell for commands on Windows
    result = subprocess.run(["powershell", "-Command", cmd], cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
    return result

def smart_flatten(extract_dir):
    # Simplified version for the test
    pass

def ai_repair_package_json(extract_dir):
    # Simplified version
    pass

def inject_theme_logic(extract_dir, theme_slug):
    # Simplified version
    pass

def manual_store_activation(store_slug: str, theme_slug: str):
    theme_dir = UPLOAD_DIR / theme_slug
    zip_path = UPLOAD_DIR / f"{theme_slug}.zip"
    extract_dir = STORES_DIR / store_slug
    
    print(f"Starting activation for {store_slug} using {theme_slug}...")
    
    if extract_dir.exists():
        print(f"Cleaning existing directory {extract_dir}...")
        for item in extract_dir.iterdir():
            if item.name not in ["node_modules", "package-lock.json"]: # Keep node_modules to save time
                if item.is_dir(): shutil.rmtree(item)
                else: item.unlink()
    else:
        extract_dir.mkdir(parents=True, exist_ok=True)
        
    if zip_path.exists():
        print(f"Extracting {zip_path}...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
    elif theme_dir.exists():
        print(f"Copying from {theme_dir}...")
        for item in theme_dir.iterdir():
            if item.name not in ["node_modules", ".next"]:
                dest = extract_dir / item.name
                if item.is_dir(): shutil.copytree(item, dest)
                else: shutil.copy2(item, dest)

    # Patching
    base_path_val = f"/uploads/stores/{store_slug}/out"
    
    # 1. next.config.js
    clean_config = f"""
/** @type {{import('next').NextConfig}} */
const nextConfig = {{
  output: 'export',
  distDir: 'out',
  assetPrefix: '{base_path_val}',
  trailingSlash: true,
  images: {{ unoptimized: true }},
  eslint: {{ ignoreDuringBuilds: true }},
  typescript: {{ ignoreBuildErrors: true }},
}};
module.exports = nextConfig;
"""
    (extract_dir / "next.config.js").write_text(clean_config.strip())
    print("Patched next.config.js")

    # 2. Links and Store ID
    for file_path in extract_dir.rglob("*.tsx"):
        if file_path.name == "kx-identity.tsx": continue
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        original_content = content
        
        # Kill Router
        if '<Link' in content or '</Link>' in content:
            content = re.sub(r'<Link\b', '<a', content)
            content = content.replace('</Link>', '</a>')
        
        # Paths
        if 'href="/' in content or 'href={`/' in content:
            content = re.sub(r'href="/((?!api/|http|https|_next|favicon|uploads)[^"]+?)"', f'href="{base_path_val}/\\1"', content)
            content = content.replace('href="/"', f'href="{base_path_val}/"')
            content = re.sub(r'href=\{`\/((?!api/|http|https|_next|favicon|uploads)[^`]+?)`\}', f'href={{`{base_path_val}/\\1`}}', content)
            content = content.replace('href={`/`}', f'href={{`{base_path_val}/`}}')
        
        # Product Fetching
        if file_path.name == "page.tsx":
            content = content.replace(f"/api/v1/s/live/${{storeId}}", f"/api/v1/s/live/{store_slug}")
            content = content.replace(f"api/v1/s/live/${{storeId}}", f"api/v1/s/live/{store_slug}")
            if "products" in file_path.parts or "product" in file_path.parts:
                content = re.sub(r"const\s+storeId\s*=\s*(?:searchParams|params)\.get\(['\"]store['\"]\)", f"const storeId = '{store_slug}'", content)
        
        if original_content != content:
            file_path.write_text(content, encoding='utf-8')

    print("Patched links and store logic.")

    # 3. Build
    log_file = extract_dir / "build_log.txt"
    print("Building...")
    run_command(f"npm run build > {log_file} 2>&1", extract_dir)
    print(f"Build finished. Check {log_file}")

manual_store_activation('my-crust', 'nexus-mall')
