import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

// GET /api/targets
// Fetches all active targets for the current organization
export async function GET() {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: targets, error } = await supabase
    .from("business_targets")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(targets || []);
}

// POST /api/targets
// Creates or updates a target. Deactivates existing active targets of the same type.
export async function POST(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { target_type = "revenue", annual_amount = 0, financial_year } = body;

    // Resolve financial year from organization if not provided
    let fy = financial_year;
    if (!fy) {
      const { data: org } = await supabase
        .from("organizations")
        .select("financial_year")
        .eq("id", organizationId)
        .single();
      fy = org?.financial_year || "2026-27";
    }

    // Deactivate existing active targets of the same type
    await supabase
      .from("business_targets")
      .update({ is_active: false })
      .eq("organization_id", organizationId)
      .eq("target_type", target_type)
      .eq("is_active", true);

    // Insert new active target
    const { data: newTarget, error: insertError } = await supabase
      .from("business_targets")
      .insert({
        organization_id: organizationId,
        target_type,
        period_type: "annual",
        annual_amount: Number(annual_amount),
        financial_year: fy,
        is_active: true
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newTarget);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PATCH /api/targets
// Updates a target by ID or type
export async function PATCH(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, target_type, annual_amount, is_active } = body;

    if (!id && !target_type) {
      return NextResponse.json({ error: "Target ID or target_type is required" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (annual_amount !== undefined) updateData.annual_amount = Number(annual_amount);
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    updateData.updated_at = new Date().toISOString();

    let query = supabase.from("business_targets").update(updateData).eq("organization_id", organizationId);

    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("target_type", target_type).eq("is_active", true);
    }

    const { data: updated, error } = await query.select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated?.[0] || null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/targets
// Deletes or deactivates a target
export async function DELETE(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const targetType = searchParams.get("target_type");

    if (!id && !targetType) {
      return NextResponse.json({ error: "id or target_type parameter is required" }, { status: 400 });
    }

    let query = supabase.from("business_targets").update({ is_active: false }).eq("organization_id", organizationId);
    if (id) {
      query = query.eq("id", id);
    } else {
      query = query.eq("target_type", targetType).eq("is_active", true);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
