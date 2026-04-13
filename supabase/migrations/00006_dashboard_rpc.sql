-- Migration 00006: Highly scalable native Dashboard RPC Metrics

CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_org_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_active_orders INT;
    v_total_outstanding NUMERIC;
    v_revenue_this_month NUMERIC;
    v_payments_this_month NUMERIC;
    v_expenses_this_month NUMERIC;
    v_overdue_invoices INT;
    v_invoice_count INT;
    v_expense_count INT;
    v_order_count INT;
BEGIN
    -- Performance Tracking: 
    -- These specific raw aggregate queries execute on the database metal instantly
    -- eliminating the massive network bandwidth transfer and O(n) JS Array traversal

    -- Order aggregates
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE status IN ('received', 'in_progress'))
    INTO v_order_count, v_active_orders
    FROM orders
    WHERE organization_id = p_org_id;

    -- Invoice aggregates (Revenue & Outstanding)
    SELECT COUNT(*),
           COALESCE(SUM(amount_due), 0),
           COALESCE(SUM(total) FILTER (WHERE status != 'cancelled' AND date_trunc('month', date::date) = date_trunc('month', CURRENT_DATE)), 0),
           COUNT(*) FILTER (WHERE amount_due > 0 AND status = 'overdue')
    INTO v_invoice_count, v_total_outstanding, v_revenue_this_month, v_overdue_invoices
    FROM invoices
    WHERE organization_id = p_org_id;

    -- Payment aggregates (Collections)
    SELECT COALESCE(SUM(amount) FILTER (WHERE date_trunc('month', date::date) = date_trunc('month', CURRENT_DATE)), 0)
    INTO v_payments_this_month
    FROM payments
    WHERE organization_id = p_org_id;

    -- Expense aggregates (Outflow)
    SELECT COUNT(*),
           COALESCE(SUM(amount) FILTER (WHERE date_trunc('month', date::date) = date_trunc('month', CURRENT_DATE)), 0)
    INTO v_expense_count, v_expenses_this_month
    FROM expenses
    WHERE organization_id = p_org_id;

    -- Return JSON payload straight to Next.js
    RETURN jsonb_build_object(
        'activeOrders', COALESCE(v_active_orders, 0),
        'totalOutstanding', COALESCE(v_total_outstanding, 0),
        'revenueThisMonth', COALESCE(v_revenue_this_month, 0),
        'paymentsThisMonth', COALESCE(v_payments_this_month, 0),
        'expensesThisMonth', COALESCE(v_expenses_this_month, 0),
        'overdueInvoices', COALESCE(v_overdue_invoices, 0),
        'invoiceCount', COALESCE(v_invoice_count, 0),
        'expenseCount', COALESCE(v_expense_count, 0),
        'orderCount', COALESCE(v_order_count, 0)
    );
END;
$$;
