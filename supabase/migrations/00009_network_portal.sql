-- Migration 00009: Supply Network Reverse Queries
-- Goal: Safely pull network data (Invoices and DCs) mapped to the authenticated user's phone, across all organizations.

-- 1. Get Network Payables (Invoices sent TO the user)
CREATE OR REPLACE FUNCTION public.get_network_payables(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_phone text;
  v_result json;
BEGIN
  -- Get user phone
  SELECT phone INTO v_user_phone FROM public.users WHERE id = p_user_id LIMIT 1;
  
  IF v_user_phone IS NULL THEN
    RETURN '[]'::json;
  END IF;

  -- Select Invoices mapped via Contact Phone
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', i.id,
      'invoice_number', i.invoice_number,
      'date', i.date,
      'amount_due', i.amount_due,
      'total', i.total,
      'status', i.status,
      'due_date', i.due_date,
      'organization', json_build_object(
        'id', o.id,
        'name', o.name,
        'logo_url', o.logo_url
      )
    ) ORDER BY i.date DESC
  ), '[]'::json) INTO v_result
  FROM public.invoices i
  JOIN public.contacts c ON i.contact_id = c.id
  JOIN public.organizations o ON i.organization_id = o.id
  WHERE c.phone = v_user_phone
    AND i.amount_due > 0
    AND i.status NOT IN ('draft', 'cancelled');

  RETURN v_result;
END;
$$;

-- 2. Get Network Incoming Goods (Outward DCs sent TO the user)
CREATE OR REPLACE FUNCTION public.get_network_incoming_goods(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_phone text;
  v_result json;
BEGIN
  -- Get user phone
  SELECT phone INTO v_user_phone FROM public.users WHERE id = p_user_id LIMIT 1;
  
  IF v_user_phone IS NULL THEN
    RETURN '[]'::json;
  END IF;

  -- Select Outward DCs mapped via Contact Phone
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', d.id,
      'document_number', d.document_number,
      'date', d.date,
      'reference_number', d.reference_number,
      'notes', d.notes,
      'organization', json_build_object(
        'id', o.id,
        'name', o.name,
        'logo_url', o.logo_url
      )
    ) ORDER BY d.date DESC
  ), '[]'::json) INTO v_result
  FROM public.documents d
  JOIN public.contacts c ON d.contact_id = c.id
  JOIN public.organizations o ON d.organization_id = o.id
  WHERE c.phone = v_user_phone
    AND d.type = 'outward_dc';

  RETURN v_result;
END;
$$;
