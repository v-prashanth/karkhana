-- KARKHANA — Universal Business OS & Network Schema (v3)
-- Built for: Precision Machining, Fabrication, Trading, and All Indian MSMEs
-- Features: Multi-tenant, RLS Secured, Viral Growth Engine, Token-based Sharing

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ORGANIZATIONS (The primary tenant)
create table if not exists organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_name text not null,
  phone text unique not null,
  email text unique,
  address text,
  gstin text,
  logo_url text,
  business_type text default 'manufacturing', -- e.g., manufacturing, trading, repair
  public_slug text unique, -- For karkhana.app/[slug]
  is_verified boolean default false,
  
  -- Document Numbering (Persisted state)
  invoice_prefix text default 'INV',
  invoice_counter integer default 1,
  dc_prefix text default 'DC',
  dc_counter integer default 1,
  quotation_prefix text default 'QT',
  quotation_counter integer default 1,
  order_label text default 'Job', -- Custom label (Job/Order/Ticket/Project)
  
  -- Financial Info
  financial_year text default '2026-27',
  
  -- Monetization & Subscription
  plan text default 'free', -- free, pro, business
  plan_expires_at timestamp with time zone,
  
  -- Performance Metrics (Denormalized for speed)
  total_revenue decimal(15,2) default 0,
  total_outstanding decimal(15,2) default 0,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. USERS (Profiles linked to Auth)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  role text default 'owner', -- owner, admin, staff, manager
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. CONTACTS (CRM: Clients & Suppliers)
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  name text not null,
  type text not null default 'client', -- client, supplier, both
  contact_person text,
  phone text,
  email text,
  address text,
  gstin text,
  total_outstanding decimal(15,2) default 0, -- + for client owes us, - for we owe supplier
  tags text[],
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. ORDERS (The Work Engine)
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  order_number text not null,
  description text not null,
  quantity decimal(12,2) default 1,
  unit text default 'Nos',
  material text,
  priority text default 'normal', -- normal, urgent
  status text default 'pending', -- pending, in_progress, complete, cancelled
  due_date date,
  reference_no text, -- Client PO No.
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 6. DOCUMENTS (Log for DCs/Bills/Quotes)
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  type text not null, -- invoice, dc, quotation
  document_number text not null,
  date date default current_date,
  total_amount decimal(15,2) default 0,
  status text default 'active', -- draft, sent, paid, cancelled
  pdf_url text,
  meta_data jsonb default '{}'::jsonb, -- Store line items, taxes, etc.
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7. PAYMENTS (Money In)
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  document_id uuid references documents(id) on delete set null, -- Optional: link to specific invoice
  amount decimal(15,2) not null,
  method text default 'cash', -- cash, upi, bank_transfer, cheque
  date date default current_date,
  reference_no text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 8. EXPENSES (Money Out)
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  description text not null,
  amount decimal(15,2) not null,
  category text default 'raw_material', -- tools, rent, salary, electricity, transport, maintenance, misc
  method text default 'cash',
  date date default current_date,
  reference_no text,
  receipt_url text, -- Photo of bill
  notes text,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- PLATFORM & NETWORK EXTENSIONS (New in v3)
-- ==========================================

-- 9. BUSINESS CONNECTIONS (The Network Graph)
create table if not exists business_connections (
  id uuid primary key default uuid_generate_v4(),
  requester_org_id uuid references organizations(id) on delete cascade,
  receiver_org_id uuid references organizations(id) on delete cascade,
  status text default 'pending', -- pending, connected, blocked
  initiated_at timestamp with time zone default now(),
  connected_at timestamp with time zone,
  
  constraint unique_connection unique(requester_org_id, receiver_org_id)
);

-- 10. SHARED DOCUMENT TOKENS (Growth Engine)
create table if not exists shared_documents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  document_type text not null, -- invoice, dc, quotation
  document_id uuid not null,
  token text unique not null, -- Secure 32-char token
  expires_at timestamp with time zone,
  view_count integer default 0,
  last_viewed_at timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 11. RECEIVED DOCUMENTS (Buyer Inbox)
