"use client";

import { MessageSquare, IndianRupee } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { invoicesApi } from "@/lib/api/invoices";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/lib/utils/currency";
import type { Invoice } from "@/types/database";

function getDaysOverdue(dateString?: string | null) {
  if (!dateString) return 0;
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function OutstandingPage() {
  const organization = useStore((state) => state.organization);
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["outstanding-invoices", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => invoicesApi.getOutstanding(),
  });

  const totalDue = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0);

  const getUrgencyStyle = (days: number) => {
    if (days >= 30) return { color: "text-red-400", bg: "bg-red-500/10", border: "border-l-red-500" };
    if (days >= 7) return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-l-amber-500" };
    return { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-l-blue-500" };
  };

  const handleReminder = (invoice: Invoice) => {
    const phone = invoice.contact?.phone?.replace(/\D/g, "") || "";
    const text = `Hello ${invoice.contact?.name || "team"},%0A%0AGentle reminder: Invoice ${invoice.invoice_number} for ${formatCurrency(Number(invoice.amount_due || 0))} is still pending.%0A%0AKindly arrange payment at your earliest convenience.%0A%0AThank you,%0A${organization?.name || "Karkhana workspace"}`;
    const base = phone ? `https://wa.me/91${phone}` : "https://wa.me/";
    window.open(`${base}?text=${text}`, "_blank");
  };

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <PageHeader title="Outstanding" subtitle="Pending collections" backHref="/finance" />

      <div className="px-5 py-3">
        <div className="glass-panel rounded-2xl p-5 text-center">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-red-400">Total Outstanding</p>
          <p className="text-4xl font-extrabold tracking-tighter text-foreground">{formatCurrency(totalDue)}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {invoices.length} unpaid invoice{invoices.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5">
        {invoices.length === 0 ? (
          <EmptyState
            type="payments"
            title="All clear!"
            description="No outstanding payments. All invoices are paid."
          />
        ) : (
          invoices
            .slice()
            .sort((a, b) => getDaysOverdue(b.due_date || b.date) - getDaysOverdue(a.due_date || a.date))
            .map((invoice, index) => {
              const daysOverdue = getDaysOverdue(invoice.due_date || invoice.date);
              const urgency = getUrgencyStyle(daysOverdue);
              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cn("glass-panel overflow-hidden border-l-2", urgency.border)}>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{invoice.contact?.name || "Client"}</h3>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {invoice.invoice_number} • {new Date(invoice.date).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", urgency.bg, urgency.color)}>
                          {daysOverdue}d overdue
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xl font-bold tracking-tight text-foreground">
                          {formatCurrency(Number(invoice.amount_due || 0))}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReminder(invoice)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#25D366]/10 px-3 py-2 text-xs font-semibold text-[#25D366] transition-transform active:scale-95"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Remind
                          </button>
                          <button
                            onClick={() => window.location.assign("/payments")}
                            className="flex items-center gap-1.5 rounded-lg glass px-3 py-2 text-xs font-semibold text-foreground transition-all hover:bg-green-500/10 hover:text-green-400 active:scale-95"
                          >
                            <IndianRupee className="h-3.5 w-3.5" /> Collect
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
        )}
      </div>
    </main>
  );
}
