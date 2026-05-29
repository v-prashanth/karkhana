import { NextResponse } from "next/server";
import { getSecureServerSession } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { user, organizationId, supabase } = await getSecureServerSession();

  if (!user || !organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("target_type") || "revenue";

    // 1. Fetch active target of this type
    const { data: targetRecord, error: targetError } = await supabase
      .from("business_targets")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("target_type", targetType)
      .eq("is_active", true)
      .maybeSingle();

    if (targetError) {
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }

    if (!targetRecord) {
      // Return null or empty structure so UI knows target isn't set yet
      return NextResponse.json({ hasTarget: false });
    }

    const annualAmount = Number(targetRecord.annual_amount || 0);
    const monthlyTarget = Number(targetRecord.monthly_amount || annualAmount / 12);

    // 2. Define Date parameters
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    
    // Start of the current month
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    
    // Days in current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysElapsed = Math.max(1, now.getDate());
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

    // Start of 6 months ago (for history and streaks)
    const sixMonthsAgoStart = new Date(currentYear, currentMonth - 5, 1);
    sixMonthsAgoStart.setHours(0, 0, 0, 0);

    // 3. Fetch transaction data from the database
    let currentActual = 0;
    const monthlyHistoryMap: Record<string, number> = {};

    // Initialize the last 6 months in map with 0
    const last6Months: { name: string; key: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = d.toLocaleString('default', { month: 'short' });
      last6Months.push({ name, key, year: d.getFullYear(), month: d.getMonth() });
      monthlyHistoryMap[key] = 0;
    }

    const isoStartDate = sixMonthsAgoStart.toISOString();

    if (targetType === "revenue") {
      // Sum of invoice totals that are not draft or cancelled
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total, date, status")
        .eq("organization_id", organizationId)
        .neq("status", "draft")
        .neq("status", "cancelled")
        .gte("date", isoStartDate.split('T')[0]);

      if (invoices) {
        invoices.forEach((inv: any) => {
          const invDate = new Date(inv.date);
          const key = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
          const amount = Number(inv.total || 0);
          if (monthlyHistoryMap[key] !== undefined) {
            monthlyHistoryMap[key] += amount;
          }
          if (invDate.getFullYear() === currentYear && invDate.getMonth() === currentMonth) {
            currentActual += amount;
          }
        });
      }
    } else if (targetType === "collections") {
      // Sum of payment amounts
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, date")
        .eq("organization_id", organizationId)
        .gte("date", isoStartDate.split('T')[0]);

      if (payments) {
        payments.forEach((pay: any) => {
          const payDate = new Date(pay.date);
          const key = `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}`;
          const amount = Number(pay.amount || 0);
          if (monthlyHistoryMap[key] !== undefined) {
            monthlyHistoryMap[key] += amount;
          }
          if (payDate.getFullYear() === currentYear && payDate.getMonth() === currentMonth) {
            currentActual += amount;
          }
        });
      }
    } else if (targetType === "production") {
      // Count of completed/delivered/invoiced jobs
      // Note: We use completed_at or created_at as fallback
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, completed_at, created_at")
        .eq("organization_id", organizationId)
        .in("status", ["completed", "delivered", "invoiced"]);

      if (orders) {
        orders.forEach((ord: any) => {
          const dateStr = ord.completed_at || ord.created_at;
          if (!dateStr) return;
          const ordDate = new Date(dateStr);
          if (ordDate >= sixMonthsAgoStart) {
            const key = `${ordDate.getFullYear()}-${String(ordDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyHistoryMap[key] !== undefined) {
              monthlyHistoryMap[key] += 1;
            }
            if (ordDate.getFullYear() === currentYear && ordDate.getMonth() === currentMonth) {
              currentActual += 1;
            }
          }
        });
      }
    }

    // 4. Format history response & compute streak
    const monthlyHistory = last6Months.map((m) => {
      const achieved = monthlyHistoryMap[m.key] || 0;
      const percentage = monthlyTarget > 0 ? Math.round((achieved / monthlyTarget) * 100) : 0;
      return {
        month: m.name,
        achieved,
        target: monthlyTarget,
        percentage
      };
    });

    // Compute active streak (consecutive months achieving target up to last month)
    // We start checking from the month before current and go backwards
    let streak = 0;
    for (let i = 1; i <= 5; i++) {
      const index = 5 - i; // 5 is current month, 4 is last month, etc.
      if (index < 0) break;
      const hist = monthlyHistory[index];
      if (hist.achieved >= hist.target && hist.target > 0) {
        streak++;
      } else {
        break; // Streak broken
      }
    }

    // Also include current month in streak if we have already achieved the target
    if (currentActual >= monthlyTarget && monthlyTarget > 0) {
      streak++;
    }

    // Run-rate projection
    const projected = daysElapsed > 0 ? (currentActual / daysElapsed) * daysInMonth : 0;
    const percentage = monthlyTarget > 0 ? Math.round((currentActual / monthlyTarget) * 100) : 0;

    return NextResponse.json({
      hasTarget: true,
      targetType,
      annualAmount,
      monthlyTarget,
      current: currentActual,
      target: monthlyTarget,
      percentage,
      projected: Math.round(projected),
      daysElapsed,
      daysRemaining,
      streak,
      monthlyHistory
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
