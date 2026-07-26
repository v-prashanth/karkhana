-- Migration 00013: Staff & Attendance tables
-- These tables power the /staff and /attendance API routes.

-- Ensure the RLS helper function exists (defined in 00000 but may not be applied)
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid();
$$;

-- 1. STAFF MEMBERS
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text,
  role text,                          -- e.g. 'machinist', 'supervisor', 'helper'
  pay_type text DEFAULT 'daily',      -- 'daily', 'monthly', 'per_piece'
  pay_rate numeric DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  joined_at date DEFAULT CURRENT_DATE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ATTENDANCE LOG
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  status text DEFAULT 'present' NOT NULL,     -- 'present', 'absent', 'half_day', 'leave'
  overtime_hours numeric DEFAULT 0 NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Each staff member can only have one record per day
  UNIQUE(staff_id, date)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_staff_organization ON public.staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON public.staff(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON public.attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_org_date ON public.attendance(organization_id, date);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Multi-tenant ALL on staff" ON public.staff FOR ALL
  USING (organization_id = public.get_current_org_id());
CREATE POLICY "Multi-tenant ALL on attendance" ON public.attendance FOR ALL
  USING (organization_id = public.get_current_org_id());
