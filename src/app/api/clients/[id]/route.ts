import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", params.id)
    .eq("organization_id", organizationId)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: contactError?.message ?? "Contact not found" }, { status: 404 });
  }

  const [invoicesRes, paymentsRes, ordersRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("contact_id", params.id)
      .order("date", { ascending: false }),
    supabase
      .from("payments")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("contact_id", params.id)
      .order("date", { ascending: false }),
    supabase
      .from("orders")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("contact_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (invoicesRes.error) {
    return NextResponse.json({ error: invoicesRes.error.message }, { status: 400 });
  }

  if (paymentsRes.error) {
    return NextResponse.json({ error: paymentsRes.error.message }, { status: 400 });
  }

  if (ordersRes.error) {
    return NextResponse.json({ error: ordersRes.error.message }, { status: 400 });
  }

  const invoices = invoicesRes.data || [];
  const payments = paymentsRes.data || [];
  const orders = ordersRes.data || [];
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return NextResponse.json({
    contact,
    invoices,
    payments,
    orders,
    totalInvoiced,
    totalPaid,
    outstanding: totalInvoiced - totalPaid,
  });
}
