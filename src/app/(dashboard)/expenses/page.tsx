"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, PlusCircle } from "lucide-react";
import { CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { expensesApi } from "@/lib/api/expenses";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { Expense } from "@/types/database";

function getCategoryEmoji(name: string) {
  if (/rent/i.test(name)) return "🏠";
  if (/material/i.test(name)) return "📦";
  if (/tool|maint/i.test(name)) return "🔧";
  if (/electric/i.test(name)) return "⚡";
  if (/salary|wage/i.test(name)) return "👷";
  if (/transport/i.test(name)) return "🚛";
  return "🧾";
}

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["expenses-list"],
    queryFn: () => expensesApi.list(),
  });

  const filtered = expenses.filter((expense) => {
    const query = search.toLowerCase();
    const matchesSearch =
      query === "" ||
      expense.description.toLowerCase().includes(query) ||
      (expense.category?.name || "").toLowerCase().includes(query);

    const expenseMonth = new Date(expense.date).toISOString().slice(0, 7);
    const matchesMonth = selectedMonth === "" || expenseMonth === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  const totalExpenses = filtered.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const categoryBreakdown = filtered.reduce<Record<string, number>>((acc, expense) => {
    const key = expense.category?.name || "Uncategorized";
    acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <PageHeader title="Expenses" subtitle={`${filtered.length} expenses`} addHref="/expenses/new" />

      <div className="px-5 py-3 xl:px-8">
        <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
              >
                <option value="">All time</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = date.toISOString().slice(0, 7);
                  const label = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {Object.keys(categoryBreakdown).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Category Breakdown</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categoryBreakdown).map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryEmoji(category)}</span>
                        <span className="text-sm font-medium">{category}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              type="expenses"
              title="No expenses found"
              description={search ? "Try adjusting your search terms" : "Start by logging your first expense"}
              action={
                <Link href="/expenses/new">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80">
                    <PlusCircle className="h-4 w-4" />
                    Log Expense
                  </button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{formatCurrency(totalExpenses)}</span>
                </p>
              </div>

              {filtered.map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/60 bg-background/55 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryEmoji(expense.category?.name || "")}</span>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.category?.name || "Uncategorized"} •{" "}
                            {new Date(expense.date).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Number(expense.amount))}</p>
                      <p className="text-xs text-muted-foreground">{expense.method}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
