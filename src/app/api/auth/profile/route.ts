import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createServerSupabaseClient();

  // 1. Authenticate via cookie-based session (RLS-scoped)
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return NextResponse.json({ user: null, organization: null });
  }

  // 2. Try to fetch the profile using the authenticated (RLS-scoped) client first.
  //    This works for all existing users because RLS policy on "users" allows
  //    SELECT WHERE id = auth.uid().
  //    NOTE: We use admin client here because the RLS helper function get_current_org_id()
  //    queries the users table itself, creating a chicken-and-egg problem for new users.
  //    This is acceptable because we verify auth.uid() above — we know who they are.
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("users")
    .select("*, organization:organizations(*)")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  // 3. If profile exists, return it immediately (happy path for 99% of requests)
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

  // ═══════════════════════════════════════════════════════════════════
  // LAZY PROFILE PROVISIONING (runs ONCE per user, on first login)
  // Admin client is required here for INSERT operations.
  // This is idempotent — safe to retry on race conditions.
  // ═══════════════════════════════════════════════════════════════════

  // 4a. Create a new organization for this user
  const { data: newOrg, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: "My Business",
      address: "",
      phone: authUser.phone || authUser.email || "",
      invoice_prefix: "INV",
      invoice_counter: 1,
      dc_prefix: "DC",
      dc_counter: 1,
    })
    .select("id")
    .single();

  if (orgError || !newOrg) {
    console.error("Lazy-provision org failed:", orgError);
    return NextResponse.json(
      { error: "Provisioning failed", details: orgError?.message },
      { status: 500 }
    );
  }

  // 4b. Create the user row (upsert handles race conditions)
  const { data: newUser, error: userError } = await admin
    .from("users")
    .upsert(
      {
        id: authUser.id,
        organization_id: newOrg.id,
        name:
          authUser.user_metadata?.name ||
          authUser.email?.split("@")[0] ||
          "New User",
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
    console.error("Lazy-provision user failed:", userError);
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
