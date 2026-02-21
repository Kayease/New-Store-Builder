from pathlib import Path
import re

def manual_deep_patch(root_path: Path, theme_slug: str):
    for file_path in root_path.rglob("*.tsx"):
        if file_path.name == "kx-identity.tsx": continue
        
        content = file_path.read_text(encoding='utf-8', errors='ignore')
        original_content = content
        needs_update = False

        if '<Link' in content or '</Link>' in content:
            needs_update = True
            content = re.sub(r'<Link\b', '<a', content)
            content = content.replace('</Link>', '</a>')
            print(f"✅ Converted <Link> to <a> in {file_path}")

        if 'href="/' in content:
            needs_update = True
            base_path_val = f"/uploads/stores/{theme_slug}/out"
            content = re.sub(r'href="/((?!api/|http|https|_next|favicon|uploads)[^"]+?)/?"', f'href="{base_path_val}/\\1/"', content)
            content = content.replace('href="/"', f'href="{base_path_val}/"')
            print(f"🔗 Patched absolute links in {file_path}")

        if needs_update and original_content != content:
            file_path.write_text(content, encoding='utf-8')
            print(f"💾 Saved {file_path}")

print("Running pure link patcher...")
manual_deep_patch(Path('D:/CHIRANKSHI/Store-Builder/uploads/stores/my-crust'), 'my-crust')
print("Done pure link patcher.")
