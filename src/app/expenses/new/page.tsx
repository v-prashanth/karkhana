"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Save, CheckCircle2, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/ui/Toaster";
import { motion } from "framer-motion";
import { expensesApi } from "@/lib/api/expenses";
import { useStore } from "@/store/useStore";
import type { ExpenseCategory } from "@/types/database";

type ExpenseForm = {
  description: string;
  amount: string;
  categoryId: string;
  method: string;
  date: string;
  referenceNo: string;
  notes: string;
};

function getCategoryEmoji(name: string) {
  if (/rent/i.test(name)) return "🏠";
  if (/material/i.test(name)) return "📦";
  if (/tool|maint/i.test(name)) return "🔧";
  if (/electric/i.test(name)) return "⚡";
  if (/salary|wage/i.test(name)) return "👷";
  if (/transport/i.test(name)) return "🚛";
  return "🧾";
}

export default function NewExpensePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const organization = useStore((state) => state.organization);
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);

  const { data: categories = [] } = useQuery<ExpenseCategory[]>({
    queryKey: ["expense-categories", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => expensesApi.getCategories(),
  });

  const { register, handleSubmit, watch, setValue } = useForm<ExpenseForm>({
    defaultValues: {
      description: "",
      amount: "",
      categoryId: "",
      method: "cash",
      date: new Date().toISOString().split("T")[0],
      referenceNo: "",
      notes: "",
    },
  });

  const selectedCategory = watch("categoryId");

  const createExpense = useMutation({
    mutationFn: (data: ExpenseForm) =>
      expensesApi.create({
        category_id: data.categoryId || null,
        contact_id: null,
        amount: Number(data.amount || 0),
        description: data.description,
        date: data.date,
        method: data.method,
        reference_number: data.referenceNo || null,
        receipt_url: null,
        is_recurring: false,
        recurring_period: null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      setSaved(true);
      toast("Expense logged", "success");
      queryClient.invalidateQueries({ queryKey: ["finance-expenses", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["reports-expenses", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", organization?.id] });
      setTimeout(() => router.push("/finance"), 1200);
    },
    onError: (error: Error) => {
      toast(error.message || "Could not log expense", "error");
    },
  });

  if (saved) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500/10">
            <CheckCircle2 className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Expense Logged!</h2>
          <p className="text-muted-foreground">Redirecting...</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader title="Log Expense" backHref="/finance" />

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit((data) => createExpense.mutate(data))}
        className="space-y-5 p-5"
      >
        <Card className="glass-panel">
          <CardContent className="p-5">
            <label className="mb-2 block text-sm text-muted-foreground">Amount (Rs)</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-xl font-bold text-muted-foreground">Rs</span>
              <input
                type="number"
                placeholder="0"
                className="h-14 w-full rounded-xl border border-white/10 bg-black/40 pl-12 pr-4 font-mono text-2xl font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                {...register("amount", { required: true })}
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-3 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Category</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setValue("categoryId", category.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                    selectedCategory === category.id
                      ? "border-accent bg-accent/10"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="text-lg">{getCategoryEmoji(category.name)}</span>
                  <span className="text-center text-[10px] font-semibold leading-tight text-foreground">{category.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Details</h2>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Description</label>
              <Input placeholder="What was this expense for?" {...register("description", { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Date</label>
                <Input type="date" {...register("date")} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">Method</label>
                <select
                  {...register("method")}
                  className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Reference / Bill No.</label>
              <Input placeholder="Optional" {...register("referenceNo")} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">Notes</label>
              <Input placeholder="Optional notes" {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardContent className="p-5">
            <button
              type="button"
              className="flex h-20 w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/10 text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
            >
              <Camera className="h-5 w-5" />
              <span className="text-sm font-semibold">Attach Receipt Photo</span>
            </button>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full text-sm font-semibold" disabled={createExpense.isPending}>
          <Save className="mr-2 h-4 w-4" /> {createExpense.isPending ? "Saving..." : "Save Expense"}
        </Button>
      </motion.form>
    </main>
  );
}
