import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("orders")
    .select("*, contact:contacts(id, name, phone)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      organization_id: organizationId,
      contact_id: body.contact_id,
      reference_number: body.reference_number,
      description: body.description,
      status: body.status ?? "received",
      priority: body.priority,
      quantity: body.quantity,
      quantity_unit: body.quantity_unit,
      quantity_completed: body.quantity_completed ?? 0,
      material: body.material,
      due_date: body.due_date || null,
      notes: body.notes,
    })
    .select("*, contact:contacts(id, name, phone)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
