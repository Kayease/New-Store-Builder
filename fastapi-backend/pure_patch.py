from pathlib import Path
import re

def patch_theme_links(root_path: Path, theme_slug: str):
    for file_path in root_path.rglob("*.tsx"):
        if file_path.name == "kx-identity.tsx": continue
        
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        original_content = content

        base_path_val = f"/uploads/themes/{theme_slug}/out"

        # Explicit
        if 'href="/' in content:
            content = re.sub(r'href="/((?!api/|http|https|_next|favicon|uploads)[^"]+?)"', f'href="{base_path_val}/\\1"', content)
            content = content.replace('href="/"', f'href="{base_path_val}/"')
            
        # Literal
        if 'href={`/' in content:
            content = re.sub(r'href=\{`\/((?!api/|http|https|_next|favicon|uploads)[^`]+?)`\}', f'href={{`{base_path_val}/\\1`}}', content)
            content = content.replace('href={`/`}', f'href={{`{base_path_val}/`}}')

        if original_content != content:
            file_path.write_text(content, encoding='utf-8')
            print(f"🔗 Repatched links in {file_path}")

patch_theme_links(Path('D:/CHIRANKSHI/Store-Builder/uploads/themes/nexus-mall/app'), 'nexus-mall')
print("Done re-patching.")
