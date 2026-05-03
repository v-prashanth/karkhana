"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Filter, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { expensesApi } from "@/lib/api/expenses";
import { invoicesApi } from "@/lib/api/invoices";
import { paymentsApi } from "@/lib/api/payments";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils/currency";
import { downloadBusinessSummaryExcel, downloadGSTR1Excel } from "@/lib/utils/excel";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";
import type { Expense, Invoice, Payment } from "@/types/database";

function isOverdue(invoice: Invoice): boolean {
  if (!invoice.due_date || Number(invoice.amount_due || 0) <= 0) return false;
  return new Date(invoice.due_date).getTime() < Date.now();
}

function daysOverdue(invoice: Invoice): number {
  if (!invoice.due_date) return 0;
  const diff = Date.now() - new Date(invoice.due_date).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function ReportsPage() {
  const organization = useStore((state) => state.organization);
  const currentMonth = new Date().toLocaleString("en-IN", { month: "long", year: "numeric" });
  const { toast } = useToast();

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
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const overdueInvoices = invoices.filter(isOverdue).sort((a, b) => daysOverdue(b) - daysOverdue(a));

  const handleDownloadExcel = () => {
    if (invoices.length === 0 && payments.length === 0 && expenses.length === 0) {
      toast("No data to export yet. Create some invoices first.", "info");
      return;
    }
    downloadBusinessSummaryExcel(invoices, payments, expenses, currentMonth);
    toast("Excel report downloaded!", "success");
  };

  const handleDownloadGST = () => {
    if (invoices.length === 0) {
      toast("No invoices to export. Create some invoices first.", "info");
      return;
    }
    downloadGSTR1Excel(invoices, currentMonth);
    toast("GSTR-1 data exported!", "success");
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Reports"
        subtitle="CA-ready summaries"
        backHref="/home"
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
                <span className="font-medium text-amber-400">Expenses</span>
                <span className="text-lg font-semibold text-amber-400">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/[0.02]">
                <span className="font-bold text-foreground">Net Cash Flow</span>
                <span className={cn("text-lg font-black", (totalReceived - totalExpenses) >= 0 ? "text-green-400" : "text-red-400")}>
                  {formatCurrency(totalReceived - totalExpenses)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-medium text-muted-foreground">Invoices Generated</span>
                <span className="flex items-center text-lg font-semibold text-foreground">
                  <FileText className="mr-2 h-4 w-4" /> {invoices.length}
                </span>
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleDownloadExcel} className="w-full" size="lg">
            <Download className="mr-2 h-4 w-4" /> Download Excel Report
          </Button>
        </section>

        {/* Overdue Invoices — NEW */}
        {overdueInvoices.length > 0 && (
          <section className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400">Overdue Invoices ({overdueInvoices.length})</h2>
            </div>
            <Card className="glass-panel border-red-500/10">
              <CardContent className="space-y-2 p-4">
                {overdueInvoices.slice(0, 8).map((invoice) => {
                  const days = daysOverdue(invoice);
                  return (
                    <Link
                      key={invoice.id}
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center justify-between rounded-2xl border border-red-500/10 bg-red-500/[0.03] px-4 py-3 transition-colors hover:bg-red-500/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                          <Clock className="h-4 w-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{invoice.invoice_number}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{invoice.contact?.name || "Client"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-red-400">{formatCurrency(Number(invoice.amount_due || 0))}</p>
                        <p className="text-[9px] font-black text-red-400/60 uppercase italic">{days}d overdue</p>
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        )}

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
              <p className="mb-4 text-sm font-medium text-foreground">GSTR-1 Format (B2B + B2C + HSN Summary)</p>
              <Button onClick={handleDownloadGST} variant="outline" className="w-full border-accent/50 text-accent hover:bg-accent/10">
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
                      href={`/invoices/${invoice.id}`}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3",
                        isOverdue(invoice)
                          ? "border-red-500/20 bg-red-500/[0.03]"
                          : "border-border/60 bg-background/55"
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{invoice.invoice_number}</p>
                          {isOverdue(invoice) && (
                            <span className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                              {daysOverdue(invoice)}d overdue
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{invoice.contact?.name || "Client"}</p>
                      </div>
                      <span className={cn("text-sm font-semibold", isOverdue(invoice) ? "text-red-400" : "text-foreground")}>
                        {formatCurrency(Number(invoice.amount_due || 0))}
                      </span>
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
