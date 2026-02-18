from pathlib import Path
import os
import re
import shutil

# Mocking the constants and templates from platform_themes.py
class PathMock:
    def __init__(self, path):
        self.p = Path(path)
    def __div__(self, other):
        return PathMock(self.p / other)
    # add other methods as needed or just use Path directly if environment allows

LOGIN_TEMPLATE = "LOGIN"
SIGNUP_TEMPLATE = "SIGNUP"

def inject_theme_logic(extract_dir: Path, theme_slug: str):
    """Universal Helper to inject Login/Signup logic into any Next.js theme."""
    # 1. Inject API Client
    lib_dir = extract_dir / "lib"
    lib_dir.mkdir(exist_ok=True)
    
    api_content = """
export const API_URL = 'http://127.0.0.1:8000/api/v1';
export async function getLiveStore(slug: string) {
    const res = await fetch(`${API_URL}/s/live/${slug}`);
    return await res.json();
}
"""
    (lib_dir / "api.ts").write_text(api_content.strip(), encoding='utf-8')

    app_dir = extract_dir / "app"
    app_dir.mkdir(exist_ok=True)

    # 3. Universal Identity Provider
    identity_code = """
"use client";
import { useEffect } from 'react';
export default function KXIdentity() {
    return null;
}
"""
    (app_dir / "kx-identity.tsx").write_text(identity_code.strip(), encoding='utf-8')

    # 4. Deep Scouter
    def deep_patch_theme(root_path: Path):
        print(f"DEBUG: Scanning {root_path}")
        for file_path in root_path.rglob("*.tsx"):
            if file_path.name == "kx-identity.tsx": continue
            print(f"DEBUG: Found {file_path}")
            
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            needs_update = False

            if 'products =' in content:
                print(f"DEBUG: Patching products in {file_path.name}")
                needs_update = True
                if 'useState' not in content:
                    content = content.replace("export default function", "import { useState, useEffect } from 'react';\nexport default function")
                
                injection = "\\n  const [products, setProducts] = useState([]);\\n"
                comp_match = re.search(r'export( default)? function\s+\w+\s*\(.*?\)\s*\{', content)
                if comp_match:
                    content = content[:comp_match.end()] + injection + content[comp_match.end():]
                    content = re.sub(r'(const|let|var)\s+products\s*=\s*\[[\s\S]*?\][;,]?', '', content)

            if needs_update:
                file_path.write_text(content, encoding='utf-8')
                print(f"DEBUG: File {file_path.name} UPDATED")

    deep_patch_theme(extract_dir)

if __name__ == "__main__":
    target = Path(r"d:\CHIRANKSHI\Store-Builder\uploads\themes\pro-equip")
    inject_theme_logic(target, "pro-equip")
