"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, MessageSquare, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { invoicesApi } from "@/lib/api/invoices";
import { paymentsApi } from "@/lib/api/payments";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils/currency";
import type { Invoice, Payment } from "@/types/database";

export default function PaymentsPage() {
  const organization = useStore((state) => state.organization);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("upi");
  const [reference, setReference] = useState("");

  const { data: outstanding = [] } = useQuery<Invoice[]>({
    queryKey: ["payments-outstanding", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => invoicesApi.getOutstanding(),
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["payments-list", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => paymentsApi.list(),
  });

  const selectedInvoice = useMemo(
    () => outstanding.find((invoice) => invoice.id === selectedInvoiceId),
    [outstanding, selectedInvoiceId]
  );

  const createPayment = useMutation({
    mutationFn: () =>
      paymentsApi.create({
        contact_id: selectedInvoice?.contact_id || null,
        invoice_id: selectedInvoiceId || null,
        amount: Number(amount || 0),
        method: method as "cash" | "upi" | "bank_transfer" | "cheque" | "other",
        reference_number: reference || null,
        date: new Date().toISOString().split("T")[0],
        notes: null,
      }),
    onSuccess: () => {
      toast("Payment recorded", "success");
      setSelectedInvoiceId("");
      setAmount("");
      setMethod("upi");
      setReference("");
      queryClient.invalidateQueries({ queryKey: ["payments-outstanding", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["payments-list", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["finance-invoices", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["finance-payments", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", organization?.id] });
    },
    onError: (error: Error) => {
      toast(error.message || "Could not record payment", "error");
    },
  });

  const totalPending = outstanding.reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0);

  const sendReminder = (invoice: Invoice) => {
    const phone = invoice.contact?.phone?.replace(/\D/g, "") || "";
    const text = `Hello ${invoice.contact?.name || "team"},%0A%0AThis is a gentle reminder for Invoice ${invoice.invoice_number}. Pending amount: ${formatCurrency(Number(invoice.amount_due || 0))}.%0A%0AThank you,%0A${organization?.name || "Karkhana workspace"}`;
    const base = phone ? `https://wa.me/91${phone}` : "https://wa.me/";
    window.open(`${base}?text=${text}`, "_blank");
  };

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <PageHeader title="Payments" subtitle="Record money received" backHref="/finance" />

      <div className="space-y-5 p-5 xl:px-8">
        <Card className="glass-panel">
          <CardContent className="space-y-2 p-5">
            <h2 className="text-base font-semibold text-foreground">Update collections as soon as you receive money</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              This keeps pending amounts correct for every client and helps you know exactly how much is still left to collect.
            </p>
          </CardContent>
        </Card>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-1 text-sm font-medium text-muted-foreground">Total Pending Collection</p>
          <p className="text-4xl font-bold tracking-tight text-foreground">{formatCurrency(totalPending)}</p>
        </div>

        <Card className="glass-panel">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-accent" />
              <p className="text-sm font-semibold text-foreground">Record Payment</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Pick the bill, enter the amount received, and save it. You can record full or part payment.
            </p>

            <select
              value={selectedInvoiceId}
              onChange={(event) => {
                const nextId = event.target.value;
                setSelectedInvoiceId(nextId);
                const invoice = outstanding.find((item) => item.id === nextId);
                setAmount(invoice ? String(Number(invoice.amount_due || 0)) : "");
              }}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Select bill</option>
              {outstanding.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoice_number} - {invoice.contact?.name || "Client"}
                </option>
              ))}
            </select>

            <div className="grid gap-3 md:grid-cols-3">
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                placeholder="Amount received"
              />
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className="h-12 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
              <Input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Reference no. (optional)"
              />
            </div>

            {selectedInvoice ? (
              <div className="rounded-2xl border border-border/60 bg-background/55 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{selectedInvoice.contact?.name || "Client"}</p>
                  <p className="text-muted-foreground">{selectedInvoice.invoice_number}</p>
                </div>
                <div className="mt-2 flex items-center justify-between text-muted-foreground">
                  <span>Still pending</span>
                  <span className="font-semibold text-foreground">{formatCurrency(Number(selectedInvoice.amount_due || 0))}</span>
                </div>
              </div>
            ) : null}

            <Button
              onClick={() => createPayment.mutate()}
              disabled={!selectedInvoiceId || !Number(amount || 0) || createPayment.isPending}
              className="w-full"
            >
              {createPayment.isPending ? "Saving..." : "Save payment"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bills Waiting for Payment</h2>
          {outstanding.length === 0 ? (
            <div className="py-10 text-center text-green-400">
              <CheckCircle2 className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p className="font-medium">All payments cleared</p>
            </div>
          ) : (
            outstanding.map((invoice) => (
              <Card key={invoice.id} className="glass-panel">
                <CardContent className="p-4">
                  <div className="mb-1 flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{invoice.contact?.name || "Client"}</h3>
                    <span className="rounded-md bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-400">
                      Due {formatCurrency(Number(invoice.amount_due || 0))}
                    </span>
                  </div>

                  <div className="mb-4 flex items-center text-sm">
                    <span className="mr-2 text-muted-foreground">{invoice.invoice_number}</span>
                    <div className="mr-2 h-1 w-1 rounded-full bg-border" />
                    <span className="font-medium text-foreground">{new Date(invoice.date).toLocaleDateString("en-IN")}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => sendReminder(invoice)}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25D366]/10 text-sm font-semibold text-[#25D366] transition-transform active:scale-95"
                    >
                      <MessageSquare className="h-4 w-4" /> Send reminder
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInvoiceId(invoice.id);
                        setAmount(String(Number(invoice.amount_due || 0)));
                      }}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-semibold text-foreground transition-all hover:border-green-500/30 hover:bg-green-500/10 hover:text-green-400 active:scale-95"
                    >
                      <PlusCircle className="h-4 w-4" /> Record now
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Payments</h2>
          <Card className="glass-panel">
            <CardContent className="space-y-3 p-4">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                payments.slice(0, 8).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/55 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{payment.contact?.name || "Collection"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(payment.date).toLocaleDateString("en-IN")} • {payment.method}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-green-400">{formatCurrency(Number(payment.amount || 0))}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
