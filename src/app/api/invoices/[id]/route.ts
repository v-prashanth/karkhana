import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, contact:contacts(*), items:invoice_items(*)")
    .eq("organization_id", organizationId)
    .eq("id", params.id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: error?.message ?? "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data: existingInvoice, error: fetchError } = await supabase
    .from("invoices")
    .select("amount_paid")
    .eq("organization_id", organizationId)
    .eq("id", params.id)
    .single();

  if (fetchError || !existingInvoice) {
    return NextResponse.json({ error: fetchError?.message ?? "Invoice not found" }, { status: 404 });
  }

  if (Number(existingInvoice.amount_paid || 0) > 0) {
    return NextResponse.json({ error: "Paid or partially paid invoices cannot be edited" }, { status: 400 });
  }

  const { data: invoice, error: updateError } = await supabase
    .from("invoices")
    .update({
      contact_id: body.contact_id || null,
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
      amount_due: body.amount_due ?? body.total ?? 0,
      notes: body.notes || null,
    })
    .eq("organization_id", organizationId)
    .eq("id", params.id)
    .select("*, contact:contacts(*), items:invoice_items(*)")
    .single();

  if (updateError || !invoice) {
    return NextResponse.json({ error: updateError?.message ?? "Failed to update invoice" }, { status: 400 });
  }

  await supabase.from("invoice_items").delete().eq("invoice_id", params.id);

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
          invoice_id: params.id,
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

  const { data: refreshed } = await supabase
    .from("invoices")
    .select("*, contact:contacts(*), items:invoice_items(*)")
    .eq("organization_id", organizationId)
    .eq("id", params.id)
    .single();

  return NextResponse.json(refreshed);
}
