"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, CheckCircle2, Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/ui/Toaster";
import { contactsApi } from "@/lib/api/contacts";
import { ordersApi } from "@/lib/api/orders";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type LineItem = {
  description: string;
  quantity: string;
  unit: string;
};

type InwardDCForm = {
  contactId: string;
  orderId: string;
  referenceNumber: string;
  notes: string;
  date: string;
  items: LineItem[];
};

const UNIT_OPTIONS = ["Nos", "Kg", "Meter", "Set", "Lot", "Box", "Ltr", "Ton", "Sq.Ft", "Sq.M"];

// ─── Component ────────────────────────────────────────────────────────────────

function NewInwardDCPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledJobId = searchParams.get("job_id") || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, control } = useForm<InwardDCForm>({
    defaultValues: {
      contactId: "",
      orderId: prefilledJobId,
      referenceNumber: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
      items: [{ description: "", quantity: "1", unit: "Nos" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Contacts (suppliers / clients)
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => contactsApi.list(),
  });

  // Active jobs to link DC to
  const { data: orders = [] } = useQuery({
    queryKey: ["orders-active"],
    queryFn: () => ordersApi.list(),
  });

  const createDC = useMutation({
    mutationFn: async (data: InwardDCForm) => {
      const res = await fetch("/api/inward-dc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: data.contactId || null,
          order_id: data.orderId || null,
          reference_number: data.referenceNumber || null,
          notes: data.notes || null,
          date: data.date,
          items: data.items
            .filter((item) => item.description.trim() !== "")
            .map((item, idx) => ({
              description: item.description,
              quantity: parseFloat(item.quantity) || 1,
              unit: item.unit || "Nos",
              sort_order: idx,
            })),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to create DC");
      return payload;
    },
    onSuccess: () => {
      setSaved(true);
      toast("Inward DC saved! Material received and logged.", "success");
      queryClient.invalidateQueries({ queryKey: ["inward-dcs"] });
      if (prefilledJobId) {
        queryClient.invalidateQueries({ queryKey: ["job-detail", prefilledJobId] });
      }
      setTimeout(() => router.push("/dc/inward"), 1500);
    },
    onError: (err: Error) => {
      toast(err.message, "error");
    },
  });

  if (saved) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-green-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="text-xl font-black text-white uppercase italic">DC Saved!</p>
          <p className="text-sm text-muted-foreground">Material logged successfully.</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24 bg-background">
      <PageHeader title="New Inward DC" subtitle="Receive material from supplier" backHref="/dc/inward" />

      <form
        onSubmit={handleSubmit((data) => createDC.mutate(data))}
        className="mx-auto max-w-2xl space-y-5 p-5 xl:px-8"
      >

        {/* ── Supplier Selection ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Supplier / Contact</h3>
            <select
              {...register("contactId")}
              className="w-full rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-white outline-none focus:border-accent appearance-none"
            >
              <option value="">Select contact (optional)...</option>
              {(contacts as Array<{ id: string; name: string; phone?: string }>).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* ── Link to Job ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Link to Job (Optional)</h3>
            <select
              {...register("orderId")}
              className="w-full rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-white outline-none focus:border-accent appearance-none"
            >
              <option value="">No job linked</option>
              {(orders as Array<{ id: string; description: string; status: string; contact?: { name?: string } }>).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.description || "Unnamed Job"} — {o.contact?.name || "No client"} ({o.status})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* ── Material Line Items ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">
                <Package className="inline h-3.5 w-3.5 mr-1.5 text-blue-400" />
                Materials Received
              </h3>
              <button
                type="button"
                onClick={() => append({ description: "", quantity: "1", unit: "Nos" })}
                className="flex items-center gap-1.5 rounded-xl bg-accent/10 border border-accent/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/20 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-[1fr_80px_80px_32px] gap-2 px-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555]">Description / Part</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555]">Qty</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#555]">Unit</p>
              <span />
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-center"
                >
                  <input
                    {...register(`items.${idx}.description`, { required: true })}
                    placeholder={`Item ${idx + 1} — e.g. MS Rod 25mm`}
                    className="rounded-xl border border-white/10 bg-background/60 px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent"
                  />
                  <input
                    {...register(`items.${idx}.quantity`)}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Qty"
                    className="rounded-xl border border-white/10 bg-background/60 px-2 py-2.5 text-sm text-white text-right outline-none focus:border-accent"
                  />
                  <select
                    {...register(`items.${idx}.unit`)}
                    className="rounded-xl border border-white/10 bg-background/60 px-2 py-2.5 text-sm text-white outline-none focus:border-accent appearance-none"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {fields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Total Item Count */}
            <p className="text-right text-[10px] text-muted-foreground">
              {fields.length} line item{fields.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* ── Reference & Date ── */}
        <Card className="glass-panel">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#666]">Reference</h3>
            <Input
              placeholder="Supplier DC / Challan Number (optional)"
              {...register("referenceNumber")}
            />
            <Input type="date" {...register("date")} />
            <textarea
              placeholder="Notes (optional) — inspection remarks, condition, etc."
              rows={2}
              className="w-full resize-none rounded-xl border border-white/10 bg-background/60 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
              {...register("notes")}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px] italic hover:bg-white/90"
          disabled={createDC.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          {createDC.isPending ? "Saving..." : "Save Inward DC"}
        </Button>
      </form>
    </main>
  );
}

export default function NewInwardDCPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" /></main>}>
      <NewInwardDCPageContent />
    </Suspense>
  );
}
