
import os
import sys
import psycopg2
from urllib.parse import urlparse

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def run_migrations():
    print("Running migrations...")
    print(f"Connecting to DB: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'LOCAL'}")

    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()

        # Add brand
        print("Adding column: brand")
        cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(255);")

        # Add metadata
        print("Adding column: metadata")
        cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;")

        # Add attributes
        print("Adding column: attributes")
        cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '[]'::jsonb;")

        # Add tax
        print("Adding column: tax")
        cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS tax JSONB DEFAULT '{}'::jsonb;")

        # Add dimensions
        print("Adding column: dimensions")
        cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}'::jsonb;")

        # Add inventory_status (if stockStatus maps to this)
        print("Adding column: inventory_status")
        cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_status VARCHAR(50) DEFAULT 'in_stock';")
        
        # Add category (string) for flexibility if category_id is missing? 
        # No, let's just stick to category_id or store category name in metadata if needed. 
        # But frontend sends 'category' string. If we want to store it as a string without creating a category record:
        print("Adding column: category_name")
        cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS category_name VARCHAR(255);")


        print("Migrations applied successfully!")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migrations()
