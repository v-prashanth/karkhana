import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ user: null, organization: null });
  }

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("*, organization:organizations(*)")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (profile) {
    return NextResponse.json({
      user: {
        id: profile.id,
        organization_id: profile.organization_id,
        name: profile.name,
        phone: profile.phone,
        email: profile.email || authUser.email || null,
        role: profile.role,
        avatar_url: profile.avatar_url || null,
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
      organization: Array.isArray(profile.organization)
        ? profile.organization[0] || null
        : profile.organization || null,
    });
  }

  const now = new Date();
  const financialYearStart = now.getMonth() >= 3
    ? `${now.getFullYear()}-04-01`
    : `${now.getFullYear() - 1}-04-01`;

  const { data: newOrg, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: "My Business",
      owner_name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "New User",
      address: "",
      phone: authUser.phone || `email-${authUser.id.slice(0, 8)}`,
      financial_year_start: financialYearStart,
      dc_prefix: "DC",
      dc_counter: 1,
      bill_prefix: "INV",
      bill_counter: 1,
    })
    .select("id")
    .single();

  if (orgError || !newOrg) {
    console.error("Organization provisioning failed:", orgError);
    return NextResponse.json(
      { error: "Provisioning failed", details: orgError?.message },
      { status: 500 }
    );
  }

  const { data: newUser, error: userError } = await admin
    .from("users")
    .upsert(
      {
        id: authUser.id,
        organization_id: newOrg.id,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "New User",
        phone: authUser.phone || `unverified-${authUser.id}`,
        email: authUser.email || null,
        role: "owner",
        is_active: true,
      },
      { onConflict: "id" }
    )
    .select("*, organization:organizations(*)")
    .single();

  if (userError || !newUser) {
    console.error("User provisioning failed:", userError);
    return NextResponse.json(
      { error: "User provisioning failed", details: userError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    user: {
      id: newUser.id,
      organization_id: newUser.organization_id,
      name: newUser.name,
      phone: newUser.phone,
      email: authUser.email || null,
      role: newUser.role,
      avatar_url: null,
      is_active: true,
      created_at: newUser.created_at,
      updated_at: newUser.created_at,
    },
    organization: Array.isArray(newUser.organization)
      ? newUser.organization[0] || null
      : newUser.organization || null,
  });
}

export async function PATCH(req: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await req.json();
    const admin = createAdminClient();

    const { data: updatedUser, error } = await admin
      .from("users")
      .update({
        name: updates.name,
        phone: updates.phone,
        email: updates.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authUser.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updatedUser);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
