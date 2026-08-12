-- ============================================================
-- 19. JOB WORK MANAGEMENT & MATERIAL LIABILITY TRACKER
-- ============================================================
-- Supports CGST Act Section 143 compliance (1-year return countdown),
-- Rule 55 Job Work Challan generation, E-Way bill reference,
-- Virtual Godowns ("Stock at Third Party"), and shared Reconciliation.

-- 1. JOB WORK DELIVERY CHALLANS (Rule 55 Format)
CREATE TABLE IF NOT EXISTS public.job_work_challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  
  -- Challan Identification & Role
  challan_number TEXT NOT NULL,
  challan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  role_type TEXT NOT NULL CHECK (role_type IN ('PRINCIPAL_OUTWARD', 'JOB_WORKER_INWARD', 'JOB_WORKER_OUTWARD', 'PRINCIPAL_INWARD')),
  
  -- Principal Details
  principal_name TEXT NOT NULL,
  principal_gstin TEXT,
  principal_address TEXT,
  
  -- Job Worker Details
  job_worker_name TEXT NOT NULL,
  job_worker_gstin TEXT,
  job_worker_address TEXT,
  
  -- Compliance & Transport
  nature_of_processing TEXT,
  eway_bill_number TEXT,
  transport_mode TEXT,
  vehicle_number TEXT,
  
  -- CGST Section 143 Expiry Countdown
  dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '365 days'), -- 1-Year Countdown Timer
  
  -- Document Status & Financials
  total_taxable_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIALLY_RETURNED', 'FULLY_RETURNED', 'EXPIRED_DEEMED_SUPPLY')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. JOB WORK ITEMS & RECONCILIATION LEDGER
CREATE TABLE IF NOT EXISTS public.job_work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challan_id UUID NOT NULL REFERENCES public.job_work_challans(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  hsn_code TEXT,
  uom TEXT NOT NULL DEFAULT 'Nos',
  
  -- Quantity Tracking & Automatic Balance Calculation
  sent_qty NUMERIC(15, 3) NOT NULL DEFAULT 0,
  returned_qty NUMERIC(15, 3) NOT NULL DEFAULT 0,
  scrap_qty NUMERIC(15, 3) NOT NULL DEFAULT 0,
  balance_qty NUMERIC(15, 3) GENERATED ALWAYS AS (sent_qty - returned_qty - scrap_qty) STORED,
  
  -- Valuation
  unit_taxable_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_taxable_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. VIRTUAL STOCK GODOWNS ("Stock at Third Party")
CREATE TABLE IF NOT EXISTS public.virtual_godown_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  vendor_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  hsn_code TEXT,
  current_stock_qty NUMERIC(15, 3) NOT NULL DEFAULT 0,
  uom TEXT NOT NULL DEFAULT 'Nos',
  last_movement_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, vendor_contact_id, item_name)
);

-- 4. MATERIAL LIABILITY AGING ALERTS (CGST Sec 143 Compliance Notification Logs)
CREATE TABLE IF NOT EXISTS public.material_liability_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  challan_id UUID NOT NULL REFERENCES public.job_work_challans(id) ON DELETE CASCADE,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('90_DAYS', '30_DAYS', '7_DAYS', 'EXPIRED')),
  days_remaining INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  whatsapp_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (whatsapp_status IN ('PENDING', 'SENT', 'FAILED', 'DELIVERED'))
);

-- RLS SECURITY POLICIES
ALTER TABLE public.job_work_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_godown_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_liability_alerts ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_work_challans_org ON public.job_work_challans(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_work_challans_expiry ON public.job_work_challans(expiry_date, status);
CREATE INDEX IF NOT EXISTS idx_job_work_items_challan ON public.job_work_items(challan_id);
CREATE INDEX IF NOT EXISTS idx_virtual_godown_org_vendor ON public.virtual_godown_stock(organization_id, vendor_contact_id);

-- Multi-tenant RLS Policies
DO $$ BEGIN
  CREATE POLICY "Multi-tenant ALL on job_work_challans" ON public.job_work_challans FOR ALL
    USING (organization_id = public.get_current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Multi-tenant ALL on job_work_items" ON public.job_work_items FOR ALL
    USING (challan_id IN (SELECT id FROM public.job_work_challans WHERE organization_id = public.get_current_org_id()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Multi-tenant ALL on virtual_godown_stock" ON public.virtual_godown_stock FOR ALL
    USING (organization_id = public.get_current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Multi-tenant ALL on material_liability_alerts" ON public.material_liability_alerts FOR ALL
    USING (organization_id = public.get_current_org_id());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Triggers for auto updated_at
CREATE OR REPLACE TRIGGER set_job_work_challans_updated_at
  BEFORE UPDATE ON public.job_work_challans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_job_work_items_updated_at
  BEFORE UPDATE ON public.job_work_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_job_work_stock_updated_at
  BEFORE UPDATE ON public.virtual_godown_stock
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
