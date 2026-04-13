import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

function createToken() {
  return randomUUID().replace(/-/g, "");
}

export async function POST(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.resource_type || !body.resource_id) {
    return NextResponse.json({ error: "Missing required share-link fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      organization_id: organizationId,
      resource_type: body.resource_type,
      resource_id: body.resource_id,
      token: createToken(),
      title: body.title || null,
      description: body.description || null,
      expires_at: body.expires_at || null,
      is_active: true,
      created_by: user.id || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
