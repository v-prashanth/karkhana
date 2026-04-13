-- Karkhana Database Schema & RLS Setup

-- ENUMS
CREATE TYPE user_role AS ENUM ('owner', 'operator', 'viewer');
CREATE TYPE order_type AS ENUM ('verbal', 'written');
CREATE TYPE inward_status AS ENUM ('received', 'in_progress', 'partial_return', 'complete');
CREATE TYPE job_status AS ENUM ('pending', 'in_progress', 'complete', 'delivered');
CREATE TYPE outward_status AS ENUM ('draft', 'sent', 'received');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');

-- 1. ORGANIZATIONS
CREATE TABLE public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text,
  gstin text,
  dc_prefix text,
  dc_counter integer DEFAULT 1 NOT NULL,
  bill_prefix text,
  bill_counter integer DEFAULT 1 NOT NULL,
  financial_year_start date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USERS
CREATE TABLE public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  role user_role DEFAULT 'operator' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Helper Function: To get current user's organization_id securely
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid();
$$;

-- 3. CLIENTS
CREATE TABLE public.clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid DEFAULT public.get_current_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  company text NOT NULL,
  phone text,
  email text,
  address text,
  gstin text,
  payment_terms_days integer DEFAULT 30,
  contact_person text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. INWARD DC
CREATE TABLE public.inward_dc (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid DEFAULT public.get_current_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  client_dc_number text,
  client_po_number text,
  order_type order_type DEFAULT 'verbal' NOT NULL,
  verbal_contact_name text,
  date_received date DEFAULT CURRENT_DATE NOT NULL,
  material_description text NOT NULL,
  quantity_received numeric NOT NULL,
  quantity_returned numeric DEFAULT 0 NOT NULL,
  unit text NOT NULL,
  sketch_photo_url text,
  status inward_status DEFAULT 'received' NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. JOBS
CREATE TABLE public.jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid DEFAULT public.get_current_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  inward_dc_id uuid REFERENCES public.inward_dc(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  drawing_reference text,
  drawing_photo_url text,
  quantity_total numeric NOT NULL,
  quantity_complete numeric DEFAULT 0 NOT NULL,
  quantity_rejected numeric DEFAULT 0 NOT NULL,
  material text NOT NULL,
  status job_status DEFAULT 'pending' NOT NULL,
  due_date date,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. OUTWARD DC
CREATE TABLE public.outward_dc (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid DEFAULT public.get_current_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  dc_number text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  inward_dc_id uuid REFERENCES public.inward_dc(id),
  job_id uuid REFERENCES public.jobs(id),
  date date DEFAULT CURRENT_DATE NOT NULL,
  particulars text NOT NULL,
  quantity numeric NOT NULL,
  sketch_photo_url text,
  status outward_status DEFAULT 'draft' NOT NULL,
  pdf_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. INVOICES
CREATE TABLE public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid DEFAULT public.get_current_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  bill_number text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id),
  outward_dc_id uuid REFERENCES public.outward_dc(id),
  client_po_reference text,
  date date DEFAULT CURRENT_DATE NOT NULL,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0 NOT NULL,
  gst_applicable boolean DEFAULT false NOT NULL,
  gst_rate numeric DEFAULT 18.0 NOT NULL,
  gst_amount numeric DEFAULT 0 NOT NULL,
  total numeric DEFAULT 0 NOT NULL,
  status invoice_status DEFAULT 'draft' NOT NULL,
  payment_received_date date,
  payment_method text,
  notes text,
  pdf_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PAYMENTS
CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid DEFAULT public.get_current_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  method text NOT NULL,
  reference_number text,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. EXPENSES
CREATE TABLE public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid DEFAULT public.get_current_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  receipt_photo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inward_dc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outward_dc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- Users can read their own organization
CREATE POLICY "Read organization" ON public.organizations FOR SELECT 
  USING (id = public.get_current_org_id());

-- Users can read users in their organization
CREATE POLICY "Read org users" ON public.users FOR SELECT 
  USING (organization_id = public.get_current_org_id());

-- All other tables: All operations available if organization_id matches
CREATE POLICY "Multi-tenant ALL on clients" ON public.clients FOR ALL 
  USING (organization_id = public.get_current_org_id());
CREATE POLICY "Multi-tenant ALL on inward_dc" ON public.inward_dc FOR ALL 
  USING (organization_id = public.get_current_org_id());
CREATE POLICY "Multi-tenant ALL on jobs" ON public.jobs FOR ALL 
  USING (organization_id = public.get_current_org_id());
CREATE POLICY "Multi-tenant ALL on outward_dc" ON public.outward_dc FOR ALL 
  USING (organization_id = public.get_current_org_id());
CREATE POLICY "Multi-tenant ALL on invoices" ON public.invoices FOR ALL 
  USING (organization_id = public.get_current_org_id());
CREATE POLICY "Multi-tenant ALL on payments" ON public.payments FOR ALL 
  USING (organization_id = public.get_current_org_id());
CREATE POLICY "Multi-tenant ALL on expenses" ON public.expenses FOR ALL 
  USING (organization_id = public.get_current_org_id());

-- To allow signups for new organizations, we need to bypass RLS or use trigger
-- Since new organizations create themselves, organizations insert policy is public during signup:
CREATE POLICY "Insert organization" ON public.organizations FOR INSERT WITH CHECK (true);
-- Users insert policy for initial owner signup
CREATE POLICY "Insert user" ON public.users FOR INSERT WITH CHECK (true);
