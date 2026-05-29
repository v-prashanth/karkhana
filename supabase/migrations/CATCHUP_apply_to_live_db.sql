-- ============================================================
-- KARKHANA: One-shot catch-up migration for live Supabase DB
-- Run this ONCE in the Supabase SQL Editor.
-- Safe to run: uses IF NOT EXISTS / IF EXISTS everywhere.
-- ============================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN new.updated_at = now(); RETURN new;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  phone := regexp_replace(phone, '[^0-9]', '', 'g');
  IF length(phone) = 12 AND phone LIKE '91%' THEN phone := substring(phone FROM 3); END IF;
  IF length(phone) = 11 AND phone LIKE '0%' THEN phone := substring(phone FROM 2); END IF;
  RETURN phone;
END; $$;

-- ============================================================
-- 2. ADD MISSING COLUMNS TO EXISTING organizations TABLE
-- ============================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'manufacturing';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS public_slug TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS invoice_counter INTEGER DEFAULT 1;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS quotation_prefix TEXT DEFAULT 'QT';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS quotation_counter INTEGER DEFAULT 1;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS order_label TEXT DEFAULT 'Job';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS financial_year TEXT DEFAULT '2026-27';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(15,2) DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(15,2) DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
-- From 00003
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#ff7a1a';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#171717';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS document_template TEXT DEFAULT 'modern';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT 'Managed with Karkhana | karkhana.app';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS signature_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bank_details TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS upi_id TEXT;
-- From 00012
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS year_established INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS employee_count TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_organizations_public_slug ON organizations(public_slug) WHERE public_slug IS NOT NULL;

-- Allow anyone (including guests/anonymous users) to read organizations that have activated their business card slug
DROP POLICY IF EXISTS "Anyone can view public business profiles" ON public.organizations;
CREATE POLICY "Anyone can view public business profiles" ON public.organizations
  FOR SELECT
  USING ( public_slug IS NOT NULL );

-- ============================================================
-- 3. PROFILES TABLE (00001 uses "profiles", 00000 uses "users")
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'owner',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 4. CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'client',
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  total_outstanding DECIMAL(15,2) DEFAULT 0,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS on_karkhana_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their organization contacts" ON contacts FOR ALL
    USING (organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 1,
  unit TEXT DEFAULT 'Nos',
  material TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  due_date DATE,
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their organization orders" ON orders FOR ALL
    USING (organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 6. DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  pdf_url TEXT,
  meta_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their organization documents" ON documents FOR ALL
    USING (organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 7. INVOICES (ensure amount_due, invoice_number, due_date exist)
-- ============================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_due DECIMAL(15,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- ============================================================
-- 8. DOCUMENT ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS document_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(15,2) DEFAULT 1,
  unit TEXT DEFAULT 'Nos',
  rate DECIMAL(15,2) DEFAULT 0,
  amount DECIMAL(15,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Document items follow parent policy" ON document_items FOR ALL
    USING (document_id IN (SELECT id FROM documents WHERE organization_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 9. NETWORK TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS organization_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  related_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'client_supplier',
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, related_organization_id)
);

CREATE TABLE IF NOT EXISTS relationship_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  invited_name TEXT, invited_phone TEXT, invited_email TEXT,
  relationship_type TEXT NOT NULL DEFAULT 'client_supplier',
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ, created_by UUID, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, resource_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE, title TEXT, description TEXT,
  expires_at TIMESTAMPTZ, is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS share_link_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(), viewer_name TEXT, ip_address TEXT, user_agent TEXT
);

ALTER TABLE organization_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link_views ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_org_relationships_org ON organization_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_relationship_invites_org ON relationship_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_share_links_org ON share_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_link_views_link ON share_link_views(share_link_id);

-- ============================================================
-- 10. EMAIL AUTH CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS email_auth_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL, code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_auth_codes_email ON email_auth_codes(email);
ALTER TABLE email_auth_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, entity_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  performed_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. NETWORK PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS network_purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  supplier_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL, description TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  total DECIMAL(15,2) DEFAULT 0, due_date DATE, notes TEXT,
  status TEXT DEFAULT 'sent',
  converted_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ, completed_at TIMESTAMPTZ
);
ALTER TABLE network_purchase_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. STAFF & ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, phone TEXT, role TEXT,
  pay_type TEXT DEFAULT 'daily',
  pay_rate NUMERIC DEFAULT 0 NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  joined_at DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  status TEXT DEFAULT 'present' NOT NULL,
  overtime_hours NUMERIC DEFAULT 0 NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(staff_id, date)
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_staff_organization ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_org_date ON attendance(organization_id, date);

DO $$ BEGIN
  CREATE POLICY "Multi-tenant ALL on staff" ON staff FOR ALL USING (organization_id = public.get_current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Multi-tenant ALL on attendance" ON attendance FOR ALL USING (organization_id = public.get_current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 14. RPC FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics_v2(p_org_id UUID, p_user_id UUID)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_metrics json; v_user_phone text;
BEGIN
  SELECT phone INTO v_user_phone FROM public.users WHERE id = p_user_id LIMIT 1;
  SELECT json_build_object(
    'activeOrders', (SELECT COUNT(*) FROM orders WHERE organization_id = p_org_id AND status IN ('pending','in_progress')),
    'orderCount', (SELECT COUNT(*) FROM orders WHERE organization_id = p_org_id),
    'invoiceCount', (SELECT COUNT(*) FROM invoices WHERE organization_id = p_org_id),
    'expenseCount', (SELECT COUNT(*) FROM expenses WHERE organization_id = p_org_id),
    'totalOutstanding', (SELECT COALESCE(SUM(amount_due),0) FROM invoices WHERE organization_id = p_org_id),
    'overdueInvoices', (SELECT COUNT(*) FROM invoices WHERE organization_id = p_org_id AND amount_due > 0 AND status = 'overdue'),
    'revenueThisMonth', (SELECT COALESCE(SUM(total),0) FROM invoices WHERE organization_id = p_org_id AND status != 'draft' AND date_trunc('month',date) = date_trunc('month',CURRENT_DATE)),
    'paymentsThisMonth', (SELECT COALESCE(SUM(amount),0) FROM payments WHERE organization_id = p_org_id AND date_trunc('month',date) = date_trunc('month',CURRENT_DATE)),
    'expensesThisMonth', (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE organization_id = p_org_id AND date_trunc('month',date) = date_trunc('month',CURRENT_DATE)),
    'totalPayables', (SELECT COALESCE(SUM(i.amount_due),0) FROM invoices i JOIN contacts c ON i.contact_id = c.id WHERE c.phone = v_user_phone AND i.amount_due > 0)
  ) INTO v_metrics;
  RETURN v_metrics;
END; $$;

-- ============================================================
-- 15. BUSINESS TARGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS business_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL DEFAULT 'revenue',  -- 'revenue' | 'collections' | 'production'
  period_type TEXT NOT NULL DEFAULT 'annual',    -- 'annual'
  annual_amount NUMERIC NOT NULL DEFAULT 0,
  monthly_amount NUMERIC GENERATED ALWAYS AS (annual_amount / 12) STORED,
  financial_year TEXT NOT NULL DEFAULT '2026-27',
  is_active BOOLEAN NOT NULL DEFAULT true,
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

-- ============================================================
-- 16. ORDER COSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  cost_category TEXT NOT NULL DEFAULT 'material', -- 'material' | 'labor' | 'outsourcing' | 'other'
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
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

-- Done!
