import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("joined_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("staff")
    .insert({
      organization_id: organizationId,
      name: body.name,
      phone: body.phone || null,
      role: body.role || null,
      pay_type: body.pay_type || "daily",
      pay_rate: body.pay_rate ?? 0,
      is_active: true,
      joined_at: body.joined_at || new Date().toISOString().split("T")[0],
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
