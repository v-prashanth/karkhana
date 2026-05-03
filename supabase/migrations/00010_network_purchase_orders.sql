-- Migration 00010: Network Purchase Orders
-- Buyer issues PO to a supplier via their phone-number network link.
-- The supplier sees it in their inbox and can convert it to a Job with 1 tap.

CREATE TABLE IF NOT EXISTS network_purchase_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Buyer side
  buyer_org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  buyer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Supplier side (resolved via phone)
  supplier_org_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  -- PO details
  po_number text NOT NULL,
  description text,
  line_items jsonb DEFAULT '[]'::jsonb,
  total decimal(15,2) DEFAULT 0,
  due_date date,
  notes text,
  -- Status tracking
  status text DEFAULT 'sent', -- sent, acknowledged, in_progress, completed, cancelled
  -- Conversion tracking
  converted_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE network_purchase_orders ENABLE ROW LEVEL SECURITY;

-- Buyer can see POs they issued
CREATE POLICY "Buyers can view their issued POs"
  ON network_purchase_orders FOR SELECT
  USING (buyer_org_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- Buyer can create POs
CREATE POLICY "Buyers can create POs"
  ON network_purchase_orders FOR INSERT
  WITH CHECK (buyer_org_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- Supplier can see POs addressed to them
CREATE POLICY "Suppliers can view POs sent to them"
  ON network_purchase_orders FOR SELECT
  USING (supplier_org_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- Supplier can update PO status (acknowledge, complete)
CREATE POLICY "Suppliers can update PO status"
  ON network_purchase_orders FOR UPDATE
  USING (supplier_org_id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

-- RPC: Get POs sent to my organization (supplier inbox)
CREATE OR REPLACE FUNCTION public.get_supplier_po_inbox(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', npo.id,
      'po_number', npo.po_number,
      'description', npo.description,
      'line_items', npo.line_items,
      'total', npo.total,
      'due_date', npo.due_date,
      'notes', npo.notes,
      'status', npo.status,
      'created_at', npo.created_at,
      'converted_order_id', npo.converted_order_id,
      'buyer', json_build_object(
        'id', o.id,
        'name', o.name,
        'logo_url', o.logo_url
      )
    ) ORDER BY npo.created_at DESC
  ), '[]'::json) INTO v_result
  FROM public.network_purchase_orders npo
  JOIN public.organizations o ON npo.buyer_org_id = o.id
  WHERE npo.supplier_org_id = p_org_id;

  RETURN v_result;
END;
$$;

-- RPC: Get POs I issued as a buyer
CREATE OR REPLACE FUNCTION public.get_buyer_issued_pos(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', npo.id,
      'po_number', npo.po_number,
      'description', npo.description,
      'total', npo.total,
      'due_date', npo.due_date,
      'status', npo.status,
      'created_at', npo.created_at,
      'supplier', json_build_object(
        'id', o.id,
        'name', o.name,
        'logo_url', o.logo_url
      )
    ) ORDER BY npo.created_at DESC
  ), '[]'::json) INTO v_result
  FROM public.network_purchase_orders npo
  JOIN public.organizations o ON npo.supplier_org_id = o.id
  WHERE npo.buyer_org_id = p_org_id;

  RETURN v_result;
END;
$$;
