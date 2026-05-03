import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

// GET: Buyer sees their issued POs / Supplier sees their PO inbox
export async function GET(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "inbox"; // "inbox" (supplier) or "issued" (buyer)

  if (view === "issued") {
    // Buyer view: POs I issued to my vendors
    const { data, error } = await supabase.rpc("get_buyer_issued_pos", {
      p_org_id: organizationId,
    });
    if (error) {
      console.error("Buyer POs Error:", error);
      return NextResponse.json({ error: "Failed to load issued POs" }, { status: 500 });
    }
    return NextResponse.json(data || []);
  }

  // Supplier view: POs sent to me
  const { data, error } = await supabase.rpc("get_supplier_po_inbox", {
    p_org_id: organizationId,
  });
  if (error) {
    console.error("Supplier PO Inbox Error:", error);
    return NextResponse.json({ error: "Failed to load PO inbox" }, { status: 500 });
  }
  return NextResponse.json(data || []);
}

// POST: Buyer creates a PO to send to a supplier
export async function POST(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Resolve supplier org from the vendor list (selected by buyer from their network)
  const supplierOrgId = body.supplier_org_id;
  if (!supplierOrgId) {
    return NextResponse.json({ error: "Supplier organization is required" }, { status: 400 });
  }

  // Generate PO number
  const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await supabase
    .from("network_purchase_orders")
    .insert({
      buyer_org_id: organizationId,
      buyer_user_id: user.id,
      supplier_org_id: supplierOrgId,
      po_number: body.po_number || poNumber,
      description: body.description || "",
      line_items: body.line_items || [],
      total: body.total || 0,
      due_date: body.due_date || null,
      notes: body.notes || "",
      status: "sent",
    })
    .select("*")
    .single();

  if (error) {
    console.error("Create PO Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
