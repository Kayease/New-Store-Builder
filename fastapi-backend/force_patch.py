import sys
from pathlib import Path
sys.path.append('D:/CHIRANKSHI/Store-Builder/fastapi-backend')
from app.api.v1.endpoints.platform_themes import inject_theme_logic

print('Running manual patch...')
theme_dir = Path('D:/CHIRANKSHI/Store-Builder/uploads/themes/nexus-mall')
inject_theme_logic(theme_dir, 'nexus-mall')
print('Patch applied successfully.')
