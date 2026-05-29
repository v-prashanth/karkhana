-- ============================================================
-- 15. BUSINESS TARGETS
-- ============================================================

CREATE TABLE IF NOT EXISTS business_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Target definition
  target_type TEXT NOT NULL DEFAULT 'revenue',  -- 'revenue' | 'collections' | 'production'
  period_type TEXT NOT NULL DEFAULT 'annual',    -- 'annual'
  
  -- Amounts
  annual_amount NUMERIC NOT NULL DEFAULT 0,
  monthly_amount NUMERIC GENERATED ALWAYS AS (annual_amount / 12) STORED,
  
  -- Period alignment
  financial_year TEXT NOT NULL DEFAULT '2026-27',
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE business_targets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_targets_organization ON business_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_targets_org_active ON business_targets(organization_id, is_active);

DO $$ BEGIN
  CREATE POLICY "Multi-tenant ALL on business_targets" ON business_targets FOR ALL
    USING (organization_id = public.get_current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER set_business_targets_updated_at
  BEFORE UPDATE ON business_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
