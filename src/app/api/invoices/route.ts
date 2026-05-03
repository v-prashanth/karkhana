import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

function formatInvoiceNumber(prefix: string, counter: number, financialYear: string) {
  return `${prefix}/${financialYear}/${String(counter).padStart(3, "0")}`;
}

export async function GET(request: Request) {
  const { user, organizationId, role, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RBAC Check
  if (role !== "owner" && role !== "accountant") {
    return NextResponse.json({ error: "Forbidden: Department access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const outstandingOnly = searchParams.get("outstandingOnly") === "true";

  let query = supabase
    .from("invoices")
    .select("*, contact:contacts(id, name, phone, email)")
    .eq("organization_id", organizationId)
    .order("date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (outstandingOnly) {
    query = query.gt("amount_due", 0);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user, organizationId, role, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RBAC Check
  if (role !== "owner" && role !== "accountant") {
    return NextResponse.json({ error: "Forbidden: Only finance and admin users can issue invoices." }, { status: 403 });
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

  // Plan Enforcement - v4 Monetization
  if (organization.plan === "free") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", startOfMonth.toISOString());

    if (countErr) return NextResponse.json({ error: "Limit check failed" }, { status: 400 });
    
    if (count && count >= 20) {
      return NextResponse.json({ 
        error: "PLAN_LIMIT_REACHED", 
        message: "Your Free plan is limited to 20 documents per month. Upgrade to Pro for unlimited access." 
      }, { status: 403 });
    }
  }

  const invoiceNumber =
    body.invoice_number ||
    formatInvoiceNumber(organization.invoice_prefix || "INV", organization.invoice_counter || 1, organization.financial_year || "2026-27");

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      organization_id: organizationId,
      contact_id: body.contact_id || null,
      order_id: body.order_id || null,
      document_id: body.document_id || null,
      type: body.type || "tax_invoice",
      invoice_number: invoiceNumber,
      date: body.date,
      due_date: body.due_date || null,
      reference_number: body.reference_number || null,
      subtotal: body.subtotal ?? 0,
      discount_percent: body.discount_percent ?? 0,
      discount_amount: body.discount_amount ?? 0,
      taxable_amount: body.taxable_amount ?? body.subtotal ?? 0,
      cgst_rate: body.cgst_rate ?? 0,
      cgst_amount: body.cgst_amount ?? 0,
      sgst_rate: body.sgst_rate ?? 0,
      sgst_amount: body.sgst_amount ?? 0,
      igst_rate: body.igst_rate ?? 0,
      igst_amount: body.igst_amount ?? 0,
      total: body.total ?? 0,
      total_in_words: body.total_in_words || null,
      status: role === "owner" ? (body.status || "sent") : "pending_approval",
      amount_paid: body.amount_paid ?? 0,
      amount_due: body.amount_due ?? body.total ?? 0,
      notes: body.notes || null,
    })
    .select("*, contact:contacts(id, name, phone, email)")
    .single();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: invoiceError?.message ?? "Failed to create invoice" }, { status: 400 });
  }

  if (Array.isArray(body.items) && body.items.length > 0) {
    const { error: itemsError } = await supabase.from("invoice_items").insert(
      body.items.map(
        (
          item: {
            description: string;
            hsn_sac?: string | null;
            quantity?: number;
            unit?: string;
            rate?: number;
            discount_percent?: number;
            taxable_amount?: number;
            tax_rate?: number;
            tax_amount?: number;
            amount?: number;
          },
          index: number
        ) => ({
          invoice_id: invoice.id,
          description: item.description,
          hsn_sac: item.hsn_sac || null,
          quantity: item.quantity ?? 1,
          unit: item.unit || "Nos",
          rate: item.rate ?? 0,
          discount_percent: item.discount_percent ?? 0,
          taxable_amount: item.taxable_amount ?? item.amount ?? 0,
          tax_rate: item.tax_rate ?? 0,
          tax_amount: item.tax_amount ?? 0,
          amount: item.amount ?? 0,
          sort_order: index,
        })
      )
    );

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }
  }

  await supabase
    .from("organizations")
    .update({ invoice_counter: (organization.invoice_counter || 1) + 1 })
    .eq("id", organizationId);

  return NextResponse.json(invoice);
}
