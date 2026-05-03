import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let query = supabase.from("contacts").select("*").eq("organization_id", organizationId).eq("is_active", true).order("name");

  if (type) {
    query = query.or(`type.eq.${type},type.eq.both`);
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

  // Plan Enforcement - v4 Monetization
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", organizationId)
    .single();

  if (orgErr) return NextResponse.json({ error: "Organization check failed" }, { status: 400 });

  if (org?.plan === "free") {
    // Count active contacts
    const { count, error: countErr } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true);

    if (countErr) return NextResponse.json({ error: "Limit check failed" }, { status: 400 });
    
    if (count && count >= 3) {
      return NextResponse.json({ 
        error: "PLAN_LIMIT_REACHED", 
        message: "Your Free plan is limited to 3 clients. Upgrade to Pro for unlimited access." 
      }, { status: 403 });
    }
  }
  // Viral Discovery - v4 Network Loop
  // Check if this contact's phone exists as a Karkhana Organization
  let onKarkhanaOrgId = null;
  if (body.phone) {
    const { data: matchedOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("phone", body.phone.replace(/\D/g, ""))
      .single();
    if (matchedOrg) onKarkhanaOrgId = matchedOrg.id;
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      organization_id: organizationId,
      type: body.type,
      name: body.name,
      contact_person: body.contact_person,
      phone: body.phone,
      email: body.email,
      address: body.address,
      gstin: body.gstin,
      notes: body.notes,
      tags: body.tags ?? [],
      is_active: true,
      total_outstanding: body.total_outstanding ?? 0,
      on_karkhana_org_id: onKarkhanaOrgId, // Link for discovery
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
