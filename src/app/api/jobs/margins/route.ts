import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";
import type { JobMarginSummary } from "@/types/database";

export async function GET() {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch all orders with contact name
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, description, order_number, status, estimated_cost, created_at, contact:contacts(name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    // 2. Fetch all costs for the organization
    const { data: costs, error: costsError } = await supabase
      .from("order_costs")
      .select("order_id, cost_category, amount")
      .eq("organization_id", organizationId);

    if (costsError) {
      return NextResponse.json({ error: costsError.message }, { status: 500 });
    }

    // 3. Aggregate costs by order in memory
    const costMap: Record<string, { material: number; labor: number; outsourcing: number; other: number; total: number }> = {};

    costs?.forEach((cost: any) => {
      const orderId = cost.order_id;
      const category = cost.cost_category;
      const amount = Number(cost.amount || 0);

      if (!costMap[orderId]) {
        costMap[orderId] = { material: 0, labor: 0, outsourcing: 0, other: 0, total: 0 };
      }

      if (category === "material") costMap[orderId].material += amount;
      else if (category === "labor") costMap[orderId].labor += amount;
      else if (category === "outsourcing") costMap[orderId].outsourcing += amount;
      else costMap[orderId].other += amount;

      costMap[orderId].total += amount;
    });

    // 4. Map into JobMarginSummary structures
    const summaries: JobMarginSummary[] = (orders || []).map((order: any) => {
      const c = costMap[order.id] || { material: 0, labor: 0, outsourcing: 0, other: 0, total: 0 };
      const sellingPrice = Number(order.estimated_cost || 0);
      const totalCost = c.total;
      const profit = sellingPrice - totalCost;
      const marginPercentage = sellingPrice > 0 ? Math.round((profit / sellingPrice) * 100) : 0;

      // Extract client name safely
      let clientName = "No client";
      if (order.contact) {
        if (Array.isArray(order.contact)) {
          clientName = order.contact[0]?.name || "No client";
        } else if (typeof order.contact === "object" && "name" in order.contact) {
          clientName = (order.contact as any).name || "No client";
        }
      }

      return {
        orderId: order.id,
        description: order.description || "Untitled Job",
        orderNumber: order.order_number,
        clientName,
        status: order.status,
        sellingPrice,
        materialCost: c.material,
        laborCost: c.labor,
        outsourcingCost: c.outsourcing,
        otherCost: c.other,
        totalCost,
        profit,
        marginPercentage,
        created_at: order.created_at
      };
    });

    // Compute global metrics
    const totalRevenue = summaries.reduce((sum, s) => sum + s.sellingPrice, 0);
    const totalCosts = summaries.reduce((sum, s) => sum + s.totalCost, 0);
    const totalProfit = totalRevenue - totalCosts;
    const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    const materialTotal = summaries.reduce((sum, s) => sum + s.materialCost, 0);
    const laborTotal = summaries.reduce((sum, s) => sum + s.laborCost, 0);
    const outsourcingTotal = summaries.reduce((sum, s) => sum + s.outsourcingCost, 0);
    const otherTotal = summaries.reduce((sum, s) => sum + s.otherCost, 0);

    return NextResponse.json({
      summaries,
      metrics: {
        totalRevenue,
        totalCosts,
        totalProfit,
        averageMarginPercentage: avgMargin,
        materialTotal,
        laborTotal,
        outsourcingTotal,
        otherTotal
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
