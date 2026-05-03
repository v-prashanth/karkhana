"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/ui/Toaster";
import { contactsApi } from "@/lib/api/contacts";
import { ordersApi } from "@/lib/api/orders";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";

type OutwardDCForm = {
  contactId: string;
  orderId: string;
  referenceNumber: string;
  notes: string;
  date: string;
  items: string;
  quantity: string;
  unit: string;
};

export default function NewOutwardDCPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const organization = useStore((state) => state.organization);

  const { register, handleSubmit } = useForm<OutwardDCForm>({
    defaultValues: {
      contactId: "",
      orderId: "",
      referenceNumber: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
      items: "",
      quantity: "",
      unit: "Nos",
    },
  });

  // Load contacts (clients)
  const contactsQuery = useQuery({
    queryKey: ["contacts", "client"],
    queryFn: () => contactsApi.list("client"),
  });

  // Load active Jobs to link DC to
  const ordersQuery = useQuery({
    queryKey: ["orders-active"],
    queryFn: () => ordersApi.list(),
  });

  const createDC = useMutation({
    mutationFn: async (data: OutwardDCForm) => {
      const res = await fetch("/api/outward-dc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: data.contactId || null,
          order_id: data.orderId || null,
          reference_number: data.referenceNumber || null,
          notes: data.notes || null,
          date: data.date,
          items: data.items
            ? [
                {
                  description: data.items,
                  quantity: parseFloat(data.quantity) || 1,
                  unit: data.unit || "Nos",
                },
              ]
            : [],
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to create DC");
      return payload;
    },
    onSuccess: () => {
      setSaved(true);
      toast("Outward DC created! Document saved and counter incremented.", "success");
      queryClient.invalidateQueries({ queryKey: ["outward-dcs"] });
      setTimeout(() => router.push("/dc/outward"), 1500);
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
          <p className="text-xl font-bold">DC Saved!</p>
          <p className="text-sm text-muted-foreground">Redirecting to outward DCs...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24 bg-background">
      <PageHeader title="New Outward DC" subtitle="Dispatch goods to client" backHref="/dc/outward" />

      <form
        onSubmit={handleSubmit((data) => createDC.mutate(data))}
        className="mx-auto max-w-2xl space-y-6 p-4 xl:px-8"
      >
        {/* Client Selection */}
        <Card className="border-border/60 bg-white/[0.02]">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#888]">Client</h3>
            <select
              {...register("contactId")}
              className="w-full rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            >
              <option value="">Select client...</option>
              {(contactsQuery.data || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Link to Job */}
        <Card className="border-border/60 bg-white/[0.02]">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#888]">Link to Job (Optional)</h3>
            <select
              {...register("orderId")}
              className="w-full rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-white outline-none focus:border-accent"
            >
              <option value="">No job linked</option>
              {(ordersQuery.data || []).map((o: any) => (
                <option key={o.id} value={o.id}>
                  {o.description || "Unnamed Job"} — {o.status}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Material Details */}
        <Card className="border-border/60 bg-white/[0.02]">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#888]">Material</h3>
            <textarea
              placeholder="e.g. Aluminium Suckers 25x42x130mm, machined as per drawing"
              className="w-full min-h-[100px] rounded-xl border border-white/10 bg-background/80 p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent"
              {...register("items", { required: true })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" step="0.01" placeholder="Quantity" {...register("quantity", { required: true })} />
              <select
                {...register("unit")}
                className="rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-white outline-none focus:border-accent"
              >
                <option value="Nos">Nos</option>
                <option value="Kg">Kg</option>
                <option value="Meter">Meter</option>
                <option value="Set">Set</option>
                <option value="Lot">Lot</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Reference & Date */}
        <Card className="border-border/60 bg-white/[0.02]">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#888]">Reference</h3>
            <Input placeholder="Client PO / Reference Number" {...register("referenceNumber")} />
            <Input type="date" {...register("date")} />
            <Input placeholder="Notes (optional)" {...register("notes")} />
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full text-base"
          disabled={createDC.isPending}
        >
          <Save className="mr-2 h-5 w-5" />
          {createDC.isPending ? "Saving..." : "Save & Dispatch"}
        </Button>
      </form>
    </main>
  );
}
