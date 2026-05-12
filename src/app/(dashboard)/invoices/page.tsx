"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, MessageCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { invoicesApi } from "@/lib/api/invoices";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { generatePaymentReminderWhatsAppMessage, generateWhatsAppLink } from "@/lib/utils/whatsapp";
import { useToast } from "@/components/ui/Toaster";
import type { Invoice } from "@/types/database";

const statusConfig: Record<string, string> = {
  sent: "text-blue-400",
  draft: "text-amber-400",
  partial: "text-orange-400",
  paid: "text-green-400",
  overdue: "text-red-400",
  cancelled: "text-muted-foreground",
};

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const { organization } = useStore();
  const { toast } = useToast();
  const [sharingId, setSharingId] = useState<string | null>(null);

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["invoices-list"],
    queryFn: () => invoicesApi.list(),
  });

  const filtered = invoices.filter((invoice) => {
    const query = search.toLowerCase();
    return (
      query === "" ||
      invoice.invoice_number.toLowerCase().includes(query) ||
      (invoice.contact?.name || "").toLowerCase().includes(query)
    );
  });

  const handleWhatsApp = async (e: React.MouseEvent, invoice: Invoice) => {
    e.preventDefault();
    e.stopPropagation();
    if (invoice.amount_due <= 0) return;
    setSharingId(invoice.id);
    try {
      const link = await invoicesApi.createShareLink(invoice.id, `Invoice ${invoice.invoice_number}`);
      const shareUrl = `${window.location.origin}/share/${link.token}`;
      const upiLink = organization?.upi_id
        ? `\n\nPay directly via UPI:\nupi://pay?pa=${organization.upi_id}&pn=${organization?.name.replace(/ /g, '%20')}&am=${invoice.amount_due}&cu=INR`
        : "";
      const message = generatePaymentReminderWhatsAppMessage(
        invoice.contact?.name || "Client",
        invoice.invoice_number,
        formatCurrency(invoice.amount_due),
        shareUrl, upiLink
      );
      window.open(generateWhatsAppLink(invoice.contact?.phone, message), "_blank");
    } catch {
      toast("Failed to create share link", "error");
    } finally {
      setSharingId(null);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <PageHeader title="Bills" subtitle={`${invoices.length} bills`} addHref="/invoices/new" />

      <div className="px-5 py-3 xl:px-8">
        <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Open any bill to view PDF, copy link, share it, or edit it before payment starts.
          </p>
        </div>
      </div>

      <div className="px-5 pb-3 xl:px-8">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by bill number or client"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 pl-10"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 px-5 pb-4 xl:px-8">
        {filtered.length === 0 ? (
          <EmptyState
            type="invoices"
            title="No bills found"
            description={search ? "Try a different search term" : "Create your first bill to start collecting payments"}
            action={
              !search ? (
                <Link href="/invoices/new" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white">
                  + New Bill
                </Link>
              ) : undefined
            }
          />
        ) : (
          filtered.map((invoice) => (
            <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
              <Card className="glass-panel transition-colors hover:bg-white/[0.03]">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-accent shrink-0" />
                      <p className="truncate text-sm font-semibold text-foreground">{invoice.invoice_number}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {invoice.contact?.name || "Direct bill"} • {new Date(invoice.date).toLocaleDateString("en-IN")}
                    </p>
                    <p className={cn("mt-2 text-xs font-semibold uppercase tracking-[0.18em]", statusConfig[invoice.status] || "text-muted-foreground")}>
                      {invoice.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {invoice.amount_due > 0 && (
                      <button
                        onClick={(e) => handleWhatsApp(e, invoice)}
                        disabled={sharingId === invoice.id}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors active:scale-95"
                        title="Send WhatsApp reminder"
                      >
                        <MessageCircle className={cn("h-4 w-4", sharingId === invoice.id && "animate-pulse")} />
                      </button>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(invoice.total || 0))}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Due {formatCurrency(Number(invoice.amount_due || 0))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
