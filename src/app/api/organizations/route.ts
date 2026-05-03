import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Build update object, only including fields that were actually sent
  const allowedFields = [
    'name', 'owner_name', 'phone', 'email', 'address', 'gstin',
    'logo_url', 'brand_primary_color', 'brand_secondary_color',
    'document_template', 'footer_text', 'signature_name',
    'bank_details', 'upi_id', 'invoice_prefix', 'invoice_counter',
    'dc_prefix', 'dc_counter', 'business_type', 'tagline',
    'capabilities', 'year_established', 'employee_count', 'profile_complete',
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", organizationId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
