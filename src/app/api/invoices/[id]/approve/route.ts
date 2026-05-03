import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, organizationId, role, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owners can approve invoices
  if (role !== "owner") {
    return NextResponse.json({ error: "Forbidden: Only owners can approve documents." }, { status: 403 });
  }

  // 1. Verify invoice exists and is pending
  const { data: existingInvoice, error: fetchError } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("id", params.id)
    .single();

  if (fetchError || !existingInvoice) {
    return NextResponse.json({ error: fetchError?.message ?? "Invoice not found" }, { status: 404 });
  }

  if (existingInvoice.status !== "pending_approval") {
    return NextResponse.json({ error: "Invoice is not pending approval" }, { status: 400 });
  }

  // 2. Update status
  const { data: updatedInvoice, error: updateError } = await supabase
    .from("invoices")
    .update({ status: "sent" })
    .eq("organization_id", organizationId)
    .eq("id", params.id)
    .select("*")
    .single();

  if (updateError || !updatedInvoice) {
    return NextResponse.json({ error: updateError?.message ?? "Failed to approve" }, { status: 500 });
  }

  // 3. Log Audit
  await supabase.from("audit_logs").insert({
    organization_id: organizationId,
    entity_type: "invoices",
    entity_id: params.id,
    action_type: "APPROVED",
    performed_by: user.id,
    metadata: { previous_status: "pending_approval", new_status: "sent" }
  });

  return NextResponse.json(updatedInvoice);
}
