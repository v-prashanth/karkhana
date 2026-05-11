import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

/**
 * PATCH /api/staff/:id — Update a staff member
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const staffId = params.id;

  // Only allow updating specific fields (whitelist)
  const allowedFields: Record<string, unknown> = {};
  const whitelist = ["name", "phone", "role", "pay_type", "pay_rate", "is_active", "joined_at"];
  for (const key of whitelist) {
    if (body[key] !== undefined) {
      allowedFields[key] = body[key];
    }
  }

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Verify the staff member belongs to this organization
  const { data: existing, error: fetchError } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("staff")
    .update(allowedFields)
    .eq("id", staffId)
    .eq("organization_id", organizationId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/staff/:id — Hard delete a staff member (only if no attendance records)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staffId = params.id;

  // Verify the staff member belongs to this organization
  const { data: existing, error: fetchError } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("organization_id", organizationId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }

  // Check if staff has attendance records — if so, soft-delete instead
  const { count } = await supabase
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .eq("staff_id", staffId);

  if (count && count > 0) {
    // Soft-delete: set is_active = false
    const { error: deactivateError } = await supabase
      .from("staff")
      .update({ is_active: false })
      .eq("id", staffId)
      .eq("organization_id", organizationId);

    if (deactivateError) {
      return NextResponse.json({ error: deactivateError.message }, { status: 400 });
    }

    return NextResponse.json({ deactivated: true, message: "Staff has attendance records and was deactivated instead of deleted." });
  }

  // Hard delete if no attendance records
  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", staffId)
    .eq("organization_id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ deleted: true });
}
