import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET() {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*, contact:contacts(id, name, phone), invoice:invoices(id, invoice_number, total, amount_due)")
    .eq("organization_id", organizationId)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      organization_id: organizationId,
      contact_id: body.contact_id || null,
      invoice_id: body.invoice_id || null,
      amount: body.amount,
      method: body.method || "cash",
      reference_number: body.reference_number || null,
      date: body.date,
      notes: body.notes || null,
    })
    .select("*, contact:contacts(id, name, phone), invoice:invoices(id, invoice_number, total, amount_due)")
    .single();

  if (error || !payment) {
    return NextResponse.json({ error: error?.message ?? "Failed to record payment" }, { status: 400 });
  }

  if (body.invoice_id) {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("total, amount_paid")
      .eq("id", body.invoice_id)
      .eq("organization_id", organizationId)
      .single();

    if (invoice) {
      const amountPaid = Number(invoice.amount_paid || 0) + Number(body.amount || 0);
      const total = Number(invoice.total || 0);
      const amountDue = Math.max(0, total - amountPaid);
      const status = amountDue <= 0 ? "paid" : "partial";

      await supabase
        .from("invoices")
        .update({
          amount_paid: amountPaid,
          amount_due: amountDue,
          status,
        })
        .eq("id", body.invoice_id)
        .eq("organization_id", organizationId);
    }
  }

  return NextResponse.json(payment);
}
