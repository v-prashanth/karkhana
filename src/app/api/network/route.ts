import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET() {
  const { user, supabase } = await getSecureServerSession();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch Network Payables
  const { data: payables, error: payError } = await supabase.rpc("get_network_payables", {
    p_user_id: user.id
  });

  if (payError) {
    console.error("Network Payables Error:", payError);
    return NextResponse.json({ error: "Failed to load network payables" }, { status: 500 });
  }

  // Fetch Network Incoming Goods
  const { data: incomingGoods, error: goodsError } = await supabase.rpc("get_network_incoming_goods", {
    p_user_id: user.id
  });

  if (goodsError) {
    console.error("Network Goods Error:", goodsError);
    return NextResponse.json({ error: "Failed to load network goods" }, { status: 500 });
  }

  // Compute unique vendors safely. The RPC might return null instead of empty array if nothing found.
  const parsedPayables = payables || [];
  const parsedGoods = incomingGoods || [];

  const vendorsMap = new Map();
  
  interface NetworkResource {
    organization?: { id: string; name: string };
    amount_due?: number;
  }

  parsedPayables.forEach((p: NetworkResource) => {
    if (p.organization) vendorsMap.set(p.organization.id, p.organization);
  });
  
  parsedGoods.forEach((g: NetworkResource) => {
    if (g.organization) vendorsMap.set(g.organization.id, g.organization);
  });

  const totalPayableAmount = (parsedPayables as NetworkResource[]).reduce((sum: number, inv) => sum + Number(inv.amount_due || 0), 0);

  return NextResponse.json({
    payables: parsedPayables,
    incomingGoods: parsedGoods,
    vendors: Array.from(vendorsMap.values()),
    stats: {
      totalPayable: totalPayableAmount,
      totalIncomingShipments: parsedGoods.length,
      activeVendors: vendorsMap.size
    }
  });
}
