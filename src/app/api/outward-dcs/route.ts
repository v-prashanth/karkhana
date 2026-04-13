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
    .from("documents")
    .select("*, contact:contacts(id, name, phone), order:orders(id, description)")
    .eq("organization_id", organizationId)
    .eq("type", "outward_dc")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("dc_prefix, dc_counter")
    .eq("id", organizationId)
    .single();

  if (orgError || !organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 400 });
  }

  const docNumber = `${organization.dc_prefix}/${organization.dc_counter}`;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      organization_id: organizationId,
      contact_id: body.contact_id || null,
      order_id: body.order_id || null,
      type: "outward_dc",
      document_number: docNumber,
      date: body.date || new Date().toISOString().split("T")[0],
      reference_number: body.reference_number || null,
      notes: body.notes || null,
      pdf_url: body.pdf_url || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create outward DC" }, { status: 400 });
  }

  // Insert document items if provided
  if (body.items && Array.isArray(body.items)) {
    await supabase.from("document_items").insert(
      body.items.map((item: { description: string; quantity: number; unit?: string; rate?: number; amount?: number; sort_order?: number }) => ({
        document_id: data.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || "Nos",
        rate: item.rate || 0,
        amount: item.amount || 0,
        sort_order: item.sort_order || 0,
      }))
    );
  }

  // Increment counter
  if (data) {
    await supabase
      .from("organizations")
      .update({ dc_counter: organization.dc_counter + 1 })
      .eq("id", organizationId);
  }

  return NextResponse.json(data);
}
