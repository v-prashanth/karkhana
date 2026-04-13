"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { expensesApi } from "@/lib/api/expenses";
import { invoicesApi } from "@/lib/api/invoices";
import { paymentsApi } from "@/lib/api/payments";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils/currency";
import type { Expense, Invoice, Payment } from "@/types/database";

export default function ReportsPage() {
  const organization = useStore((state) => state.organization);
  const currentMonth = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["reports-invoices", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => invoicesApi.list(),
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["reports-payments", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => paymentsApi.list(),
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["reports-expenses", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => expensesApi.list(),
  });

  const categoryBreakdown = useMemo(() => {
    return expenses.reduce<Record<string, number>>((acc, expense) => {
      const key = expense.category?.name || "Uncategorized";
      acc[key] = (acc[key] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});
  }, [expenses]);

  const totalInvoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const totalReceived = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0);

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Reports"
        subtitle="CA-ready summaries"
        backHref="/dashboard"
        action={
          <Button variant="outline" size="sm" className="h-8 text-xs px-3 border-border">
            <Filter className="mr-2 h-3.5 w-3.5" /> {currentMonth}
          </Button>
        }
      />

      <div className="space-y-6 p-5 xl:px-8">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Business Summary</h2>
          <Card className="glass-panel">
            <CardContent className="divide-y divide-border/60 p-0">
              <div className="flex items-center justify-between p-4">
                <span className="font-medium text-foreground">Total Invoiced</span>
                <span className="text-lg font-semibold text-foreground">{formatCurrency(totalInvoiced)}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-medium text-green-400">Payment Received</span>
                <span className="text-lg font-semibold text-green-400">{formatCurrency(totalReceived)}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-medium text-red-400">Outstanding</span>
                <span className="text-lg font-semibold text-red-400">{formatCurrency(totalOutstanding)}</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-medium text-muted-foreground">Invoices Generated</span>
                <span className="flex items-center text-lg font-semibold text-foreground">
                  <FileText className="mr-2 h-4 w-4" /> {invoices.length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Button className="w-full" size="lg">
            <Download className="mr-2 h-4 w-4" /> Download Excel Report
          </Button>
        </section>

        <section className="space-y-4 border-t border-border pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Expense Breakdown</h2>
          <Card className="glass-panel">
            <CardContent className="space-y-3 p-5">
              {Object.keys(categoryBreakdown).length === 0 ? (
                <p className="text-sm text-muted-foreground">No expense data yet.</p>
              ) : (
                Object.entries(categoryBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                      <span className="text-sm font-medium text-foreground">{category}</span>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(amount)}</span>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4 border-t border-border pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">GST Reports</h2>
          <Card className="glass-panel">
            <CardContent className="p-5 text-center">
              <p className="mb-4 text-sm font-medium text-foreground">GSTR-1 Format (B2B + B2C Data)</p>
              <Button variant="outline" className="w-full border-accent/50 text-accent hover:bg-accent/10">
                <Download className="mr-2 h-4 w-4" /> Export GST data for {currentMonth}
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4 border-t border-border pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Collections</h2>
          <Card className="glass-panel">
            <CardContent className="space-y-3 p-5">
              {invoices.filter((invoice) => Number(invoice.amount_due || 0) > 0).length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending collections right now.</p>
              ) : (
                invoices
                  .filter((invoice) => Number(invoice.amount_due || 0) > 0)
                  .slice(0, 5)
                  .map((invoice) => (
                    <Link
                      key={invoice.id}
                      href="/finance/outstanding"
                      className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/55 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{invoice.invoice_number}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{invoice.contact?.name || "Client"}</p>
                      </div>
                      <span className="text-sm font-semibold text-red-400">{formatCurrency(Number(invoice.amount_due || 0))}</span>
                    </Link>
                  ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
