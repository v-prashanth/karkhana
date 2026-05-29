"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronRight, CreditCard, LogOut, ReceiptIndianRupee, ShieldCheck, UserCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils/currency";

type EmployeePortalPayload = {
  organization: { name: string } | null;
  user: { role: string; name: string | null; phone: string | null; email: string | null };
  staff: { name: string; phone: string | null; role: string | null } | null;
  attendance: { id: string; date: string; status: string }[];
  advances: { id: string; amount: number; date: string }[];
  salarySnapshot: { estimatedGross: number; advancesTotal: number; overtimeHours: number; estimatedNet: number } | null;
};

export default function EmployeePortalPage() {
  const router = useRouter();
  const { user, organization, logout, authHydrated } = useStore();

  const handleLogout = async () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    if (authHydrated && user) {
      if (user.role !== "worker" && user.role !== "viewer") {
        router.push("/home");
      }
    }
  }, [router, user, authHydrated]);

  const { data } = useQuery<EmployeePortalPayload>({
    queryKey: ["employee-portal"],
    enabled: Boolean(user) && (user?.role === "worker" || user?.role === "viewer"),
    queryFn: async () => {
      const response = await fetch("/api/employee/portal");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to load employee portal");
      return payload as EmployeePortalPayload;
    },
  });

  if (!authHydrated) {
    return (
      <main className="min-h-screen space-y-6 bg-[#040404] p-5">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </main>
    );
  }

  if (authHydrated && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#040404] p-5">
        <div className="w-full max-w-md p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#101010] to-[#060606] shadow-[6px_6px_16px_rgba(0,0,0,0.8),-3px_-3px_12px_rgba(255,255,255,0.012)] text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white uppercase italic">Connection Issue</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We couldn't load your Karkhana employee profile. This usually happens if your connection is unstable or the database is undergoing maintenance.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full h-12 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-[10px] italic hover:bg-white/90"
            >
              Retry Sync
            </Button>
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="w-full h-12 rounded-xl border-white/10 bg-transparent text-white font-medium hover:bg-white/5"
            >
              Log Out
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!user || (user.role !== "worker" && user.role !== "viewer")) {
    return null;
  }

  const attendance = data?.attendance || [];
  const salarySnapshot = data?.salarySnapshot;
  const advances = data?.advances || [];

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 px-5 py-4 backdrop-blur-2xl xl:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent/80">Employee Portal</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{user.name || data?.staff?.name || "Employee"}</h1>
            <p className="text-sm text-muted-foreground">{data?.organization?.name || organization?.name || "Karkhana workspace"}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-full glass transition-transform hover:-translate-y-0.5"
            >
              <LogOut className="h-4.5 w-4.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-5 xl:px-8">
        <Card className="glass-panel">
          <CardContent className="grid gap-3 p-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Attendance Entries</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{attendance.length}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Estimated Salary</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(salarySnapshot?.estimatedNet || 0)}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Advances Taken</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(salarySnapshot?.advancesTotal || 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="grid gap-4 p-5 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Profile</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <UserCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">{data?.staff?.name || user.name}</p>
                  <p className="text-sm text-muted-foreground">{data?.staff?.phone || user.phone || user.email || "Worker access"}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{data?.staff?.role || user.role}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-background/55 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <p className="text-sm font-semibold text-foreground">Restricted employee access</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Employees can only view their own attendance, salary details, and assigned work. Business finance and admin settings stay private.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <Card className="glass-panel">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="h-4.5 w-4.5 text-accent" />
                <p className="text-sm font-semibold text-foreground">Attendance Snapshot</p>
              </div>
              <div className="space-y-2">
                {attendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance records yet.</p>
                ) : (
                  attendance.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                      <span className="text-sm font-medium text-foreground">
                        {new Date(entry.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      <span className="text-sm capitalize text-muted-foreground">{entry.status.replace("_", " ")}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <ReceiptIndianRupee className="h-4.5 w-4.5 text-accent" />
                <p className="text-sm font-semibold text-foreground">Salary & Advances</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Estimated This Month</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(salarySnapshot?.estimatedNet || 0)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gross {formatCurrency(salarySnapshot?.estimatedGross || 0)} • Overtime {salarySnapshot?.overtimeHours || 0}h
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Salary Advances</span>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(salarySnapshot?.advancesTotal || 0)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Latest advance</span>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5" /> {advances[0] ? new Date(advances[0].date).toLocaleDateString("en-IN") : "No advances"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-panel">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Work Access</p>
              <Link href="/jobs" className="text-xs font-semibold text-accent">
                View work
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Assigned work view is coming next</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">This portal will show only your own jobs and updates</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">Planned</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="mt-5">
              <Button variant="outline" className="w-full">
                Request leave or help
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
