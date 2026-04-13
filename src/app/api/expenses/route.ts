import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's organization from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "No organization linked" }, { status: 403 });
  }

  const organizationId = profile.organization_id;
  const { searchParams } = new URL(request.url);
  const includeCategories = searchParams.get("includeCategories") === "true";
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  if (includeCategories) {
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .eq("organization_id", organizationId)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data);
  }

  let query = supabase
    .from("expenses")
    .select("*, category:expense_categories(id, name, icon), contact:contacts(id, name)")
    .eq("organization_id", organizationId)
    .order("date", { ascending: false });

  if (month && year) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = Number(month) === 12 ? 1 : Number(month) + 1;
    const nextYear = Number(month) === 12 ? Number(year) + 1 : Number(year);
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    query = query.gte("date", startDate).lt("date", endDate);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ error: "No organization linked" }, { status: 403 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      organization_id: profile.organization_id,
      category_id: body.category_id || null,
      contact_id: body.contact_id || null,
      amount: body.amount,
      description: body.description,
      date: body.date,
      method: body.method || "cash",
      reference_number: body.reference_number || null,
      receipt_url: body.receipt_url || null,
      is_recurring: body.is_recurring ?? false,
      recurring_period: body.recurring_period || null,
      notes: body.notes || null,
    })
    .select("*, category:expense_categories(id, name, icon), contact:contacts(id, name)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
