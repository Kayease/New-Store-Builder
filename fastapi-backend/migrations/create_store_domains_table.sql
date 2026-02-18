-- ============================================
-- Store Domains Table Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- Create the store_domains table
CREATE TABLE IF NOT EXISTS store_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  type VARCHAR(20) DEFAULT 'custom' CHECK (type IN ('custom', 'system')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'connected', 'failed')),
  is_primary BOOLEAN DEFAULT false,
  ssl_status VARCHAR(20) DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  verification_token VARCHAR(255),
  dns_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique domain per store
  UNIQUE(store_id, domain),
  -- Ensure domain is globally unique (one domain can only belong to one store)
  UNIQUE(domain)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_domains_store_id ON store_domains(store_id);
CREATE INDEX IF NOT EXISTS idx_store_domains_domain ON store_domains(domain);
CREATE INDEX IF NOT EXISTS idx_store_domains_status ON store_domains(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_store_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_store_domains_updated_at ON store_domains;
CREATE TRIGGER trigger_update_store_domains_updated_at
  BEFORE UPDATE ON store_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_store_domains_updated_at();

-- Disable RLS for admin access (or configure as needed)
ALTER TABLE store_domains ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access to store_domains"
  ON store_domains
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy: Store owners can view their domains
CREATE POLICY "Store owners can view their domains"
  ON store_domains
  FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Policy: Store owners can insert domains for their stores
CREATE POLICY "Store owners can insert domains"
  ON store_domains
  FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Policy: Store owners can update their domains
CREATE POLICY "Store owners can update their domains"
  ON store_domains
  FOR UPDATE
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Policy: Store owners can delete their domains
CREATE POLICY "Store owners can delete their domains"
  ON store_domains
  FOR DELETE
  USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON store_domains TO authenticated;
GRANT ALL ON store_domains TO service_role;

-- ============================================
-- Sample data (optional - for testing)
-- ============================================
-- UNCOMMENT AND MODIFY to add test data
/*
INSERT INTO store_domains (store_id, domain, type, status, is_primary, ssl_status, verification_token)
VALUES 
  ('YOUR_STORE_UUID_HERE', 'example.com', 'custom', 'connected', true, 'active', 'storecraft-verify=abc123');
*/

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the table was created correctly:
-- SELECT * FROM store_domains;
