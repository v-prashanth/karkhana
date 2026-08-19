import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: challan, error } = await supabase
    .from("job_work_challans")
    .select("*, items:job_work_items(*)")
    .eq("id", params.id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !challan) {
    return NextResponse.json({ error: "Challan not found" }, { status: 404 });
  }

  return NextResponse.json(challan);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Handle item quantity updates (reconciliation)
  if (body.item_updates && Array.isArray(body.item_updates)) {
    for (const update of body.item_updates as Array<{
      id: string;
      returned_qty?: number;
      scrap_qty?: number;
    }>) {
      await supabase
        .from("job_work_items")
        .update({
          returned_qty: update.returned_qty ?? undefined,
          scrap_qty: update.scrap_qty ?? undefined,
        })
        .eq("id", update.id);
    }
  }

  // Determine new status from balance
  let newStatus: string | undefined = body.status;

  if (!newStatus && body.item_updates) {
    // Recalculate based on items
    const { data: items } = await supabase
      .from("job_work_items")
      .select("sent_qty, returned_qty, scrap_qty, balance_qty")
      .eq("challan_id", params.id);

    if (items && items.length > 0) {
      const totalBalance = items.reduce((sum, i) => sum + Number(i.balance_qty || 0), 0);
      const totalSent = items.reduce((sum, i) => sum + Number(i.sent_qty || 0), 0);
      const totalReturned = items.reduce((sum, i) => sum + Number((i.returned_qty || 0)) + Number((i.scrap_qty || 0)), 0);

      if (totalBalance <= 0) {
        newStatus = "FULLY_RETURNED";
      } else if (totalReturned > 0 && totalReturned < totalSent) {
        newStatus = "PARTIALLY_RETURNED";
      }
    }
  }

  // Update challan status
  const updateFields: Record<string, unknown> = {};
  if (newStatus) updateFields.status = newStatus;
  if (body.notes !== undefined) updateFields.notes = body.notes;

  if (Object.keys(updateFields).length > 0) {
    await supabase
      .from("job_work_challans")
      .update(updateFields)
      .eq("id", params.id)
      .eq("organization_id", organizationId);
  }

  // Return updated challan
  const { data: updated, error } = await supabase
    .from("job_work_challans")
    .select("*, items:job_work_items(*)")
    .eq("id", params.id)
    .eq("organization_id", organizationId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(updated);
}