create table if not exists received_documents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade, -- The buyer
  from_organization_id uuid references organizations(id) on delete cascade,
  document_type text not null,
  shared_document_id uuid references shared_documents(id) on delete set null,
  status text default 'new', -- new, viewed, paid
  notes text,
  received_at timestamp with time zone default now()
);

-- 12. PURCHASE ORDERS RECEIVED
create table if not exists purchase_orders_received (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade, -- The supplier receiving PO
  from_organization_id uuid references organizations(id) on delete cascade,
  po_number text not null,
  description text,
  line_items jsonb default '[]'::jsonb,
  total decimal(15,2) default 0,
  status text default 'new', -- new, acknowledged, in_progress, complete
  due_date date,
  received_at timestamp with time zone default now()
);

-- 13. AUDIT LOG (Security & Compliance)
create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- login, doc_view, doc_create, connection_request
  resource_type text,
  resource_id text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table orders enable row level security;
alter table documents enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table business_connections enable row level security;
alter table shared_documents enable row level security;
alter table received_documents enable row level security;
alter table purchase_orders_received enable row level security;
alter table audit_log enable row level security;

-- Common policy: Users can only see data belonging to their organization
-- ORGANIZATION policies
create policy "Anyone can view public business profiles"
  on organizations for select
  using ( public_slug is not null );

create policy "Authenticated users can discover other businesses"
  on organizations for select
  to authenticated
  using ( true );

create policy "Users can manage their own organization"
  on organizations for all
  using ( id in (select organization_id from profiles where profiles.id = auth.uid()) );

-- PROFILE policy
create policy "Users can view their own profile"
  on profiles for select
  using ( id = auth.uid() );

-- CONTACTS policy
create policy "Users can manage their organization contacts"
  on contacts for all
  using ( organization_id in (select organization_id from profiles where profiles.id = auth.uid()) );

-- ORDERS policy
create policy "Users can manage their organization orders"
  on orders for all
  using ( organization_id in (select organization_id from profiles where profiles.id = auth.uid()) );

-- DOCUMENTS policy
create policy "Users can manage their organization documents"
  on documents for all
  using ( organization_id in (select organization_id from profiles where profiles.id = auth.uid()) );

-- PAYMENTS policy
create policy "Users can manage their organization payments"
  on payments for all
  using ( organization_id in (select organization_id from profiles where profiles.id = auth.uid()) );

-- EXPENSES policy
create policy "Users can manage their organization expenses"
  on expenses for all
  using ( organization_id in (select organization_id from profiles where profiles.id = auth.uid()) );

-- SHARED DOCUMENTS policy: Public can view tokens, owners can manage
create policy "Anyone can view document by valid token"
  on shared_documents for select
  using ( is_active = true and (expires_at is null or expires_at > now()) );

create policy "Owners can manage their shared tokens"
  on shared_documents for all
  using ( organization_id in (select organization_id from profiles where profiles.id = auth.uid()) );

-- CONNECTIONS policy: Participating organizations can view
create policy "Orgs can view their connections"
  on business_connections for select
  using ( 
    requester_org_id in (select organization_id from profiles where profiles.id = auth.uid()) or
    receiver_org_id in (select organization_id from profiles where profiles.id = auth.uid())
  );

-- INBOX policy: Receiver organization can view
create policy "Orgs can view received documents"
  on received_documents for all
  using ( organization_id in (select organization_id from profiles where profiles.id = auth.uid()) );

-- AUDIT LOG policy: Organization admins can view
create policy "Admins can view organization audit logs"
  on audit_log for select
  using ( organization_id in (select organization_id from profiles where profiles.id = auth.uid()) );

-- ==========================================
-- FUNCTIONS & TRIGGERS (Auto-Update counters/outstanding)
-- ==========================================

-- Function to update updated_at timestamp
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to main tables
create trigger set_updated_at_orgs before update on organizations for each row execute procedure handle_updated_at();
create trigger set_updated_at_contacts before update on contacts for each row execute procedure handle_updated_at();
create trigger set_updated_at_orders before update on orders for each row execute procedure handle_updated_at();
create trigger set_updated_at_documents before update on documents for each row execute procedure handle_updated_at();
