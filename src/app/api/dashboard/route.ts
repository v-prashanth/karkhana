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

  // 1. Fetch raw metrics via the ultra-fast Postgres RPC math calculation
  const { data: metricsData, error: metricsError } = await supabase
    .rpc("get_dashboard_metrics_v2", { p_org_id: organizationId, p_user_id: user.id });

  if (metricsError) {
    console.error("RPC Metrics Error:", metricsError);
    return NextResponse.json({ error: "Failed to load core metrics" }, { status: 500 });
  }

  // 2. Fetch the top 8 most recent activity items exactly as before but strictly limited at the DB
  // For true scalability, we run a UNION query but Supabase PostgREST client doesn't 
  // expose native UNION easily. Instead of pulling everything, we pull just the last 8
  // of each and sort them in JS since the dataset length is now strictly capped at 32 objects max.
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

  // Combine RPC math data and the recent activity
  const metrics = {
    activeOrders: Number(metricsData?.activeOrders || 0),
    totalOutstanding: Number(metricsData?.totalOutstanding || 0),
    totalPayables: Number(metricsData?.totalPayables || 0), // The Shadow Network calculation
    revenueThisMonth: Number(metricsData?.revenueThisMonth || 0),
    paymentsThisMonth: Number(metricsData?.paymentsThisMonth || 0),
    expensesThisMonth: Number(metricsData?.expensesThisMonth || 0),
    overdueInvoices: Number(metricsData?.overdueInvoices || 0),
    invoiceCount: Number(metricsData?.invoiceCount || 0),
    expenseCount: Number(metricsData?.expenseCount || 0),
    orderCount: Number(metricsData?.orderCount || 0),
    recentActivity,
  };

  return NextResponse.json(metrics);
}
