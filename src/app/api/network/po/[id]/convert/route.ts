import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

// POST: Supplier converts a PO into a Job (Order) with 1 tap
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch the PO and verify it belongs to this supplier
  const { data: po, error: poError } = await supabase
    .from("network_purchase_orders")
    .select("*")
    .eq("id", params.id)
    .eq("supplier_org_id", organizationId)
    .single();

  if (poError || !po) {
    return NextResponse.json({ error: "PO not found or access denied" }, { status: 404 });
  }

  if (po.converted_order_id) {
    return NextResponse.json({ error: "PO already converted to a Job" }, { status: 400 });
  }

  // 2. Find the contact (buyer org) in supplier's contacts
  // Use the buyer org to find matching contact
  const { data: buyerOrg } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", po.buyer_org_id)
    .single();

  // 3. Create the Job (Order)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      organization_id: organizationId,
      description: po.description || `PO: ${po.po_number}`,
      quantity: 1,
      quantity_unit: "Lot",
      material: po.description || "",
      reference_no: po.po_number,
      priority: "normal",
      status: "received",
      due_date: po.due_date,
      notes: `Auto-converted from PO ${po.po_number} by ${buyerOrg?.name || "Buyer"}. ${po.notes || ""}`.trim(),
    })
    .select("*")
    .single();

  if (orderError || !order) {
    console.error("Create Job Error:", orderError);
    return NextResponse.json({ error: "Failed to create Job from PO" }, { status: 500 });
  }

  // 4. Update PO with conversion reference and status
  await supabase
    .from("network_purchase_orders")
    .update({
      converted_order_id: order.id,
      status: "in_progress",
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  return NextResponse.json({
    message: "PO converted to Job successfully",
    order,
    po_number: po.po_number,
  });
}
