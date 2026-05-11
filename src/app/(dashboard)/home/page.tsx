"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Hammer,
  IndianRupee,
  LogOut,
  Plus,
  Receipt,
  Settings,
  TrendingUp,
  Wallet,
  ShieldCheck,
  Clock,
  History,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getBusinessTemplate } from "@/lib/config/templates";
import { useStore } from "@/store/useStore";
import { authApi } from "@/lib/api/auth";
import { invoicesApi } from "@/lib/api/invoices";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { useToast } from "@/components/ui/Toaster";
import { generatePaymentReminderWhatsAppMessage, generateWhatsAppLink } from "@/lib/utils/whatsapp";
import type { DashboardMetrics, Invoice } from "@/types/database";

export default function DashboardPage() {
  const router = useRouter();
  const { user, organization, logout, authHydrated } = useStore();
  const [mounted, setMounted] = useState(false);
  const [sharingInvoiceId, setSharingInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();
  const template = getBusinessTemplate(organization?.business_type);

  useEffect(() => {
    if (!authHydrated) {
      // Safety net: if auth doesn't hydrate within 5s, force mount
      // This prevents infinite skeleton on slow networks or edge cases
      const timeout = setTimeout(() => {
        setMounted(true);
      }, 5000);
      return () => clearTimeout(timeout);
    }

    if (!user) {
      router.push("/");
    } else {
      setMounted(true);
    }
  }, [authHydrated, user, organization, router]);

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics", organization?.id],
    enabled: mounted && Boolean(organization?.id),
    queryFn: async () => {
      const response = await fetch("/api/dashboard");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load dashboard");
      }
      return payload as DashboardMetrics;
    },
  });

  const { data: outstandingInvoices = [] } = useQuery<Invoice[]>({
    queryKey: ["dashboard-outstanding", organization?.id],
    enabled: mounted && Boolean(organization?.id),
    queryFn: () => invoicesApi.getOutstanding(),
  });

  const handleWhatsAppReminder = async (invoice: Invoice) => {
    if (!invoice || invoice.amount_due <= 0) return;
    setSharingInvoiceId(invoice.id);

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
        shareUrl,
        upiLink
      );

      const whatsappUrl = generateWhatsAppLink(invoice.contact?.phone, message);
      window.open(whatsappUrl, "_blank");
    } catch (err) {
      toast("Failed to open WhatsApp. Link might be broken.", "error");
    } finally {
      setSharingInvoiceId(null);
    }
  };

  if (!mounted) {
    return (
      <main className="min-h-screen space-y-6 bg-background p-5">
        <div className="h-12 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </main>
    );
  }

  const handleLogout = async () => {
    if (!window.confirm("Log out of Karkhana?")) {
      return;
    }

    try {
      await authApi.signOut();
      logout();
      router.push("/");
    } catch {
      logout();
      router.push("/");
    }
  };

  const stats = [
    {
      href: "/finance",
      label: "Money In",
      helper: "Collected this month",
      value: metrics ? formatCurrency(metrics.revenueThisMonth || 0) : null,
      icon: TrendingUp,
      tint: "text-green-400",
      border: "border-l-green-500/50",
    },
    {
      href: "/finance/outstanding",
      label: "To Collect",
      helper: "Still pending",
      value: metrics ? formatCurrency(metrics.totalOutstanding || 0) : null,
      icon: Wallet,
      tint: "text-red-400",
      border: "border-l-red-500/50",
    },
    {
      href: "/payments",
      label: "Payments",
      helper: "Recorded this month",
      value: metrics ? formatCurrency(metrics.paymentsThisMonth || 0) : null,
      icon: IndianRupee,
      tint: "text-blue-400",
      border: "border-l-blue-500/50",
    },
    {
      href: "/expenses/new",
      label: "Expenses",
      helper: "Recorded this month",
      value: metrics ? formatCurrency(metrics.expensesThisMonth || 0) : null,
      icon: Receipt,
      tint: "text-amber-400",
      border: "border-l-amber-500/50",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pb-24 text-foreground">
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-accent/4 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/3 rounded-full bg-green-500/3 blur-[120px]" />

      <header className="sticky top-0 z-10 border-b border-white/5 bg-background/80 px-5 py-4 backdrop-blur-3xl xl:px-8 xl:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tighter text-white xl:text-3xl uppercase italic leading-none">
                {organization?.name || "My Business"}
              </h1>
              {organization?.is_verified && (
                <div className="bg-accent/10 text-accent p-1 rounded-full">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              )}
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#666]">
              {template.label} • {organization?.is_verified ? "verified account" : "unverified account"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!organization?.is_verified && (
              <Link href="/settings/verification" className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest italic border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                <ShieldCheck className="h-3 w-3" /> Get Verified
              </Link>
            )}
            <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-2xl glass transition-colors hover:bg-white/10 shrink-0">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Link>
            <button onClick={handleLogout} className="flex h-10 w-10 items-center justify-center rounded-2xl glass transition-colors hover:bg-white/10 shrink-0">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile Setup Nudge */}
      {organization && (organization.name === "My Business" || !organization.profile_complete) && (
        <Link href="/setup" className="block mx-5 xl:mx-8 mt-4">
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 flex items-center justify-between hover:bg-accent/10 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Settings className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Complete your Business Profile</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  Add your details to appear on the Karkhana network
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-accent group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 space-y-6 p-5 xl:space-y-8 xl:p-8">
        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <Card className="glass-panel overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <History className="h-32 w-32 text-accent" />
            </div>
            <CardContent className="p-6 xl:p-10 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-accent italic">
                    <Clock className="h-3 w-3" /> Today&apos;s Business
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-white uppercase italic leading-none max-w-xl">
                    {metrics?.totalPayables ? `You have ${formatCurrency(metrics.totalPayables)} in outstanding payables` : "Run today's billing and collections from one place"}
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                    {metrics
                      ? `${formatCurrency(metrics.totalOutstanding || 0)} is still pending, ${metrics.invoiceCount || 0} bills have been created, and ${metrics.expenseCount || 0} expense entries are on record.`
                      : "Track work, bills, collections, and expenses without switching between paper, calculator, and WhatsApp."}
                  </p>
                </div>
                <div className="flex gap-3">
                   <Button onClick={() => router.push('/invoices/new')} size="lg" className="h-14 px-8 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] italic shadow-2xl hover:bg-white/90">
                     New Invoice
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#666]">Cash Snapshot</p>
                  <p className="text-[10px] font-bold text-green-400 uppercase">This Month</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                          <TrendingUp className="h-4 w-4" />
                       </div>
                       <span className="text-[11px] font-bold text-white uppercase tracking-tight">Income</span>
                    </div>
                    <span className="text-sm font-black text-white">
                      {metrics ? formatCurrency(metrics.paymentsThisMonth || 0) : "..."}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                          <Receipt className="h-4 w-4" />
                       </div>
                       <span className="text-[11px] font-bold text-white uppercase tracking-tight">Expenses</span>
                    </div>
                    <span className="text-sm font-black text-white">
                      {metrics ? formatCurrency(metrics.expensesThisMonth || 0) : "..."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#666]">Net Cash</p>
                <p className={cn("text-xl font-black", (metrics?.paymentsThisMonth || 0) - (metrics?.expensesThisMonth || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                  {formatCurrency((metrics?.paymentsThisMonth || 0) - (metrics?.expensesThisMonth || 0))}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className={cn("glass-panel overflow-hidden border-l-2 transition-colors hover:bg-white/[0.02]", stat.border)}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <stat.icon className={cn("h-4 w-4", stat.tint)} />
                    <span className={cn("text-[11px] font-semibold uppercase tracking-wider", stat.tint)}>{stat.label}</span>
                  </div>
                  {stat.value ? (
                    <p className="text-xl font-black text-white">{stat.value}</p>
                  ) : (
                    <div className="mt-2 h-6 w-24 animate-pulse rounded bg-white/10" />
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">{stat.helper}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Card className="glass-panel">
            <CardContent className="p-5 xl:p-6">
              <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Daily Guide</h2>
              <p className="mt-1 text-sm text-muted-foreground">The simple flow for Bharat&apos;s businesses.</p>
              <div className="mt-5 grid gap-3 xl:grid-cols-2">
                {(organization?.business_type === "manufacturing"
                  ? [
                      { step: "1", title: "Inward DC", body: "Record incoming raw material.", href: "/dc/inward/new" },
                      { step: "2", title: "Track Job", body: "Manage CNC/fabrication production.", href: "/orders/new" },
                      { step: "3", title: "Outward DC", body: "Dispatch finished goods.", href: "/dc/outward/new" },
                      { step: "4", title: "Generate Bill", body: "Convert DC to Invoice.", href: "/invoices/new" },
                    ]
                  : [
                      { step: "1", title: "Save contact", body: "Add clients/suppliers with their +91 phone numbers.", href: "/contacts/new" },
                      { step: "2", title: "Create bill", body: "Generate PDF/Link invoices instantly.", href: "/invoices/new" },
                      { step: "3", title: "Send via WhatsApp", body: "1-Tap delivery to their phone with UPI link.", href: "/invoices" },
                      { step: "4", title: "Record payment", body: "Auto-update outstanding balances on dashboard.", href: "/payments" },
                    ]
                ).map((item) => (
                  <Link key={item.step} href={item.href} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-black text-accent italic">
                        {item.step}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{item.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body }</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="p-5 xl:p-6 flex flex-col h-full">
              <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Need Attention</h2>
              <div className="mt-4 flex-1 flex flex-col">
                <div className="rounded-2xl border border-white/5 bg-accent/5 p-4 mb-4">
                  <p className="text-[10px] font-bold text-accent uppercase tracking-widest">To Collect</p>
                  <p className="mt-1 text-2xl font-black text-white italic">{formatCurrency(metrics?.totalOutstanding || 0)}</p>
                </div>
                
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {outstandingInvoices.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-6 opacity-30">
                      <ShieldCheck className="h-8 w-8 mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest text-center">All caught up</p>
                    </div>
                  ) : (
                    outstandingInvoices.slice(0, 3).map((inv) => {
                      const overdueDays = inv.due_date && new Date(inv.due_date).getTime() < Date.now()
                        ? Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      return (
                      <div key={inv.id} className={cn("rounded-2xl border p-3 flex flex-col gap-2", overdueDays > 0 ? "border-red-500/20 bg-red-500/[0.03]" : "border-white/5 bg-white/[0.02]")}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-white leading-tight">{inv.contact?.name}</p>
                              {overdueDays > 0 && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                                  {overdueDays}d overdue
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase">{inv.invoice_number}</p>
                          </div>
                          <p className="text-xs font-black text-red-400">{formatCurrency(Number(inv.amount_due))}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full mt-1 bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 hover:text-green-300 transition-colors uppercase tracking-widest font-black text-[9px] italic"
                          onClick={(e) => { e.preventDefault(); handleWhatsAppReminder(inv); }}
                          disabled={sharingInvoiceId === inv.id}
                        >
                          <MessageCircle className="h-3 w-3 mr-1.5" />
                          {sharingInvoiceId === inv.id ? "Opening..." : "WhatsApp Follow-up"}
                        </Button>
                      </div>
                      );
                    })
                  )}
                </div>

                <Link href="/finance/outstanding" className="inline-flex items-center gap-2 text-xs font-black text-accent uppercase tracking-widest italic group pt-4 mt-auto border-t border-white/5 w-full justify-center">
                  View all {outstandingInvoices.length > 3 ? `(${outstandingInvoices.length})` : ""}
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666] italic">Recent Activity</h2>
            <Link href="/reports" className="text-[10px] font-black text-accent uppercase tracking-widest">Open reports</Link>
          </div>
          <Card className="glass-panel">
            <CardContent className="space-y-3 p-4">
              {(metrics?.recentActivity || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center opacity-30">
                  <Hammer className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground italic font-bold">No activity in the diary yet.</p>
                </div>
              ) : (
                metrics?.recentActivity.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{activity.title}</p>
                        <p className="mt-1 text-[10px] font-bold text-muted-foreground uppercase">{activity.subtitle}</p>
                      </div>
                      <div className="text-right">
                        {activity.amount ? <p className="text-sm font-black text-white">{formatCurrency(activity.amount)}</p> : null}
                        <p className="mt-1 text-[10px] font-mono text-muted-foreground uppercase">{new Date(activity.timestamp).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
           <div className="space-y-3">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666] italic">Quick Actions</h2>
             <div className="grid grid-cols-2 gap-3">
               <Link href="/expenses/new" className="hidden lg:block">
                 <Card className="glass-panel border-l-2 border-l-amber-500/50 transition-colors hover:bg-white/[0.03]">
                   <CardContent className="flex items-center gap-3 p-4">
                     <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Receipt className="h-5 w-5" />
                     </div>
                     <span className="text-xs font-black text-white uppercase italic tracking-tight">Log Expense</span>
                   </CardContent>
                 </Card>
               </Link>
               <Link href="/invoices/new">
                 <Card className="glass-panel border-l-2 border-l-blue-500/50 transition-colors hover:bg-white/[0.03]">
                   <CardContent className="flex items-center gap-3 p-4">
                     <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <FileText className="h-5 w-4" />
                     </div>
                     <span className="text-xs font-black text-white uppercase italic tracking-tight">New Bill</span>
                   </CardContent>
                 </Card>
               </Link>
             </div>
           </div>

           <div className="space-y-3">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666] italic">Business Snapshot</h2>
             <Link href="/reports">
               <Card className="glass-panel transition-colors hover:bg-white/[0.03]">
                 <CardContent className="flex items-center justify-between p-4">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 glass rounded-2xl flex items-center justify-center text-muted-foreground">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                         <p className="text-sm font-black text-white uppercase italic tracking-tight">Analytics</p>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase">Reports & Summaries</p>
                      </div>
                   </div>
                   <ArrowRight className="h-4 w-4 text-muted-foreground" />
                 </CardContent>
               </Card>
             </Link>
           </div>
        </section>
      </motion.div>
    </main>
  );
}
