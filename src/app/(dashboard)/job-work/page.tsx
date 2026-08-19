"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { Plus, Clock, AlertTriangle, CheckCircle2, Package, ChevronRight, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobWorkChallan = {
  id: string;
  challan_number: string;
  challan_date: string;
  dispatch_date: string;
  expiry_date: string;
  role_type: string;
  principal_name: string;
  job_worker_name: string;
  nature_of_processing: string | null;
  total_taxable_value: number;
  status: "OPEN" | "PARTIALLY_RETURNED" | "FULLY_RETURNED" | "EXPIRED_DEEMED_SUPPLY";
  items?: Array<{ id: string; item_name: string; sent_qty: number; balance_qty: number; uom: string }>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysRemaining(expiryDateStr: string): number {
  const expiry = new Date(expiryDateStr);
  const today = new Date();
  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

function getUrgencyConfig(daysRemaining: number, status: string) {
  if (status === "FULLY_RETURNED") {
    return { label: "Returned", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", dot: "bg-green-400" };
  }
  if (status === "EXPIRED_DEEMED_SUPPLY" || daysRemaining < 0) {
    return { label: "EXPIRED", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", dot: "bg-red-400 animate-pulse" };
  }
  if (daysRemaining <= 30) {
    return { label: `${daysRemaining}d left`, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", dot: "bg-red-400 animate-pulse" };
  }
  if (daysRemaining <= 90) {
    return { label: `${daysRemaining}d left`, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "bg-amber-400" };
  }
  return { label: `${daysRemaining}d left`, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", dot: "bg-green-400" };
}

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "PARTIALLY_RETURNED", label: "Partial" },
  { id: "FULLY_RETURNED", label: "Returned" },
  { id: "EXPIRED_DEEMED_SUPPLY", label: "Expired" },
];

const ROLE_LABELS: Record<string, string> = {
  PRINCIPAL_OUTWARD: "We sent material",
  JOB_WORKER_INWARD: "We received material",
  JOB_WORKER_OUTWARD: "We returned material",
  PRINCIPAL_INWARD: "Material returned to us",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobWorkPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const organization = useStore((s) => s.organization);

  const { data: challans = [], isLoading } = useQuery<JobWorkChallan[]>({
    queryKey: ["job-work-challans", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: async () => {
      const res = await fetch("/api/job-work");
      if (!res.ok) throw new Error("Failed to load challans");
      return res.json();
    },
  });

  const filtered = challans.filter((c) => activeFilter === "all" || c.status === activeFilter);

  // Summary counts for header
  const criticalCount = challans.filter((c) => {
    const days = getDaysRemaining(c.expiry_date);
    return (days <= 30 && days >= 0) && !["FULLY_RETURNED"].includes(c.status);
  }).length;

  const openCount = challans.filter((c) => c.status === "OPEN").length;

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <PageHeader
        title="Job Work"
        subtitle="CGST Sec. 143 Compliance"
        addHref="/job-work/new"
      />

      {/* ── CGST Alert Banner ── */}
      {criticalCount > 0 && (
        <div className="mx-5 mt-3 xl:mx-8">
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/[0.06] p-4">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-400 uppercase tracking-wide italic">
                {criticalCount} challan{criticalCount !== 1 ? "s" : ""} expiring in &lt;30 days!
              </p>
              <p className="text-xs text-red-400/70 mt-0.5">
                Material not returned within 1 year becomes a deemed supply under CGST Sec. 143. Take action immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Summary Row ── */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 xl:px-8 py-4">
        <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 shrink-0">
          <Package className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-bold text-white">{openCount} Open</span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 shrink-0">
          <Timer className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-white">
            {challans.filter((c) => getDaysRemaining(c.expiry_date) <= 90 && getDaysRemaining(c.expiry_date) > 0 && c.status !== "FULLY_RETURNED").length} Due in 90d
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 shrink-0">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span className="text-xs font-bold text-white">
            {challans.filter((c) => c.status === "FULLY_RETURNED").length} Closed
          </span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 xl:px-8 pb-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              activeFilter === f.id
                ? "bg-accent text-white shadow-[0_0_16px_rgba(255,107,43,0.3)]"
                : "glass text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      <div className="flex-1 space-y-3 px-5 xl:px-8 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No challans found</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
              Create a Job Work Challan to track material sent to / received from job workers
            </p>
            <Link
              href="/job-work/new"
              className="mt-6 flex items-center gap-2 rounded-2xl bg-accent px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white italic"
            >
              <Plus className="h-4 w-4" /> New Challan
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filtered.map((challan, i) => {
              const daysRemaining = getDaysRemaining(challan.expiry_date);
              const urgency = getUrgencyConfig(daysRemaining, challan.status);
              const progressPct = Math.max(0, Math.min(100, ((365 - daysRemaining) / 365) * 100));
              const isActive = !["FULLY_RETURNED"].includes(challan.status);

              return (
                <motion.div
                  key={challan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link href={`/job-work/${challan.id}`}>
                    <Card className={cn(
                      "glass-panel overflow-hidden group transition-colors hover:bg-white/[0.03]",
                      daysRemaining <= 30 && isActive && "border-l-2 border-l-red-500",
                      daysRemaining > 30 && daysRemaining <= 90 && isActive && "border-l-2 border-l-amber-500",
                    )}>
                      <CardContent className="p-4">
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {ROLE_LABELS[challan.role_type] || challan.role_type}
                              </p>
                            </div>
                            <h3 className="font-bold text-white truncate">
                              Challan #{challan.challan_number}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {challan.role_type.startsWith("PRINCIPAL") ? challan.job_worker_name : challan.principal_name}
                              {challan.nature_of_processing ? ` — ${challan.nature_of_processing}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[10px] font-black", urgency.bg, urgency.border, urgency.color)}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", urgency.dot)} />
                              {urgency.label}
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </div>

                        {/* CGST Countdown Progress Bar */}
                        {isActive && (
                          <div className="space-y-1.5">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  daysRemaining <= 30 ? "bg-red-400" : daysRemaining <= 90 ? "bg-amber-400" : "bg-green-400"
                                )}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-muted-foreground">
                              <span>{new Date(challan.dispatch_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                Expires {new Date(challan.expiry_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Item count + Value */}
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{challan.items?.length || 0} item{(challan.items?.length || 0) !== 1 ? "s" : ""}</span>
                          {Number(challan.total_taxable_value) > 0 && (
                            <span className="font-mono">₹{Number(challan.total_taxable_value).toLocaleString("en-IN")}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </main>
  );
}
