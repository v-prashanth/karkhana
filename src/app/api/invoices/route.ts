import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

function formatInvoiceNumber(prefix: string, counter: number, financialYear: string) {
  return `${prefix}/${financialYear}/${String(counter).padStart(3, "0")}`;
}

export async function GET(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const outstandingOnly = searchParams.get("outstandingOnly") === "true";

  let query = supabase
    .from("invoices")
    .select("*")
    .eq("organization_id", organizationId)
    .order("date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (outstandingOnly) {
    query = query.gt("amount_due", 0);
  }

  const { data: invoices, error } = await query;

  if (error) {
    console.error("Invoices fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!invoices || invoices.length === 0) {
    return NextResponse.json([]);
  }

  // Safely attach contact details if contact_id exists
  const contactIds = Array.from(
    new Set(
      invoices
        .map((inv: any) => inv.contact_id || inv.client_id)
        .filter(Boolean)
    )
  );

  let contactsMap = new Map<string, any>();
  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, phone, email")
      .in("id", contactIds);

    if (contacts) {
      contacts.forEach((c: any) => contactsMap.set(c.id, c));
    }
  }

  const enrichedInvoices = invoices.map((inv: any) => ({
    ...inv,
    // Ensure both total and total_amount fields exist
    total: inv.total || inv.total_amount || 0,
    total_amount: inv.total_amount || inv.total || 0,
    invoice_number: inv.invoice_number || inv.bill_number || `INV-${inv.id.slice(0, 6)}`,
    contact: contactsMap.get(inv.contact_id || inv.client_id) || null,
  }));

  return NextResponse.json(enrichedInvoices);
}

export async function POST(request: Request) {
  const { user, organizationId, role, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("invoice_prefix, invoice_counter, financial_year, plan")
    .eq("id", organizationId)
    .single();

  if (orgError || !organization) {
    return NextResponse.json({ error: orgError?.message ?? "Organization not found" }, { status: 400 });
  }

  const invoiceNumber =
    body.invoice_number ||
    formatInvoiceNumber(
      organization.invoice_prefix || "INV",
      organization.invoice_counter || 1,
      organization.financial_year || "2026-27"
    );

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId,
      contact_id: body.contact_id || null,
      order_id: body.order_id || null,
      document_id: body.document_id || null,
      type: body.type || "tax_invoice",
      invoice_number: invoiceNumber,
      date: body.date || new Date().toISOString().split("T")[0],
      due_date: body.due_date || null,
      reference_number: body.reference_number || null,
      subtotal: body.subtotal ?? 0,
      taxable_amount: body.taxable_amount ?? body.subtotal ?? 0,
      total: body.total ?? body.total_amount ?? 0,
      total_amount: body.total_amount ?? body.total ?? 0,
      status: body.status || "sent",
      amount_paid: body.amount_paid ?? 0,
      amount_due: body.amount_due ?? body.total ?? 0,
      notes: body.notes || null,
    })
    .select("*")
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json(
      { error: invoiceError?.message ?? "Failed to create invoice" },
      { status: 400 }
    );
  }

  return NextResponse.json(invoice);
}
