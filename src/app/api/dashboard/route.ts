import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";
import type { ActivityItem, DashboardMetrics } from "@/types/database";

function getContactName(contact: unknown) {
  if (Array.isArray(contact)) {
    const first = contact[0] as { name?: string } | undefined;
    return first?.name || "Client";
  }

  if (contact && typeof contact === "object" && "name" in contact) {
    return (contact as { name?: string }).name || "Client";
  }

  return "Client";
}

export async function GET() {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized or no organization" }, { status: 401 });
  }

  // 1. Attempt fast RPC path first, with graceful fallback to direct queries
  let coreMetrics: Record<string, number> = {
    activeOrders: 0,
    totalOutstanding: 0,
    totalPayables: 0,
    revenueThisMonth: 0,
    paymentsThisMonth: 0,
    expensesThisMonth: 0,
    overdueInvoices: 0,
    invoiceCount: 0,
    expenseCount: 0,
    orderCount: 0,
  };

  const { data: metricsData, error: metricsError } = await supabase
    .rpc("get_dashboard_metrics_v2", { p_org_id: organizationId, p_user_id: user.id });

  if (!metricsError && metricsData) {
    // RPC returned successfully — map the data (handles both camelCase and snake_case)
    const m = metricsData as Record<string, unknown>;
    coreMetrics = {
      activeOrders: Number(m.activeOrders ?? m.active_orders ?? 0),
      totalOutstanding: Number(m.totalOutstanding ?? m.total_outstanding ?? 0),
      totalPayables: Number(m.totalPayables ?? m.total_payables ?? 0),
      revenueThisMonth: Number(m.revenueThisMonth ?? m.revenue_this_month ?? 0),
      paymentsThisMonth: Number(m.paymentsThisMonth ?? m.payments_this_month ?? 0),
      expensesThisMonth: Number(m.expensesThisMonth ?? m.expenses_this_month ?? 0),
      overdueInvoices: Number(m.overdueInvoices ?? m.overdue_invoices ?? 0),
      invoiceCount: Number(m.invoiceCount ?? m.invoice_count ?? 0),
      expenseCount: Number(m.expenseCount ?? m.expense_count ?? 0),
      orderCount: Number(m.orderCount ?? m.order_count ?? 0),
    };
  } else {
    // Fallback: RPC not deployed yet — compute basic metrics from direct queries
    console.warn("RPC unavailable, falling back to direct queries:", metricsError?.message);
    const [invoiceRes, orderRes, expenseRes, paymentRes] = await Promise.all([
      supabase.from("invoices").select("total, amount_due, status, date").eq("organization_id", organizationId),
      supabase.from("orders").select("status").eq("organization_id", organizationId),
      supabase.from("expenses").select("amount, date").eq("organization_id", organizationId),
      supabase.from("payments").select("amount, date").eq("organization_id", organizationId),
    ]);

    const invoices = invoiceRes.data || [];
    const orders = orderRes.data || [];
    const expenses = expenseRes.data || [];
    const payments = paymentRes.data || [];

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    coreMetrics.invoiceCount = invoices.length;
    coreMetrics.orderCount = orders.length;
    coreMetrics.expenseCount = expenses.length;
    coreMetrics.totalOutstanding = invoices.reduce((sum: number, i: { amount_due: number }) => sum + Number(i.amount_due || 0), 0);
    coreMetrics.overdueInvoices = invoices.filter((i: { amount_due: number; status: string }) => Number(i.amount_due) > 0 && i.status === "overdue").length;
    coreMetrics.activeOrders = orders.filter((o: { status: string }) => o.status === "pending" || o.status === "in_progress").length;
    coreMetrics.revenueThisMonth = invoices
      .filter((i: { status: string; date: string }) => i.status !== "draft" && new Date(i.date) >= thisMonthStart)
      .reduce((sum: number, i: { total: number }) => sum + Number(i.total || 0), 0);
    coreMetrics.paymentsThisMonth = payments
      .filter((p: { date: string }) => new Date(p.date) >= thisMonthStart)
      .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount || 0), 0);
    coreMetrics.expensesThisMonth = expenses
      .filter((e: { date: string }) => new Date(e.date) >= thisMonthStart)
      .reduce((sum: number, e: { amount: number }) => sum + Number(e.amount || 0), 0);
  }

  // 2. Fetch the top 8 most recent activity items (strictly DB-limited)
  const [ordersRes, invoicesRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from("orders").select("id, description, status, created_at").eq("organization_id", organizationId).order('created_at', { ascending: false }).limit(8),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, amount_due, status, date, created_at, contact:contacts(name)")
      .eq("organization_id", organizationId).order('date', { ascending: false }).limit(8),
    supabase
      .from("payments")
      .select("id, amount, date, created_at, contact:contacts(name)")
      .eq("organization_id", organizationId).order('date', { ascending: false }).limit(8),
    supabase.from("expenses").select("id, amount, description, date, created_at").eq("organization_id", organizationId).order('date', { ascending: false }).limit(8),
  ]);

  const orders = ordersRes.data || [];
  const invoices = invoicesRes.data || [];
  const payments = paymentsRes.data || [];
  const expenses = expensesRes.data || [];

  const invoiceActivities: ActivityItem[] = invoices.map((invoice) => ({
    id: invoice.id,
    type: "invoice",
    title: `Invoice ${invoice.invoice_number}`,
    subtitle: getContactName(invoice.contact),
    amount: Number(invoice.total || 0),
    timestamp: invoice.created_at || invoice.date,
  }));

  const paymentActivities: ActivityItem[] = payments.map((payment) => ({
    id: payment.id,
    type: "payment",
    title: "Payment received",
    subtitle: getContactName(payment.contact),
    amount: Number(payment.amount || 0),
    timestamp: payment.created_at || payment.date,
  }));

  const orderActivities: ActivityItem[] = orders.map((order) => ({
    id: order.id,
    type: "order",
    title: order.description,
    subtitle: `Status: ${order.status}`,
    timestamp: order.created_at,
  }));

  const expenseActivities: ActivityItem[] = expenses.map((expense) => ({
    id: expense.id,
    type: "expense",
    title: expense.description,
    subtitle: "Expense logged",
    amount: Number(expense.amount || 0),
    timestamp: expense.created_at || expense.date,
  }));

  const recentActivity = [...invoiceActivities, ...paymentActivities, ...orderActivities, ...expenseActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  const metrics: DashboardMetrics = {
    activeOrders: coreMetrics.activeOrders,
    totalOutstanding: coreMetrics.totalOutstanding,
    totalPayables: coreMetrics.totalPayables,
    revenueThisMonth: coreMetrics.revenueThisMonth,
    paymentsThisMonth: coreMetrics.paymentsThisMonth,
    expensesThisMonth: coreMetrics.expensesThisMonth,
    overdueInvoices: coreMetrics.overdueInvoices,
    invoiceCount: coreMetrics.invoiceCount,
    expenseCount: coreMetrics.expenseCount,
    orderCount: coreMetrics.orderCount,
    recentActivity,
  };

  return NextResponse.json(metrics);
}
