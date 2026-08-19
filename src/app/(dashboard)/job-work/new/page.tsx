"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Save, CheckCircle2, Plus, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/ui/Toaster";
import { contactsApi } from "@/lib/api/contacts";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChallanItem = {
  item_name: string;
  hsn_code: string;
  uom: string;
  sent_qty: string;
  unit_taxable_value: string;
};

type ChallanForm = {
  challan_number: string;
  challan_date: string;
  role_type: string;
  contact_id: string;
  principal_name: string;
  principal_gstin: string;
  principal_address: string;
  job_worker_name: string;
  job_worker_gstin: string;
  job_worker_address: string;
  nature_of_processing: string;
  dispatch_date: string;
  transport_mode: string;
  vehicle_number: string;
  eway_bill_number: string;
  notes: string;
  items: ChallanItem[];
};

const UNIT_OPTIONS = ["Nos", "Kg", "Meter", "Set", "Lot", "Box", "Ton", "Sq.M"];

const ROLE_TYPES = [
  { value: "PRINCIPAL_OUTWARD", label: "Principal → Job Worker (We sent material)", short: "We Sent Material" },
  { value: "JOB_WORKER_INWARD", label: "Job Worker ← Principal (We received material)", short: "We Received Material" },
  { value: "JOB_WORKER_OUTWARD", label: "Job Worker → Principal (We returned material)", short: "We Returned Material" },
  { value: "PRINCIPAL_INWARD", label: "Principal ← Job Worker (Material returned to us)", short: "Material Returned to Us" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewJobWorkChallanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [totalValue, setTotalValue] = useState(0);

  const today = new Date().toISOString().split("T")[0];

  const { register, handleSubmit, watch, control } = useForm<ChallanForm>({
    defaultValues: {
      challan_number: `JWC-${Date.now().toString().slice(-6)}`,
      challan_date: today,
      role_type: "PRINCIPAL_OUTWARD",
      contact_id: "",
      principal_name: "",
      principal_gstin: "",
      principal_address: "",
      job_worker_name: "",
      job_worker_gstin: "",
      job_worker_address: "",
      nature_of_processing: "",
      dispatch_date: today,
      transport_mode: "",
      vehicle_number: "",
      eway_bill_number: "",
      notes: "",
      items: [{ item_name: "", hsn_code: "", uom: "Nos", sent_qty: "1", unit_taxable_value: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const roleType = watch("role_type");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsApi.list(),
  });

  const createChallan = useMutation({
    mutationFn: async (data: ChallanForm) => {
      const items = data.items.filter((item) => item.item_name.trim() !== "");
      const totalTaxableValue = items.reduce((sum, item) => {
        return sum + (parseFloat(item.sent_qty) || 0) * (parseFloat(item.unit_taxable_value) || 0);
      }, 0);

      const res = await fetch("/api/job-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challan_number: data.challan_number,
          challan_date: data.challan_date,
          role_type: data.role_type,
          contact_id: data.contact_id || null,
          principal_name: data.principal_name,
          principal_gstin: data.principal_gstin || null,
          principal_address: data.principal_address || null,
          job_worker_name: data.job_worker_name,
          job_worker_gstin: data.job_worker_gstin || null,
          job_worker_address: data.job_worker_address || null,
          nature_of_processing: data.nature_of_processing || null,
          dispatch_date: data.dispatch_date,
          transport_mode: data.transport_mode || null,
          vehicle_number: data.vehicle_number || null,
          eway_bill_number: data.eway_bill_number || null,
          notes: data.notes || null,
          total_taxable_value: totalTaxableValue,
          items: items.map((item) => ({
            item_name: item.item_name,
            hsn_code: item.hsn_code || null,
            uom: item.uom,
            sent_qty: parseFloat(item.sent_qty) || 0,
            unit_taxable_value: parseFloat(item.unit_taxable_value) || 0,
            total_taxable_value: (parseFloat(item.sent_qty) || 0) * (parseFloat(item.unit_taxable_value) || 0),
          })),
        }),
      });
      const payload = await res.json();
      if (!res.ok && res.status !== 207) throw new Error(payload.error || "Failed to create challan");
      return payload;
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["job-work-challans"] });
      setTimeout(() => router.push("/job-work"), 1500);
    },
    onError: (err: Error) => toast(err.message, "error"),
  });

  if (saved) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="text-xl font-black text-white uppercase italic">Challan Created!</p>
          <p className="text-sm text-muted-foreground">365-day CGST countdown started.</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader title="New Job Work Challan" subtitle="Rule 55 — CGST Act" backHref="/job-work" />

      <form
        onSubmit={handleSubmit((data) => createChallan.mutate(data))}
        className="mx-auto max-w-2xl space-y-5 p-5 xl:px-8"
      >
        {/* CGST Info Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-4">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-400/80 leading-relaxed">
            Under CGST Sec. 143, material sent for job work must be returned within <strong className="text-blue-400">1 year</strong> (or 3 years for capital goods). Material not returned becomes a deemed supply and attracts GST + interest.
          </p>
        </div>

        {/* ── Challan Identity ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Challan Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Challan Number *</label>
                <Input {...register("challan_number", { required: true })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Challan Date *</label>
                <Input type="date" {...register("challan_date", { required: true })} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Dispatch Date *</label>
              <Input type="date" {...register("dispatch_date", { required: true })} />
            </div>
            <p className="text-[10px] text-amber-400/70">
              ⏱ CGST 1-year expiry countdown starts from dispatch date
            </p>
          </CardContent>
        </Card>

        {/* ── Role Type ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Direction</h3>
            <div className="grid grid-cols-1 gap-2">
              {ROLE_TYPES.map((rt) => (
                <label
                  key={rt.value}
                  className={cn(
                    "flex items-start gap-3 cursor-pointer rounded-xl border px-4 py-3 transition-all",
                    roleType === rt.value
                      ? "border-accent/40 bg-accent/5"
                      : "border-white/10 bg-background/40 hover:border-white/20"
                  )}
                >
                  <input
                    type="radio"
                    value={rt.value}
                    {...register("role_type", { required: true })}
                    className="mt-0.5 accent-orange-500"
                  />
                  <div>
                    <p className={cn("text-sm font-bold", roleType === rt.value ? "text-accent" : "text-white")}>
                      {rt.short}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{rt.label}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Contact Link ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Link to Contact (Optional)</h3>
            <select
              {...register("contact_id")}
              className="w-full rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-white outline-none focus:border-accent appearance-none"
            >
              <option value="">No contact linked</option>
              {(contacts as Array<{ id: string; name: string }>).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* ── Principal Details ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Principal (Owner of Material)</h3>
            <Input placeholder="Principal business name *" {...register("principal_name", { required: true })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="GSTIN" {...register("principal_gstin")} />
              <Input placeholder="Address" {...register("principal_address")} />
            </div>
          </CardContent>
        </Card>

        {/* ── Job Worker Details ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Job Worker</h3>
            <Input placeholder="Job worker business name *" {...register("job_worker_name", { required: true })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="GSTIN" {...register("job_worker_gstin")} />
              <Input placeholder="Address" {...register("job_worker_address")} />
            </div>
            <Input placeholder="Nature of processing (e.g. CNC Turning, Welding, Plating)" {...register("nature_of_processing")} />
          </CardContent>
        </Card>

        {/* ── Transport ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Transport (Optional)</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Transport mode (Road/Rail)" {...register("transport_mode")} />
              <Input placeholder="Vehicle number" {...register("vehicle_number")} />
            </div>
            <Input placeholder="E-Way Bill Number" {...register("eway_bill_number")} />
          </CardContent>
        </Card>

        {/* ── Line Items ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Materials / Parts</h3>
              <button
                type="button"
                onClick={() => append({ item_name: "", hsn_code: "", uom: "Nos", sent_qty: "1", unit_taxable_value: "0" })}
                className="flex items-center gap-1.5 rounded-xl bg-accent/10 border border-accent/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/20 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[1fr_60px_60px_70px_24px] gap-2 px-1">
              {["Part / Item Name", "HSN", "Qty", "Rate (₹)", ""].map((h) => (
                <p key={h} className="text-[9px] font-black uppercase tracking-widest text-[#555]">{h}</p>
              ))}
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-[1fr_60px_60px_70px_24px] gap-2 items-center"
                >
                  <input
                    {...register(`items.${idx}.item_name`, { required: true })}
                    placeholder="Item name"
                    className="rounded-xl border border-white/10 bg-background/60 px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent"
                  />
                  <input
                    {...register(`items.${idx}.hsn_code`)}
                    placeholder="HSN"
                    className="rounded-xl border border-white/10 bg-background/60 px-2 py-2 text-xs text-white text-center outline-none focus:border-accent"
                  />
                  <input
                    {...register(`items.${idx}.sent_qty`)}
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Qty"
                    className="rounded-xl border border-white/10 bg-background/60 px-2 py-2 text-sm text-white text-right outline-none focus:border-accent"
                  />
                  <input
                    {...register(`items.${idx}.unit_taxable_value`)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Rate"
                    className="rounded-xl border border-white/10 bg-background/60 px-2 py-2 text-xs text-white text-right outline-none focus:border-accent"
                  />
                  {fields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500/40 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : <span />}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Notes ── */}
        <Card className="glass-panel">
          <CardContent className="p-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666] mb-3">Notes</h3>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="Additional remarks..."
              className="w-full resize-none rounded-xl border border-white/10 bg-background/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          disabled={createChallan.isPending}
          className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px] italic hover:bg-white/90"
        >
          <Save className="mr-2 h-4 w-4" />
          {createChallan.isPending ? "Creating..." : "Create Challan"}
        </Button>
      </form>
    </main>
  );
}
