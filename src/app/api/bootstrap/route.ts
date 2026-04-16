import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";
import { getCurrentFinancialYear } from "@/lib/utils/financialYear";

/**
 * Bootstrap API — v4 Platform Edition
 * Initializes a new organization, its owner profile, and sets up the work environment.
 */
export async function POST(request: Request) {
  const { user: authUser, supabase } = await getSecureServerSession();
  const body = await request.json();
  
  // 1. Get authenticated user from session
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
  }

  // 2. Generate a clean public slug (e.g. "Sri Vishwakarma" -> "sri-vishwakarma-1234")
  const baseSlug = body.name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const publicSlug = `${baseSlug}-${randomSuffix}`;

  // 3. Create the Organization (Primary Tenant)
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: body.name,
      owner_name: body.owner_name,
      phone: body.phone || authUser.phone,
      email: body.email || authUser.email,
      address: body.address,
      gstin: body.gstin,
      business_type: body.business_type,
      public_slug: publicSlug,
      order_label: body.order_label || 'Job',
      invoice_prefix: body.invoice_prefix || 'INV',
      invoice_counter: parseInt(body.invoice_counter, 10) || 1,
      dc_prefix: body.dc_prefix || 'DC',
      dc_counter: parseInt(body.dc_counter, 10) || 1,
      financial_year: body.financial_year || getCurrentFinancialYear(),
      plan: "free",
    })
    .select("*")
    .single();

  if (orgError || !organization) {
    console.error("Org Creation Error:", orgError);
    return NextResponse.json({ error: orgError?.message ?? "Failed to create organization" }, { status: 400 });
  }

  // 4. Create the User Profile (Linked to Auth & Org)
  const { error: profileError } = await supabase.from("users").upsert(
    {
      id: authUser.id,
      organization_id: organization.id,
      name: body.owner_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      phone: body.phone || authUser.phone || null,
      email: body.email || authUser.email || null,
      role: "owner",
      is_active: true,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("Profile Creation Error:", profileError);
    // Cleanup if possible, or just report error
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  // 5. Audit Log (Security)
  await supabase.from('audit_logs').insert({
    organization_id: organization.id,
    user_id: authUser.id,
    action: 'organization_bootstrap',
    resource_type: 'organization',
    resource_id: organization.id
  });

  return NextResponse.json({
    user: { id: authUser.id, organization_id: organization.id },
    organization,
  });
}
