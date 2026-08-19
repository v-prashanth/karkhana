import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, contact:contacts(id, name, phone, email, address)")
    .eq("id", params.id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Fetch linked inward DCs
  const { data: inwardDCs } = await supabase
    .from("documents")
    .select("id, document_number, date, notes, status")
    .eq("order_id", params.id)
    .eq("organization_id", organizationId)
    .eq("type", "inward_dc")
    .order("date", { ascending: false });

  // Fetch linked outward DCs
  const { data: outwardDCs } = await supabase
    .from("documents")
    .select("id, document_number, date, notes, status")
    .eq("order_id", params.id)
    .eq("organization_id", organizationId)
    .eq("type", "outward_dc")
    .order("date", { ascending: false });

  // Fetch linked invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, total_amount, status, created_at")
    .eq("order_id", params.id)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    ...order,
    inward_dcs: inwardDCs || [],
    outward_dcs: outwardDCs || [],
    invoices: invoices || [],
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Build the update object — only allow safe fields
  const allowedFields = [
    "status",
    "priority",
    "description",
    "quantity",
    "quantity_unit",
    "quantity_completed",
    "material",
    "reference_number",
    "due_date",
    "notes",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  // Auto-set completed_at when status changes to completed
  if (body.status === "completed" && !body.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", params.id)
    .eq("organization_id", organizationId)
    .select("*, contact:contacts(id, name, phone)")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Failed to update job" },
      { status: 400 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", params.id)
    .eq("organization_id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
