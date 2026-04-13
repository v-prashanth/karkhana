-- Migration 00008: Shadow Network Payables & Dashboard RPC update
-- Goal: Calculate Payables flawlessly by mapping auth.users -> public.users -> user.phone -> contacts.phone -> invoices.amount_due

DROP FUNCTION IF EXISTS public.get_dashboard_metrics(uuid);
DROP FUNCTION IF EXISTS public.get_dashboard_metrics_v2(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics_v2(p_org_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metrics json;
  v_user_phone text;
BEGIN
  -- 1. Grab the currently logged-in user's normalized phone number to form the Shadow Network link
  SELECT phone INTO v_user_phone FROM public.users WHERE id = p_user_id LIMIT 1;
  
  SELECT json_build_object(
    'activeOrders', (
      SELECT COUNT(*)
      FROM public.orders
      WHERE organization_id = p_org_id
        AND status IN ('pending', 'in_progress')
    ),
    'orderCount', (
      SELECT COUNT(*)
      FROM public.orders
      WHERE organization_id = p_org_id
    ),
    'invoiceCount', (
      SELECT COUNT(*)
      FROM public.invoices
      WHERE organization_id = p_org_id
    ),
    'expenseCount', (
      SELECT COUNT(*)
      FROM public.expenses
      WHERE organization_id = p_org_id
    ),
    'totalOutstanding', (
      SELECT COALESCE(SUM(amount_due), 0)
      FROM public.invoices
      WHERE organization_id = p_org_id
    ),
    'overdueInvoices', (
      SELECT COUNT(*)
      FROM public.invoices
      WHERE organization_id = p_org_id
        AND amount_due > 0
        AND status = 'overdue'
    ),
    'revenueThisMonth', (
      SELECT COALESCE(SUM(total), 0)
      FROM public.invoices
      WHERE organization_id = p_org_id
        AND status != 'draft'
        AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
    ),
    'paymentsThisMonth', (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.payments
      WHERE organization_id = p_org_id
        AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
    ),
    'expensesThisMonth', (
      SELECT COALESCE(SUM(amount), 0)
      FROM public.expenses
      WHERE organization_id = p_org_id
        AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
    ),
    'totalPayables', (
      -- SHADOW NETWORK JOIN: Unpaid Invoices where the attached contact matches my internal phone
      SELECT COALESCE(SUM(i.amount_due), 0)
      FROM public.invoices i
      JOIN public.contacts c ON i.contact_id = c.id
      WHERE c.phone = v_user_phone
        AND i.amount_due > 0
    )
  ) INTO v_metrics;

  RETURN v_metrics;
END;
$$;
