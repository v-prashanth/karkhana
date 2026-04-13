import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");

  let query = supabase
    .from("attendance")
    .select("*, staff:staff(*)")
    .eq("organization_id", organizationId)
    .order("date", { ascending: false });

  if (staffId) {
    query = query.eq("staff_id", staffId);
  }

  const { data, error } = await query.limit(31);
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

  if (!body.staff_id) {
    return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
  }

  const payload = {
    organization_id: organizationId,
    staff_id: body.staff_id,
    date: body.date || new Date().toISOString().split("T")[0],
    status: body.status || "present",
    overtime_hours: body.overtime_hours ?? 0,
    notes: body.notes || null,
  };

  const { data, error } = await supabase
    .from("attendance")
    .upsert(payload, { onConflict: "staff_id,date" })
    .select("*, staff:staff(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
