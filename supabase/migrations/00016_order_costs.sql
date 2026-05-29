-- ============================================================
-- 16. ORDER COSTS
-- ============================================================

CREATE TABLE IF NOT EXISTS order_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Cost specifications
  cost_category TEXT NOT NULL DEFAULT 'material', -- 'material' | 'labor' | 'outsourcing' | 'other'
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  
  -- Smart attributes (Optional)
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE order_costs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_order_costs_order ON order_costs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_costs_org ON order_costs(organization_id);

DO $$ BEGIN
  CREATE POLICY "Multi-tenant ALL on order_costs" ON order_costs FOR ALL
    USING (organization_id = public.get_current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger for auto updated_at
CREATE OR REPLACE TRIGGER set_order_costs_updated_at
  BEFORE UPDATE ON order_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
