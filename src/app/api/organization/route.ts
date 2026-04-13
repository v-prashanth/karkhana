import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: body.name,
      owner_name: body.owner_name,
      phone: body.phone,
      email: body.email,
      address: body.address,
      gstin: body.gstin,
      logo_url: body.logo_url,
      brand_primary_color: body.brand_primary_color,
      brand_secondary_color: body.brand_secondary_color,
      document_template: body.document_template,
      footer_text: body.footer_text,
      signature_name: body.signature_name,
      bank_details: body.bank_details,
      upi_id: body.upi_id,
      invoice_prefix: body.invoice_prefix,
      invoice_counter: body.invoice_counter,
      dc_prefix: body.dc_prefix,
      dc_counter: body.dc_counter,
    })
    .eq("id", organizationId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
