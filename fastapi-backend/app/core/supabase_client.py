from supabase import create_client, Client
from app.core.config import settings

# Initialize Supabase Client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Use service_role key for admin tasks if needed (DANGEROUS: use wisely)
# Use service_role key for admin tasks (Required for auth.admin functions)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
