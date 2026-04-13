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
import { getBusinessTemplate } from "@/lib/config/templates";
import { ordersApi } from "@/lib/api/orders";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";

type OrderForm = {
  clientId: string;
  description: string;
  quantity: string;
  quantityUnit: string;
  material: string;
  referenceNo: string;
  priority: "normal" | "urgent";
  dueDate: string;
  notes: string;
};

export default function NewOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const organization = useStore((state) => state.organization);
  const template = getBusinessTemplate(organization?.business_type);

  const { register, handleSubmit } = useForm<OrderForm>({
    defaultValues: {
      clientId: "",
      description: "",
      quantity: "",
      quantityUnit: "Nos",
      material: "",
      referenceNo: "",
      priority: "normal",
      dueDate: "",
      notes: "",
    },
  });

  const contactsQuery = useQuery({
    queryKey: ["contacts", "clients"],
    queryFn: () => contactsApi.list("client"),
  });

  const createOrder = useMutation({
    mutationFn: (data: OrderForm) =>
      ordersApi.create({
        contact_id: data.clientId || null,
        order_number: null,
        reference_number: data.referenceNo || null,
        description: data.description,
        status: "received",
        priority: data.priority,
        quantity: data.quantity ? Number(data.quantity) : null,
        quantity_unit: data.quantityUnit,
        quantity_completed: 0,
        material: data.material || null,
        estimated_cost: null,
        actual_cost: null,
        due_date: data.dueDate || null,
        completed_at: null,
        notes: data.notes || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSaved(true);
      toast("Order created successfully!", "success");
      setTimeout(() => router.push("/orders"), 1200);
    },
    onError: (error: Error) => {
      toast(error.message, "error");
    },
  });

  const onSubmit = (data: OrderForm) => {
    createOrder.mutate(data);
  };

  if (saved) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500/10">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{template.orderLabel} Saved!</h2>
          <p className="text-muted-foreground">Redirecting to your work list...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader title={`New ${template.orderLabel}`} subtitle="Add work to track" backHref="/orders" />

      <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5">
        <Card className="glass-panel">
          <CardContent className="space-y-2 p-5">
            <h2 className="text-base font-semibold text-foreground">Track one piece of work from start to finish</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Save the client, description, quantity, due date, and notes so your team can follow the job without checking WhatsApp chats.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Client & Reference</h2>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Client</label>
              <select
                {...register("clientId", { required: true })}
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">{contactsQuery.isLoading ? "Loading clients..." : "Select client"}</option>
                {(contactsQuery.data || []).map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">PO / Reference No.</label>
              <Input placeholder="Customer PO number or your reference" {...register("referenceNo")} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{template.orderLabel} Details</h2>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Description / Part Name</label>
              <textarea
                placeholder="What work needs to be done?"
                className="w-full min-h-[100px] resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                {...register("description", { required: true })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Qty</label>
                <Input type="number" placeholder="50" {...register("quantity")} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Unit</label>
                <select
                  {...register("quantityUnit")}
                  className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="Nos">Nos</option>
                  <option value="Kg">Kg</option>
                  <option value="Mtr">Mtr</option>
                  <option value="Set">Set</option>
                  <option value="Lot">Lot</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Material</label>
                <Input placeholder="Material if needed" {...register("material")} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Due Date (Optional)</label>
              <Input type="date" {...register("dueDate")} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Priority</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 transition-all has-[:checked]:border-accent has-[:checked]:bg-accent/10">
                <input type="radio" value="normal" {...register("priority")} className="sr-only" defaultChecked />
                <span className="text-sm font-semibold text-foreground">Normal</span>
              </label>
              <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 transition-all has-[:checked]:border-red-500 has-[:checked]:bg-red-500/10">
                <input type="radio" value="urgent" {...register("priority")} className="sr-only" />
                <span className="text-sm font-semibold text-foreground">Urgent</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Notes</h2>
            <textarea
              placeholder="Special instructions, delivery notes, drawing details, or follow-up reminders"
              className="w-full min-h-[80px] resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              {...register("notes")}
            />
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full text-sm font-semibold" disabled={createOrder.isPending}>
          <Save className="mr-2 h-4 w-4" /> {createOrder.isPending ? "Saving..." : `Save ${template.orderLabel.toLowerCase()}`}
        </Button>
      </motion.form>
    </main>
  );
}
