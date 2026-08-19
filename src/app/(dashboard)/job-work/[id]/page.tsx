"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Loader2,
  Save,
  Timer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobWorkItem = {
  id: string;
  item_name: string;
  description: string | null;
  hsn_code: string | null;
  uom: string;
  sent_qty: number;
  returned_qty: number;
  scrap_qty: number;
  balance_qty: number;
  unit_taxable_value: number;
  total_taxable_value: number;
};

type JobWorkChallan = {
  id: string;
  challan_number: string;
  challan_date: string;
  dispatch_date: string;
  expiry_date: string;
  role_type: string;
  principal_name: string;
  principal_gstin: string | null;
  principal_address: string | null;
  job_worker_name: string;
  job_worker_gstin: string | null;
  job_worker_address: string | null;
  nature_of_processing: string | null;
  eway_bill_number: string | null;
  transport_mode: string | null;
  vehicle_number: string | null;
  total_taxable_value: number;
  status: string;
  notes: string | null;
  items: JobWorkItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  OPEN: { label: "Open", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  PARTIALLY_RETURNED: { label: "Partially Returned", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  FULLY_RETURNED: { label: "Fully Returned", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  EXPIRED_DEEMED_SUPPLY: { label: "Expired — Deemed Supply", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

const ROLE_LABELS: Record<string, string> = {
  PRINCIPAL_OUTWARD: "Principal sent material to Job Worker",
  JOB_WORKER_INWARD: "Job Worker received material from Principal",
  JOB_WORKER_OUTWARD: "Job Worker returned material to Principal",
  PRINCIPAL_INWARD: "Principal received material back from Job Worker",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobWorkDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [itemUpdates, setItemUpdates] = useState<Record<string, { returned_qty: number; scrap_qty: number }>>({});
  const [isReconciling, setIsReconciling] = useState(false);

  const { data: challan, isLoading } = useQuery<JobWorkChallan>({
    queryKey: ["job-work-challan", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/job-work/${params.id}`);
      if (!res.ok) throw new Error("Challan not found");
      return res.json();
    },
  });

  // Pre-fill quantity fields when challan data loads
  useEffect(() => {
    if (challan?.items) {
      const defaults: Record<string, { returned_qty: number; scrap_qty: number }> = {};
      challan.items.forEach((item) => {
        defaults[item.id] = { returned_qty: item.returned_qty || 0, scrap_qty: item.scrap_qty || 0 };
      });
      setItemUpdates(defaults);
    }
  }, [challan]);

  const saveReconciliation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(itemUpdates).map(([id, vals]) => ({ id, ...vals }));
      const res = await fetch(`/api/job-work/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_updates: updates }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["job-work-challan", params.id], data);
      queryClient.invalidateQueries({ queryKey: ["job-work-challans"] });
      setIsReconciling(false);
      toast("Reconciliation saved!", "success");
    },
    onError: () => toast("Failed to save", "error"),
  });

  // ─── Loading / Not found ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </main>
    );
  }

  if (!challan) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="font-bold text-white uppercase tracking-widest text-sm">Challan Not Found</p>
        <Link href="/job-work" className="text-accent text-sm underline">Back to Job Work</Link>
      </main>
    );
  }

  const statusCfg = STATUS_LABELS[challan.status] || STATUS_LABELS.OPEN;
  const daysRemaining = Math.ceil((new Date(challan.expiry_date).getTime() - Date.now()) / 86400000);
  const progressPct = Math.max(0, Math.min(100, ((365 - daysRemaining) / 365) * 100));
  const isExpired = daysRemaining < 0;
  const isClosed = challan.status === "FULLY_RETURNED";

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-background/80 backdrop-blur-3xl px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/job-work")}
            className="flex h-10 w-10 items-center justify-center rounded-2xl glass hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#555] italic">Job Work Challan</p>
            <h1 className="text-base font-black text-white uppercase italic">#{challan.challan_number}</h1>
          </div>
          <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border", statusCfg.color, statusCfg.bg, statusCfg.border)}>
            {statusCfg.label}
          </span>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-5 xl:p-8 max-w-3xl xl:mx-auto">

        {/* ── CGST Countdown ── */}
        {!isClosed && (
          <Card className={cn("glass-panel", isExpired ? "border-red-500/30" : daysRemaining <= 30 ? "border-orange-500/30" : "")}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Timer className={cn("h-4 w-4", isExpired ? "text-red-400" : daysRemaining <= 30 ? "text-orange-400" : daysRemaining <= 90 ? "text-amber-400" : "text-green-400")} />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#666]">CGST Sec. 143 Countdown</p>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className={cn("h-full rounded-full transition-all", isExpired ? "bg-red-500 w-full" : daysRemaining <= 30 ? "bg-red-400" : daysRemaining <= 90 ? "bg-amber-400" : "bg-green-400")}
                  style={!isExpired ? { width: `${progressPct}%` } : undefined}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Dispatched: {new Date(challan.dispatch_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
                <span className={cn("font-black", isExpired ? "text-red-400" : daysRemaining <= 30 ? "text-orange-400" : "text-muted-foreground")}>
                  {isExpired ? `Expired ${Math.abs(daysRemaining)}d ago!` : `${daysRemaining} days remaining`}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Expires:</span>
                <span className={cn("font-bold", isExpired ? "text-red-400" : "text-white")}>
                  {new Date(challan.expiry_date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>
              {isExpired && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-xs font-bold text-red-400">
                    ⚠ This material is now a <strong>Deemed Supply</strong> under CGST Sec. 143. GST + interest may apply. Consult your CA immediately.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Parties ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#666]">{ROLE_LABELS[challan.role_type] || challan.role_type}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Principal</p>
                <p className="text-sm font-bold text-white">{challan.principal_name}</p>
                {challan.principal_gstin && <p className="text-xs text-muted-foreground font-mono">{challan.principal_gstin}</p>}
                {challan.principal_address && <p className="text-xs text-muted-foreground">{challan.principal_address}</p>}
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Job Worker</p>
                <p className="text-sm font-bold text-white">{challan.job_worker_name}</p>
                {challan.job_worker_gstin && <p className="text-xs text-muted-foreground font-mono">{challan.job_worker_gstin}</p>}
                {challan.job_worker_address && <p className="text-xs text-muted-foreground">{challan.job_worker_address}</p>}
              </div>
            </div>
            {challan.nature_of_processing && (
              <div className="rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Processing</p>
                <p className="text-sm text-white mt-0.5">{challan.nature_of_processing}</p>
              </div>
            )}
            {(challan.transport_mode || challan.vehicle_number) && (
              <div className="flex gap-4 text-xs text-muted-foreground">
                {challan.transport_mode && <span>Transport: {challan.transport_mode}</span>}
                {challan.vehicle_number && <span>Vehicle: {challan.vehicle_number}</span>}
                {challan.eway_bill_number && <span>E-Way: {challan.eway_bill_number}</span>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Material Reconciliation Table ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#666]">Materials — Reconciliation</p>
              </div>
              {!isClosed && (
                <button
                  type="button"
                  onClick={() => setIsReconciling(!isReconciling)}
                  className="text-[10px] text-accent uppercase tracking-widest font-black hover:underline"
                >
                  {isReconciling ? "Cancel" : "Update Returns"}
                </button>
              )}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_56px_56px_56px_56px] gap-2 text-[9px] font-black uppercase tracking-widest text-[#555] px-1">
              <span>Item</span>
              <span className="text-right">Sent</span>
              <span className="text-right">Returned</span>
              <span className="text-right">Scrap</span>
              <span className="text-right">Balance</span>
            </div>

            <div className="space-y-2">
              {challan.items.map((item) => {
                const update = itemUpdates[item.id] || { returned_qty: item.returned_qty, scrap_qty: item.scrap_qty };
                const balance = item.sent_qty - update.returned_qty - update.scrap_qty;
                const isFullyReturned = balance <= 0;

                return (
                  <div key={item.id} className={cn("rounded-xl border px-3 py-2.5 space-y-2", isFullyReturned ? "border-green-500/20 bg-green-500/[0.03]" : "border-white/5 bg-white/[0.02]")}>
                    <div className="grid grid-cols-[1fr_56px_56px_56px_56px] gap-2 items-center">
                      <div>
                        <p className="text-sm font-bold text-white">{item.item_name}</p>
                        {item.hsn_code && <p className="text-[10px] text-muted-foreground">HSN: {item.hsn_code}</p>}
                      </div>
                      <p className="text-sm font-mono text-white text-right">{item.sent_qty}</p>
                      {isReconciling ? (
                        <input
                          type="number"
                          min={0}
                          max={item.sent_qty}
                          step="0.001"
                          value={update.returned_qty}
                          onChange={(e) => setItemUpdates((prev) => ({ ...prev, [item.id]: { ...update, returned_qty: Number(e.target.value) } }))}
                          className="rounded-lg border border-white/10 bg-background/60 px-1 py-1 text-xs text-white text-right outline-none focus:border-accent w-full"
                        />
                      ) : (
                        <p className="text-sm font-mono text-green-400 text-right">{item.returned_qty}</p>
                      )}
                      {isReconciling ? (
                        <input
                          type="number"
                          min={0}
                          max={item.sent_qty}
                          step="0.001"
                          value={update.scrap_qty}
                          onChange={(e) => setItemUpdates((prev) => ({ ...prev, [item.id]: { ...update, scrap_qty: Number(e.target.value) } }))}
                          className="rounded-lg border border-white/10 bg-background/60 px-1 py-1 text-xs text-white text-right outline-none focus:border-accent w-full"
                        />
                      ) : (
                        <p className="text-sm font-mono text-amber-400 text-right">{item.scrap_qty}</p>
                      )}
                      <p className={cn("text-sm font-mono font-black text-right", isFullyReturned ? "text-green-400" : balance > 0 ? "text-red-400" : "text-white")}>
                        {isReconciling ? (balance).toFixed(3) : item.balance_qty}
                      </p>
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>{item.uom}</span>
                      {isFullyReturned && (
                        <span className="flex items-center gap-1 text-green-400 font-bold">
                          <CheckCircle2 className="h-3 w-3" /> Fully returned
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Balance Summary */}
            <div className="border-t border-white/5 pt-3 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">Total Outstanding Balance</p>
              <p className={cn("font-black text-sm font-mono", challan.items.every((i) => i.balance_qty <= 0) ? "text-green-400" : "text-red-400")}>
                {challan.items.reduce((sum, i) => sum + Number(i.balance_qty || 0), 0).toFixed(3)} units
              </p>
            </div>

            {isReconciling && (
              <Button
                onClick={() => saveReconciliation.mutate()}
                disabled={saveReconciliation.isPending}
                className="w-full h-11 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-[10px] italic"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveReconciliation.isPending ? "Saving..." : "Save Reconciliation"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Notes ── */}
        {challan.notes && (
          <Card className="glass-panel">
            <CardContent className="p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#666] mb-2">Notes</p>
              <p className="text-sm text-white/70 leading-relaxed">{challan.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Total Value */}
        {Number(challan.total_taxable_value) > 0 && (
          <div className="flex justify-between items-center rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Taxable Value</p>
            <p className="text-lg font-black text-white font-mono">
              ₹{Number(challan.total_taxable_value).toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </motion.div>
    </main>
  );
}
