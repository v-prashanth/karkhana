import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET() {
  const { user: authUser, organizationId, supabase } = await getSecureServerSession();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the user's profile row
  const { data: appUser, error: userError } = await supabase
    .from("profiles")
    .select("*, organization:organizations(*)")
    .eq("id", authUser.id)
    .maybeSingle();

  if (userError || !appUser) {
    return NextResponse.json({ error: userError?.message ?? "User profile not found" }, { status: 400 });
  }

  const organization = Array.isArray(appUser.organization) ? appUser.organization[0] : appUser.organization;

  if (!organizationId) {
    return NextResponse.json({ error: "No organization linked" }, { status: 403 });
  }

  const staffPhone = appUser.phone || authUser.phone || null;
  const staffEmail = appUser.email || authUser.email || null;

  let staffQuery = supabase.from("staff").select("*").eq("organization_id", organizationId).eq("is_active", true);
  if (staffPhone) {
    staffQuery = staffQuery.eq("phone", staffPhone);
  } else if (staffEmail) {
    staffQuery = staffQuery.eq("phone", staffEmail);
  }

  const { data: staffRecord, error: staffError } = await staffQuery.maybeSingle();
  if (staffError || !staffRecord) {
    return NextResponse.json({
      organization,
      user: appUser,
      staff: null,
      attendance: [],
      advances: [],
      salarySnapshot: null,
    });
  }

  const [attendanceRes, advancesRes] = await Promise.all([
    supabase.from("attendance").select("*").eq("staff_id", staffRecord.id).order("date", { ascending: false }).limit(7),
    supabase.from("salary_advances").select("*").eq("staff_id", staffRecord.id).order("date", { ascending: false }).limit(5),
  ]);

  const attendance = attendanceRes.data || [];
  const advances = advancesRes.data || [];
  const workingDays = attendance.filter((entry) => entry.status === "present" || entry.status === "overtime").length;
  const halfDays = attendance.filter((entry) => entry.status === "half_day").length;
  const overtimeHours = attendance.reduce((sum, entry) => sum + Number(entry.overtime_hours || 0), 0);
  const advancesTotal = advances.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const estimatedGross =
    staffRecord.pay_type === "monthly"
      ? Number(staffRecord.pay_rate || 0)
      : workingDays * Number(staffRecord.pay_rate || 0) + halfDays * Number(staffRecord.pay_rate || 0) * 0.5;

  return NextResponse.json({
    organization,
    user: appUser,
    staff: staffRecord,
    attendance,
    advances,
    salarySnapshot: {
      estimatedGross,
      advancesTotal,
      overtimeHours,
      estimatedNet: estimatedGross - advancesTotal,
    },
  });
}

