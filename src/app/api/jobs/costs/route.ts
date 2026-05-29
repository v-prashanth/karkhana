import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

// GET /api/jobs/costs
// Fetches itemized costs for a specific job/order or all costs
export async function GET(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    let query = supabase
      .from("order_costs")
      .select("*, staff:staff_id(name), supplier:supplier_id(name), order:order_id(description, order_number)")
      .eq("organization_id", organizationId);

    if (orderId) {
      query = query.eq("order_id", orderId);
    }

    const { data: costs, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(costs || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST /api/jobs/costs
// Adds a new itemized cost to an order
export async function POST(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { order_id, cost_category, description, amount, staff_id, supplier_id } = body;

    if (!order_id || !cost_category || !description || amount === undefined) {
      return NextResponse.json({ error: "order_id, cost_category, description, and amount are required" }, { status: 400 });
    }

    const { data: newCost, error: insertError } = await supabase
      .from("order_costs")
      .insert({
        organization_id: organizationId,
        order_id,
        cost_category,
        description,
        amount: Number(amount),
        staff_id: staff_id || null,
        supplier_id: supplier_id || null
      })
      .select("*, staff:staff_id(name), supplier:supplier_id(name)")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Auto-create outstanding payment/payable if this is an outsourced cost with a linked supplier
    if (cost_category === "outsourcing" && supplier_id && Number(amount) > 0) {
      try {
        // Auto log an expense record representing this subcontractor cost
        // This ensures the costs also sync nicely into the overall expenses view
        await supabase
          .from("expenses")
          .insert({
            organization_id: organizationId,
            contact_id: supplier_id,
            amount: Number(amount),
            description: `Outsourced job cost: ${description}`,
            date: new Date().toISOString().split('T')[0],
            method: "other",
            notes: `Auto-linked from job costing (Order ID: ${order_id})`
          });
      } catch (err) {
        console.error("Failed to auto-create linked expense/payable:", err);
      }
    }

    return NextResponse.json(newCost);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PATCH /api/jobs/costs
// Updates a cost item
export async function PATCH(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, cost_category, description, amount, staff_id, supplier_id } = body;

    if (!id) {
      return NextResponse.json({ error: "Cost ID is required" }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (cost_category !== undefined) updateData.cost_category = cost_category;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (staff_id !== undefined) updateData.staff_id = staff_id || null;
    if (supplier_id !== undefined) updateData.supplier_id = supplier_id || null;
    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("order_costs")
      .update(updateData)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select("*, staff:staff_id(name), supplier:supplier_id(name)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/jobs/costs
// Deletes a cost item
export async function DELETE(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Cost ID parameter is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("order_costs")
      .delete()
      .eq("id", id)
      .eq("organization_id", organizationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
