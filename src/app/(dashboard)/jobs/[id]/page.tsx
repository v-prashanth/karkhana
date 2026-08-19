"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Truck,
  FileText,
  Package,
  AlertTriangle,
  ChevronRight,
  IndianRupee,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  PlayCircle,
  CheckCheck,
  PackageCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { getBusinessTemplate } from "@/lib/config/templates";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobDetail = {
  id: string;
  description: string;
  status: string;
  priority: string;
  quantity: number | null;
  quantity_unit: string | null;
  quantity_completed: number;
  material: string | null;
  reference_number: string | null;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  contact?: { id: string; name: string; phone?: string; email?: string; address?: string } | null;
  inward_dcs: Array<{ id: string; document_number: string; date: string; notes: string | null; status: string }>;
  outward_dcs: Array<{ id: string; document_number: string; date: string; notes: string | null; status: string }>;
  invoices: Array<{ id: string; invoice_number: string; total_amount: number; status: string; created_at: string }>;
};

// ─── Status Config ────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  received:    { label: "Received",    color: "text-blue-400",          bg: "bg-blue-500/10",    border: "border-blue-500/30" },
  in_progress: { label: "In Progress", color: "text-amber-400",         bg: "bg-amber-500/10",   border: "border-amber-500/30" },
  completed:   { label: "Completed",   color: "text-green-400",         bg: "bg-green-500/10",   border: "border-green-500/30" },
  delivered:   { label: "Delivered",   color: "text-purple-400",        bg: "bg-purple-500/10",  border: "border-purple-500/30" },
  invoiced:    { label: "Invoiced",    color: "text-muted-foreground",  bg: "bg-white/5",        border: "border-white/10" },
  cancelled:   { label: "Cancelled",  color: "text-red-400",           bg: "bg-red-500/10",     border: "border-red-500/30" },
};

