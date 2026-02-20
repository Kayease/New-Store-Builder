
import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.v1.endpoints.platform_themes import process_theme_build, UPLOAD_DIR

async def main():
    slug = "nexus-mall"
    zip_path = UPLOAD_DIR / f"{slug}.zip"
    extract_dir = UPLOAD_DIR / slug
    
    print(f"🚀 Starting re-build for {slug}...")
    try:
        await process_theme_build(slug, zip_path, extract_dir)
        print(f"✅ Finished {slug}")
    except Exception as e:
        print(f"❌ Failed {slug}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
