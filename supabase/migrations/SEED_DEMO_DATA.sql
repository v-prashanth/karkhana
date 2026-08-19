-- ============================================================
-- KARKHANA DEMO DATA SEED SCRIPT
-- Paste and run this directly in the Supabase SQL Editor.
-- ============================================================

-- Ensure all column variants exist safely regardless of schema version
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 30;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity_unit TEXT DEFAULT 'Nos';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reference_number TEXT;

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_due NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reference_number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(15,2) DEFAULT 0;

DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_contact_epe UUID;
  v_contact_asha UUID;
  v_contact_ajpack UUID;
  v_contact_tooling UUID;
  v_job1_id UUID;
  v_job2_id UUID;
  v_jwc1_id UUID;
  v_jwc2_id UUID;
BEGIN

  -- 1. GET OR CREATE PRIMARY SVEW ORGANIZATION
  SELECT id INTO v_org_id FROM public.organizations WHERE email = 'manufacturing@karkhana.in' LIMIT 1;
  
  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (
      id, name, owner_name, phone, email, gstin, business_type, order_label,
      financial_year, is_verified, total_revenue, total_outstanding
    ) VALUES (
      'a0000000-0000-4000-a000-000000000001',
      'Sri Vishwakarma Engineering Works',
      'Ramesh Sharma',
      '9876543210',
      'manufacturing@karkhana.in',
      '36AAACS1234A1Z1',
      'manufacturing',
      'Job',
      '2026-27',
      TRUE,
      145500,
      45000
    ) RETURNING id INTO v_org_id;
  END IF;

  -- 2. GET CURRENT AUTH USER ID (or fallback)
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'manufacturing@karkhana.in' LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.users (id, organization_id, name, email, phone, role, is_active)
    VALUES (v_user_id, v_org_id, 'Ramesh Sharma', 'manufacturing@karkhana.in', '9876543210', 'owner', TRUE)
    ON CONFLICT (id) DO UPDATE SET organization_id = v_org_id;
  END IF;

  -- 3. SEED CLIENTS & SUPPLIERS
  INSERT INTO public.contacts (id, organization_id, name, type, phone, email, address, payment_terms_days)
  VALUES ('c1000000-0000-4000-a000-000000000001', v_org_id, 'EPE Process Filters & Accumulators Pvt. Ltd.', 'client', '040-23085750', 'purchase@epe-india.com', 'Plot 42, Phase 3, IDA Jeedimetla, Hyderabad', 45)
  ON CONFLICT DO NOTHING RETURNING id INTO v_contact_epe;

  IF v_contact_epe IS NULL THEN
    SELECT id INTO v_contact_epe FROM public.contacts WHERE organization_id = v_org_id AND name LIKE '%EPE%' LIMIT 1;
  END IF;

  INSERT INTO public.contacts (id, organization_id, name, type, phone, email, address, payment_terms_days)
  VALUES ('c2000000-0000-4000-a000-000000000002', v_org_id, 'Asha Lube Solutions Pvt. Ltd.', 'client', '+91 9949073322', 'krishna@ashalube.com', 'Unit 12, Balanagar Industrial Estate, Hyderabad', 30)
  ON CONFLICT DO NOTHING RETURNING id INTO v_contact_asha;

  IF v_contact_asha IS NULL THEN
    SELECT id INTO v_contact_asha FROM public.contacts WHERE organization_id = v_org_id AND name LIKE '%Asha%' LIMIT 1;
  END IF;

  INSERT INTO public.contacts (id, organization_id, name, type, phone, email, address, payment_terms_days)
  VALUES ('c3000000-0000-4000-a000-000000000003', v_org_id, 'AJ Packaging Limited', 'client', '040-23176031', 'accounts@ajpack.net', 'Phase 1, Sanathnagar, Hyderabad', 15)
  ON CONFLICT DO NOTHING RETURNING id INTO v_contact_ajpack;

  IF v_contact_ajpack IS NULL THEN
    SELECT id INTO v_contact_ajpack FROM public.contacts WHERE organization_id = v_org_id AND name LIKE '%AJ Packaging%' LIMIT 1;
  END IF;

  INSERT INTO public.contacts (id, organization_id, name, type, phone, email, address)
  VALUES ('c4000000-0000-4000-a000-000000000004', v_org_id, 'Precision Machine Tooling Corp', 'supplier', '040-27701234', 'sales@precisiontools.in', 'Ranigunj, Secunderabad')
  ON CONFLICT DO NOTHING RETURNING id INTO v_contact_tooling;

  -- 4. SEED MACHINING JOBS
  INSERT INTO public.orders (
    id, organization_id, contact_id, order_number, description, quantity, quantity_unit,
    quantity_completed, material, priority, status, reference_number, due_date, notes
  ) VALUES (
    'b1000000-0000-4000-a000-000000000001', v_org_id, v_contact_epe, 'JOB-2026-001',
    'CNC Machining High-Pressure Filter End Caps 90mm', 100, 'Nos', 65, 'Aluminium 6061-T6',
    'urgent', 'in_progress', 'EPE-PO-8821', CURRENT_DATE + INTERVAL '5 days',
    'Hard anodizing 25 microns required after turning. Surface finish Ra 0.8.'
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_job1_id;

  INSERT INTO public.orders (
    id, organization_id, contact_id, order_number, description, quantity, quantity_unit,
    quantity_completed, material, priority, status, reference_number, due_date, notes
  ) VALUES (
    'b2000000-0000-4000-a000-000000000002', v_org_id, v_contact_asha, 'JOB-2026-002',
    'Eccentric Pump Shaft Turning & Grinding', 40, 'Nos', 40, 'EN8 Steel',
    'normal', 'completed', 'ASH-PO-904', CURRENT_DATE - INTERVAL '2 days',
    'Induction hardened journals HRC 55. Inspected and approved.'
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_job2_id;

  INSERT INTO public.orders (
    id, organization_id, contact_id, order_number, description, quantity, quantity_unit,
    quantity_completed, material, priority, status, reference_number, due_date, notes
  ) VALUES (
    'b3000000-0000-4000-a000-000000000003', v_org_id, v_contact_ajpack, 'JOB-2026-003',
    'Brass Flange Bushing Precision Turning 45mm', 250, 'Nos', 0, 'Brass Grade 1',
    'normal', 'received', 'AJP-PO-1022', CURRENT_DATE + INTERVAL '12 days',
    'Raw material received via Inward DC #104.'
  ) ON CONFLICT DO NOTHING;

  -- 5. SEED TAX INVOICES
  INSERT INTO public.invoices (
    id, organization_id, contact_id, order_id, invoice_number, date, due_date,
    reference_number, subtotal, taxable_amount, total, total_amount, amount_paid, amount_due, status
  ) VALUES (
    'd1000000-0000-4000-a000-000000000001', v_org_id, v_contact_epe, v_job1_id,
    'INV-233', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '35 days',
    'EPE-PO-8821', 45000, 45000, 53100, 53100, 0, 53100, 'sent'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.invoices (
    id, organization_id, contact_id, order_id, invoice_number, date, due_date,
    reference_number, subtotal, taxable_amount, total, total_amount, amount_paid, amount_due, status
  ) VALUES (
    'd2000000-0000-4000-a000-000000000002', v_org_id, v_contact_asha, v_job2_id,
    'INV-234', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '27 days',
    'ASH-PO-904', 28500, 28500, 33630, 33630, 33630, 0, 'paid'
  ) ON CONFLICT DO NOTHING;

  -- 6. SEED JOB WORK CHALLANS (CGST Rule 55 & Sec 143 Tracking)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_work_challans') THEN
    INSERT INTO public.job_work_challans (
      id, organization_id, contact_id, challan_number, challan_date, role_type,
      principal_name, principal_gstin, job_worker_name, job_worker_gstin,
      nature_of_processing, dispatch_date, expiry_date, total_taxable_value, status, notes
    ) VALUES (
      'e1000000-0000-4000-a000-000000000001', v_org_id, v_contact_epe,
      'DC-240', CURRENT_DATE - INTERVAL '340 days', 'PRINCIPAL_OUTWARD',
      'Sri Vishwakarma Engineering Works', '36AAACS1234A1Z1',
      'EPE Engineering Job Work Division', '36AAACE9999E1Z9',
      'CNC Turning & Black Oxide Coating', CURRENT_DATE - INTERVAL '340 days',
      CURRENT_DATE + INTERVAL '25 days', 85000.00, 'OPEN',
      '⚠ CRITICAL: 25 days remaining before 1-year CGST Sec. 143 Deemed Supply deadline!'
    ) ON CONFLICT DO NOTHING RETURNING id INTO v_jwc1_id;

    IF v_jwc1_id IS NOT NULL THEN
      INSERT INTO public.job_work_items (challan_id, item_name, hsn_code, sent_qty, returned_qty, scrap_qty, uom, unit_taxable_value, total_taxable_value)
      VALUES (v_jwc1_id, 'Hydraulic Valve Block Steel Casting', '8481', 120, 50, 2, 'Nos', 708.33, 85000.00)
      ON CONFLICT DO NOTHING;
    END IF;

    INSERT INTO public.job_work_challans (
      id, organization_id, contact_id, challan_number, challan_date, role_type,
      principal_name, principal_gstin, job_worker_name, job_worker_gstin,
      nature_of_processing, dispatch_date, expiry_date, total_taxable_value, status, notes
    ) VALUES (
      'e2000000-0000-4000-a000-000000000002', v_org_id, v_contact_asha,
      'DC-241', CURRENT_DATE - INTERVAL '150 days', 'PRINCIPAL_OUTWARD',
      'Sri Vishwakarma Engineering Works', '36AAACS1234A1Z1',
      'Precision Heat Treaters Hyderabad', '36BBBP9876P1Z4',
      'Vacuum Heat Treatment (HRC 58-60)', CURRENT_DATE - INTERVAL '150 days',
      CURRENT_DATE + INTERVAL '215 days', 36000.00, 'PARTIALLY_RETURNED',
      'Batch 1 returned after heat treatment.'
    ) ON CONFLICT DO NOTHING RETURNING id INTO v_jwc2_id;

    IF v_jwc2_id IS NOT NULL THEN
      INSERT INTO public.job_work_items (challan_id, item_name, hsn_code, sent_qty, returned_qty, scrap_qty, uom, unit_taxable_value, total_taxable_value)
      VALUES (v_jwc2_id, 'EN31 Die Steel Guide Pins', '8466', 600, 450, 10, 'Nos', 60.00, 36000.00)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RAISE NOTICE '✅ Karkhana Demo Data Seeded Successfully!';
END $$;
