import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("job_work_challans")
    .select("*, items:job_work_items(id, item_name, sent_qty, returned_qty, scrap_qty, balance_qty, uom)")
    .eq("organization_id", organizationId)
    .order("dispatch_date", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Validate required fields
  if (!body.challan_number || !body.role_type || !body.principal_name || !body.job_worker_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const dispatchDate = body.dispatch_date || new Date().toISOString().split("T")[0];
  const expiryDate = new Date(dispatchDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const { data: challan, error: challanError } = await supabase
    .from("job_work_challans")
    .insert({
      organization_id: organizationId,
      contact_id: body.contact_id || null,
      order_id: body.order_id || null,
      challan_number: body.challan_number,
      challan_date: body.challan_date || dispatchDate,
      role_type: body.role_type,
      principal_name: body.principal_name,
      principal_gstin: body.principal_gstin || null,
      principal_address: body.principal_address || null,
      job_worker_name: body.job_worker_name,
      job_worker_gstin: body.job_worker_gstin || null,
      job_worker_address: body.job_worker_address || null,
      nature_of_processing: body.nature_of_processing || null,
      eway_bill_number: body.eway_bill_number || null,
      transport_mode: body.transport_mode || null,
      vehicle_number: body.vehicle_number || null,
      dispatch_date: dispatchDate,
      expiry_date: expiryDate.toISOString().split("T")[0],
      total_taxable_value: body.total_taxable_value || 0,
      status: "OPEN",
      notes: body.notes || null,
    })
    .select("*")
    .single();

  if (challanError || !challan) {
    return NextResponse.json(
      { error: challanError?.message || "Failed to create challan" },
      { status: 400 }
    );
  }

  // Insert line items
  if (body.items && Array.isArray(body.items) && body.items.length > 0) {
    const items = body.items.map(
      (item: {
        item_name: string;
        description?: string;
        hsn_code?: string;
        uom?: string;
        sent_qty: number;
        unit_taxable_value?: number;
        total_taxable_value?: number;
      }) => ({
        challan_id: challan.id,
        item_name: item.item_name,
        description: item.description || null,
        hsn_code: item.hsn_code || null,
        uom: item.uom || "Nos",
        sent_qty: item.sent_qty || 0,
        returned_qty: 0,
        scrap_qty: 0,
        unit_taxable_value: item.unit_taxable_value || 0,
        total_taxable_value: item.total_taxable_value || 0,
      })
    );

    const { error: itemsError } = await supabase.from("job_work_items").insert(items);
    if (itemsError) {
      // Challan created but items failed — return partial success
      return NextResponse.json(
        { ...challan, warning: "Challan created but items failed: " + itemsError.message },
        { status: 207 }
      );
    }
  }

  return NextResponse.json(challan, { status: 201 });
}
