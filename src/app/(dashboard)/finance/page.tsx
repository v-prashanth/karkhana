"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CreditCard,
  FileText,
  IndianRupee,
  Receipt,
  TrendingUp,
  Wallet,
  Inbox,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { expensesApi } from "@/lib/api/expenses";
import { invoicesApi } from "@/lib/api/invoices";
import { paymentsApi } from "@/lib/api/payments";
import { sharingApi } from "@/lib/api/sharing";
import { useToast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils/currency";
import type { Expense, Invoice, Payment, ReceivedDocument } from "@/types/database";
import { Share2 } from "lucide-react";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "expenses">("overview");
  const organization = useStore((state) => state.organization);

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["finance-invoices", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => invoicesApi.list(),
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["finance-payments", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => paymentsApi.list(),
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["finance-expenses", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => expensesApi.list(),
  });

  const { data: receivedDocs = [] } = useQuery<ReceivedDocument[]>({
    queryKey: ["received-docs-count", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => sharingApi.getReceivedDocs(),
  });

  const newReceivedCount = receivedDocs.filter((d) => d.status === "new").length;

  const income = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0);
  const profit = income - expenseTotal;
  const { toast } = useToast();

  const handleShare = async (e: React.MouseEvent, docId: string, docNumber: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { url } = await sharingApi.createShareLink(docId, 'invoice');
      const text = `Invoice from ${organization?.name}\n\nInvoice No: ${docNumber}\nView document: ${url}\n\nManaged with Karkhana`;
      
      if (navigator.share) {
        await navigator.share({ title: `Invoice ${docNumber}`, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard! You can now paste it in WhatsApp.", "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to generate link", "error");
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <PageHeader title="Money" subtitle="Bills, payments, and expenses" />

      <div className="mx-5 mb-4 flex gap-1 rounded-xl glass p-1 xl:mx-8 xl:mb-6 xl:max-w-md">
        {(["overview", "invoices", "expenses"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-all",
              activeTab === tab ? "bg-accent text-white" : "text-muted-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-4 px-5 xl:space-y-6 xl:px-8">
          {/* Received Inbox Card */}
          <Link href="/finance/inbox">
            <Card className="glass-panel group relative border-accent/20 bg-accent/5 transition-all hover:bg-accent/10">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-[0_0_20px_rgba(255,107,43,0.3)]">
                    <Inbox className="h-6 w-6" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Received Inbox</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase text-muted-foreground">
                      {newReceivedCount > 0 ? (
                        <span className="flex items-center gap-1 text-accent">
                          <Zap className="h-2.5 w-2.5 fill-accent" /> {newReceivedCount} New Documents
                        </span>
                      ) : (
                        "No new documents from partners"
                      )}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-accent transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>

          {/* Network Trust Message */}
          <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/40 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <p className="text-[9px] font-black uppercase italic leading-tight tracking-widest text-[#444]">
              Synced with the <span className="text-white">Karkhana Network</span> for zero-manual data entry.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Card className="glass-panel border-l-2 border-l-green-500/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-green-400">Income</span>
                </div>
                <p className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(income)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Recorded payments</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-l-2 border-l-red-500/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Expense</span>
                </div>
                <p className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(expenseTotal)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{expenses.length} entries logged</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-l-2 border-l-blue-500/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Outstanding</span>
                </div>
                <p className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(outstanding)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Awaiting collection</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-l-2 border-l-purple-500/50">
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">Net</span>
                </div>
                <p className="text-xl font-bold tracking-tight text-foreground">{formatCurrency(profit)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Payments minus expenses</p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-panel">
            <CardContent className="p-5 text-center">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cash Position</p>
              <p className={`text-3xl font-bold tracking-tight ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {formatCurrency(profit)}
              </p>
            </CardContent>
          </Card>

          <Link href="/finance/outstanding">
            <Card className="glass-panel transition-colors hover:bg-white/[0.03]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                    <Wallet className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pending collection</p>
                    <p className="text-[11px] text-muted-foreground">{formatCurrency(outstanding)} still to collect</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>

          <div className="space-y-3">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Payments</h2>
            <Card className="glass-panel">
              <CardContent className="space-y-3 p-4">
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
                ) : (
                  payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{payment.contact?.name || "Payment received"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(payment.date).toLocaleDateString("en-IN")} • {payment.method}</p>
                      </div>
                      <p className="text-sm font-semibold text-green-400">{formatCurrency(Number(payment.amount || 0))}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick Links</h2>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Link href="/invoices/new">
                <Card className="glass-panel transition-colors hover:bg-white/[0.03]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-semibold text-foreground">New Bill</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/expenses/new">
                <Card className="glass-panel transition-colors hover:bg-white/[0.03]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Receipt className="h-5 w-5 text-amber-400" />
                    <span className="text-sm font-semibold text-foreground">Add Expense</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/payments">
                <Card className="glass-panel transition-colors hover:bg-white/[0.03]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <CreditCard className="h-5 w-5 text-green-400" />
                    <span className="text-sm font-semibold text-foreground">Payments</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/reports">
                <Card className="glass-panel transition-colors hover:bg-white/[0.03]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    <span className="text-sm font-semibold text-foreground">Reports</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "invoices" ? (
        <div className="space-y-3 px-5 xl:px-8">
          {invoices.length === 0 ? (
            <Card className="glass-panel">
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-3 text-sm text-muted-foreground">No invoices created yet</p>
                <Link href="/invoices/new" className="inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white">
                  Create Invoice
                </Link>
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice) => (
              <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                <Card className="glass-panel transition-colors hover:bg-white/[0.03]">
                  <CardContent className="flex items-center justify-between gap-4 p-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{invoice.invoice_number}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{invoice.contact?.name || "Direct bill"} • {new Date(invoice.date).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(invoice.total || 0))}</p>
                        <p className="mt-1 text-xs text-muted-foreground italic">Due {formatCurrency(Number(invoice.amount_due || 0))}</p>
                      </div>
                      <button 
                        onClick={(e) => handleShare(e, invoice.id, invoice.invoice_number)}
                        className="p-2.5 glass rounded-xl text-accent hover:bg-accent/10 transition-all border border-accent/20"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      ) : null}

      {activeTab === "expenses" ? (
        <div className="space-y-3 px-5 xl:px-8">
          {expenses.length === 0 ? (
            <Card className="glass-panel">
              <CardContent className="p-8 text-center">
                <Receipt className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-3 text-sm text-muted-foreground">No expenses logged yet</p>
                <Link href="/expenses/new" className="inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white">
                  Log Expense
                </Link>
              </CardContent>
            </Card>
          ) : (
            expenses.map((expense) => (
              <Card key={expense.id} className="glass-panel">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{expense.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{expense.category?.name || "Uncategorized"} • {new Date(expense.date).toLocaleDateString("en-IN")}</p>
                  </div>
                  <p className="text-sm font-semibold text-red-400">{formatCurrency(Number(expense.amount || 0))}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : null}
    </main>
  );
}