const statusFlow: Record<string, { next: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  received:    { next: "in_progress", label: "Start Work",        icon: PlayCircle },
  in_progress: { next: "completed",   label: "Mark Completed",    icon: CheckCheck },
  completed:   { next: "delivered",   label: "Mark Delivered",    icon: PackageCheck },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const organization = useStore((s) => s.organization);
  const template = getBusinessTemplate(organization?.business_type);

  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editQtyCompleted, setEditQtyCompleted] = useState(0);

  // ─── Fetch job detail ────────────────────────────────────────────────────
  const { data: job, isLoading } = useQuery<JobDetail>({
    queryKey: ["job-detail", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${params.id}`);
      if (!res.ok) throw new Error("Job not found");
      return res.json();
    },
  });

  // Sync edit state when job data loads
  useEffect(() => {
    if (job) {
      setEditNotes(job.notes || "");
      setEditQtyCompleted(job.quantity_completed || 0);
    }
  }, [job]);

  // ─── Update status mutation ───────────────────────────────────────────────
  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/jobs/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["job-detail", params.id], (old: JobDetail | undefined) =>
        old ? { ...old, ...data } : data
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast(`Marked as ${statusConfig[data.status]?.label}`, "success");
    },
    onError: () => toast("Failed to update status", "error"),
  });

  // ─── Update notes + progress mutation ────────────────────────────────────
  const saveEdit = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNotes, quantity_completed: editQtyCompleted }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["job-detail", params.id], (old: JobDetail | undefined) =>
        old ? { ...old, ...data } : data
      );
      setIsEditing(false);
      toast("Saved!", "success");
    },
    onError: () => toast("Failed to save", "error"),
  });

  // ─── Delete job mutation ──────────────────────────────────────────────────
  const deleteJob = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast("Job deleted", "success");
      router.push("/jobs");
    },
    onError: () => toast("Failed to delete job", "error"),
  });

  // ─── Loading state ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </main>
    );
  }

  if (!job) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="font-bold text-white uppercase tracking-widest text-sm">Job Not Found</p>
        <Link href="/jobs" className="text-accent text-sm underline">Back to Jobs</Link>
      </main>
    );
  }

  const status = statusConfig[job.status] || statusConfig.received;
  const nextStep = statusFlow[job.status];
  const progress = job.quantity ? Math.min((job.quantity_completed / job.quantity) * 100, 100) : 0;
  const daysOld = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000);
  const isOverdue = job.due_date && new Date(job.due_date) < new Date() && !["delivered", "invoiced", "cancelled"].includes(job.status);
  const canInvoice = ["completed", "delivered"].includes(job.status) && job.invoices.length === 0;

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-white/5 bg-background/80 backdrop-blur-3xl px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/jobs")}
            className="flex h-10 w-10 items-center justify-center rounded-2xl glass hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#555] italic">
              {template.orderLabel} Details
            </p>
            <h1 className="text-base font-black text-white uppercase italic truncate leading-tight">
              {job.description}
            </h1>
          </div>
          <button
            onClick={() => {
              if (window.confirm("Delete this job? This cannot be undone.")) {
                deleteJob.mutate();
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete Job"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-5 xl:p-8 max-w-3xl xl:mx-auto">

        {/* ── Status + Priority Badge ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className={cn("text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border", status.color, status.bg, status.border)}>
            {status.label}
          </span>
          {job.priority === "urgent" && (
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              🔴 Urgent
            </span>
          )}
          {isOverdue && (
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
              ⚠ Overdue
            </span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground uppercase tracking-widest">
            {daysOld === 0 ? "Today" : daysOld === 1 ? "Yesterday" : `${daysOld}d ago`}
          </span>
        </div>

        {/* ── Next Action Button ── */}
        {nextStep && (
          <button
            onClick={() => updateStatus.mutate(nextStep.next)}
            disabled={updateStatus.isPending}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-accent text-white font-black uppercase tracking-widest text-[11px] italic shadow-[0_0_24px_rgba(255,107,43,0.25)] hover:bg-accent/90 transition-all disabled:opacity-60"
          >
            {updateStatus.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <nextStep.icon className="h-4 w-4" />
            )}
            {updateStatus.isPending ? "Updating..." : nextStep.label}
          </button>
        )}

        {/* ── Convert to Invoice CTA ── */}
        {canInvoice && (
          <Link
            href={`/invoices/new?from_job=${job.id}`}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-green-500/30 bg-green-500/10 text-green-400 font-black uppercase tracking-widest text-[11px] italic hover:bg-green-500/20 transition-colors"
          >
            <IndianRupee className="h-4 w-4" />
            Create Invoice for this {template.orderLabel}
          </Link>
        )}

        {/* ── Client Card ── */}
        {job.contact && (
          <Card className="glass-panel">
            <CardContent className="p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#555] mb-3">Client</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{job.contact.name}</p>
                  {job.contact.phone && (
                    <p className="text-xs text-muted-foreground mt-0.5">{job.contact.phone}</p>
                  )}
                </div>
                <Link
                  href={`/clients/${job.contact.id}`}
                  className="text-[10px] text-accent uppercase tracking-widest font-black hover:underline flex items-center gap-1"
                >
                  View <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Job Details Card ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#555]">{template.orderLabel} Details</p>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-[10px] text-accent uppercase tracking-widest font-black hover:underline flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" />
                {isEditing ? "Cancel" : "Edit"}
              </button>
            </div>

            {/* Reference */}
            {job.reference_number && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">PO / Ref No.</span>
                <span className="font-mono text-white font-bold">{job.reference_number}</span>
              </div>
            )}

            {/* Material */}
            {job.material && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Material</span>
                <span className="text-white font-medium">{job.material}</span>
              </div>
            )}

            {/* Due Date */}
            {job.due_date && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className={cn("font-bold", isOverdue ? "text-orange-400" : "text-white")}>
                  {new Date(job.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            )}

            {/* Quantity Progress */}
            {job.quantity !== null && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  {isEditing ? (
                    <input
                      type="number"
                      min={0}
                      max={job.quantity}
                      value={editQtyCompleted}
                      onChange={(e) => setEditQtyCompleted(Number(e.target.value))}
                      className="w-20 rounded-lg border border-white/10 bg-background/60 px-2 py-1 text-right text-sm text-white focus:outline-none focus:border-accent"
                    />
                  ) : (
                    <span className="font-bold text-white font-mono">
                      {job.quantity_completed} / {job.quantity} {job.quantity_unit || "Nos"}
                    </span>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className={cn("h-full rounded-full transition-all", progress >= 100 ? "bg-green-400" : "bg-accent")}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-right text-[10px] text-muted-foreground">{Math.round(progress)}% done</p>
              </div>
            )}

            {/* Notes */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Notes</p>
              {isEditing ? (
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes, instructions, drawing numbers..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-background/60 p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent"
                />
              ) : (
                <p className="text-sm text-white/70 leading-relaxed">
                  {job.notes || <span className="text-muted-foreground italic">No notes added</span>}
                </p>
              )}
            </div>

            {isEditing && (
              <Button
                onClick={() => saveEdit.mutate()}
                disabled={saveEdit.isPending}
                className="w-full h-11 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-[10px] italic"
              >
                {saveEdit.isPending ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Linked Documents Section ── */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Inward DCs */}
          <Card className="glass-panel">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#555]">Inward DCs</p>
                </div>
                <Link
                  href={`/dc/inward/new?job_id=${job.id}`}
                  className="flex items-center gap-1 text-[10px] text-accent uppercase tracking-widest font-black hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add
                </Link>
              </div>
              {job.inward_dcs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No material received yet</p>
              ) : (
                <div className="space-y-2">
                  {job.inward_dcs.map((dc) => (
                    <div key={dc.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div>
                        <p className="text-xs font-bold text-white">DC #{dc.document_number}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(dc.date).toLocaleDateString("en-IN")}</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        Inward
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Outward DCs */}
          <Card className="glass-panel">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-purple-400" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#555]">Outward DCs</p>
                </div>
                <Link
                  href={`/dc/outward/new?job_id=${job.id}`}
                  className="flex items-center gap-1 text-[10px] text-accent uppercase tracking-widest font-black hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add
                </Link>
              </div>
              {job.outward_dcs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No delivery recorded yet</p>
              ) : (
                <div className="space-y-2">
                  {job.outward_dcs.map((dc) => (
                    <div key={dc.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <div>
                        <p className="text-xs font-bold text-white">DC #{dc.document_number}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(dc.date).toLocaleDateString("en-IN")}</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                        Outward
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Invoices ── */}
        {job.invoices.length > 0 && (
          <Card className="glass-panel">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-green-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#555]">Invoices</p>
              </div>
              <div className="space-y-2">
                {job.invoices.map((inv) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`}>
                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 hover:bg-white/[0.04] transition-colors">
                      <div>
                        <p className="text-xs font-bold text-white">{inv.invoice_number}</p>
                        <p className="text-[10px] text-muted-foreground">
                          ₹{Number(inv.total_amount).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                        inv.status === "paid" ? "text-green-400 bg-green-500/10" : "text-amber-400 bg-amber-500/10"
                      )}>
                        {inv.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Completed At ── */}
        {job.completed_at && (
          <div className="flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <p className="text-xs text-green-400 font-bold">
              Completed on {new Date(job.completed_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        )}
      </motion.div>
    </main>
  );
}
