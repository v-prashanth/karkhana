-- ============================================
-- 00017_external_integrations.sql
-- External API layer for website integrations
-- ============================================

-- API Keys
-- Raw key is NEVER stored — only SHA-256 hash
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL
    REFERENCES organizations(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Website Integration',
  scopes TEXT[] DEFAULT ARRAY[
    'leads:write',
    'leads:read',
    'products:read'
  ],
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons for plan activation
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 100,
  free_months INTEGER NOT NULL DEFAULT 3,
  plan TEXT NOT NULL DEFAULT 'starter',
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_for TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- External leads from website integrations
CREATE TABLE IF NOT EXISTS external_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL
    REFERENCES organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'website',
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  product_interest TEXT,
  property_type TEXT,
  bathrooms TEXT,
  preferred_date TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new',
      'contacted',
      'site_visit_scheduled',
      'quotation_sent',
      'installation_done',
      'completed',
      'closed'
    )),
  external_ref TEXT UNIQUE,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSO tokens for seamless redirect
-- Single use, expires in 60 seconds
CREATE TABLE IF NOT EXISTS sso_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL
    REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warranty register
CREATE TABLE IF NOT EXISTS warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL
    REFERENCES organizations(id) ON DELETE CASCADE,
  lead_ref TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  product_name TEXT NOT NULL,
  brand TEXT DEFAULT 'Stiebel Eltron',
  model TEXT,
  serial_number TEXT,
  installation_date DATE NOT NULL,
  warranty_months INTEGER NOT NULL DEFAULT 12,
  warranty_expires DATE,
  amc_due_date DATE,
  amc_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN (
      'active',
      'expired',
      'amc_due',
      'amc_completed'
    )),
  technician_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE api_keys 
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_leads 
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranties 
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_tokens 
  ENABLE ROW LEVEL SECURITY;

-- coupons has NO RLS — global admin table

-- Policies
CREATE POLICY "api_keys_org_isolation" 
  ON api_keys
  USING (org_id = public.get_current_org_id());

CREATE POLICY "external_leads_org_isolation"
  ON external_leads
  USING (org_id = public.get_current_org_id());

CREATE POLICY "warranties_org_isolation"
  ON warranties
  USING (org_id = public.get_current_org_id());

CREATE POLICY "sso_tokens_org_isolation"
  ON sso_tokens
  USING (org_id = public.get_current_org_id());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_org
  ON api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_external_leads_org
  ON external_leads(org_id);
CREATE INDEX IF NOT EXISTS idx_external_leads_ref
  ON external_leads(external_ref);
CREATE INDEX IF NOT EXISTS idx_external_leads_status
  ON external_leads(status);
CREATE INDEX IF NOT EXISTS idx_warranties_org
  ON warranties(org_id);
CREATE INDEX IF NOT EXISTS idx_warranties_expires
  ON warranties(warranty_expires);
CREATE INDEX IF NOT EXISTS idx_sso_tokens_token
  ON sso_tokens(token);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER external_leads_updated_at
  BEFORE UPDATE ON external_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER warranties_updated_at
  BEFORE UPDATE ON warranties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed first coupon for Aqua Elite
INSERT INTO coupons (
  code, discount_percent, free_months,
  plan, max_uses, created_for, expires_at
) VALUES (
  'AQUAELITE2025', 100, 3, 'starter', 1,
  'aqua-elite', '2025-12-31 23:59:59+00'
) ON CONFLICT (code) DO NOTHING;

-- Dynamic calculation trigger for warranty_expires
CREATE OR REPLACE FUNCTION set_warranty_expires()
RETURNS TRIGGER AS $$
BEGIN
  NEW.warranty_expires := NEW.installation_date + (NEW.warranty_months || ' months')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER warranties_set_expiry
  BEFORE INSERT OR UPDATE ON warranties
  FOR EACH ROW EXECUTE FUNCTION set_warranty_expires();

