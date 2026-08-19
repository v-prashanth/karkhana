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
  ExternalLink,
  Shield,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Loader2,
  Timer
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
import { TargetProgressCard } from "@/components/targets/TargetProgressCard";
import { ActivityFeed } from "@/components/shared/ActivityFeed";

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

    setMounted(true);
  }, [authHydrated]);

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

  const supabase = createClient();

  const { data: leadsData = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ["dashboard-leads-ext", organization?.id],
    enabled: mounted && Boolean(organization?.id),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("external_leads")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    }
  });

  const { data: warrantiesData = [], isLoading: isLoadingWarranties } = useQuery({
    queryKey: ["dashboard-warranties-ext", organization?.id],
    enabled: mounted && Boolean(organization?.id),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("warranties")
          .select("*")
          .order("warranty_expires", { ascending: true });
        if (error) return [];
        return data || [];
      } catch {
        return [];
      }
    }
  });

  const safeLeads = Array.isArray(leadsData) ? leadsData : [];
  const safeWarranties = Array.isArray(warrantiesData) ? warrantiesData : [];

  // Job Work material liability (CGST Sec. 143)
  const { data: jobWorkData = [] } = useQuery({
    queryKey: ["dashboard-job-work-expiry", organization?.id],
    enabled: mounted && Boolean(organization?.id),
    queryFn: async () => {
      try {
        const res = await fetch("/api/job-work");
        if (!res.ok) return [];
        return res.json();
      } catch { return []; }
    },
  });

  const criticalChallans = (Array.isArray(jobWorkData) ? jobWorkData : []).filter((c: { expiry_date: string; status: string }) => {
    if (c.status === "FULLY_RETURNED") return false;
    const days = Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 30;
  });

  // Leads calculations
  const totalLeadsCount = safeLeads.length;
  
  const newLeadsTodayCount = safeLeads.filter(lead => {
    if (!lead?.created_at) return false;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const leadDateStr = new Date(lead.created_at).toISOString().split("T")[0];
      return leadDateStr === todayStr;
    } catch {
      return false;
    }
  }).length;

  // Warranty calculations
  const activeWarrantiesCount = safeWarranties.filter(w => w?.status === "active").length;

  const amcDueThisMonthCount = safeWarranties.filter(w => {
    if (!w?.amc_due_date) return false;
    try {
      const amcDate = new Date(w.amc_due_date);
      if (isNaN(amcDate.getTime())) return false;
      const today = new Date();
      return amcDate.getFullYear() === today.getFullYear() && amcDate.getMonth() === today.getMonth();
    } catch {
      return false;
    }
  }).length;

  // Alerts filtering
  const expiringWarrantiesAlerts = safeWarranties.filter(w => {
    if (!w || w.status !== "active" || !w.warranty_expires) return false;
    try {
      const expires = new Date(w.warranty_expires);
      if (isNaN(expires.getTime())) return false;
      const today = new Date();
      const diffTime = expires.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    } catch {
      return false;
    }
  });

  const amcDueWarrantiesAlerts = safeWarranties.filter(w => {
    if (!w || !w.amc_due_date || w.status === "amc_completed") return false;
    try {
      const amcDue = new Date(w.amc_due_date);
      if (isNaN(amcDue.getTime())) return false;
      const today = new Date();
      const diffTime = amcDue.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    } catch {
      return false;
    }
  });

  // Time Ago helper
  const getLeadTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  // Status mapping colors helper
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "new": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "contacted": return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "site_visit_scheduled": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "quotation_sent": return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "installation_done": return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
      case "completed": return "bg-green-500/10 text-green-400 border border-green-500/20";
      default: return "bg-white/10 text-white/40 border border-white/5";
    }
  };

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

  if (authHydrated && !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#040404] p-5">
        <div className="w-full max-w-md p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-[#101010] to-[#060606] shadow-[6px_6px_16px_rgba(0,0,0,0.8),-3px_-3px_12px_rgba(255,255,255,0.012)] text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
              <ShieldCheck className="h-8 w-8" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white uppercase italic">Connection Issue</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We couldn't load your Karkhana organization profile. This usually happens if your connection is unstable or the database is undergoing maintenance.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full h-12 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-[10px] italic hover:bg-white/90"
            >
              Retry Sync
            </Button>
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="w-full h-12 rounded-xl border-white/10 bg-transparent text-white font-medium hover:bg-white/5"
            >
              Log Out
            </Button>
          </div>
        </div>
      </main>
    );
  }

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
        <TargetProgressCard minimal />

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
                {(template.hasPhysicalMovement
                  ? [
                      { step: "1", title: template.receiveLabel || "Receive Material", body: "Record incoming raw material or goods.", href: "/dc/inward/new" },
                      { step: "2", title: `Track ${template.orderLabel || "Job"}`, body: "Manage active work orders & production.", href: "/jobs" },
                      { step: "3", title: template.dispatchLabel || "Return Material", body: "Dispatch completed work.", href: "/dc/outward/new" },
                      { step: "4", title: "Generate Bill", body: "Convert work to Tax Invoice.", href: "/invoices/new" },
                    ]
                  : [
                      { step: "1", title: "Save contact", body: "Add clients/suppliers with their details.", href: "/clients" },
                      { step: "2", title: `Create ${template.orderLabel || "Task"}`, body: "Track work & project progress.", href: "/jobs" },
                      { step: "3", title: "Create bill", body: "Generate Tax Invoice for client.", href: "/invoices/new" },
                      { step: "4", title: "Record payment", body: "Auto-update balance & collections.", href: "/finance" },
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
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666] italic">Recent Activity History</h2>
            <Link href="/reports" className="text-[10px] font-black text-accent uppercase tracking-widest">Open reports</Link>
          </div>
          <Card className="glass-panel">
            <CardContent className="p-4">
              <ActivityFeed />
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

        {/* NEW EXTENSIONS: Leads and Warranties */}
        <div className="border-t border-white/5 pt-8 space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666] italic">Website Integrations & Services</h2>
          </div>

          {/* New Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Card className="glass-panel border-l-2 border-l-blue-500/50">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Total Leads</span>
                </div>
                <p className="text-xl font-black text-white">{isLoadingLeads ? "..." : totalLeadsCount}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">From connected websites</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-l-2 border-l-indigo-500/50">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-400 animate-pulse" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">New Leads Today</span>
                </div>
                <p className="text-xl font-black text-white">{isLoadingLeads ? "..." : newLeadsTodayCount}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Received in last 24h</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-l-2 border-l-green-500/50">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-green-400">Active Warranties</span>
                </div>
                <p className="text-xl font-black text-white">{isLoadingWarranties ? "..." : activeWarrantiesCount}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Client systems protected</p>
              </CardContent>
            </Card>

            <Card className="glass-panel border-l-2 border-l-orange-500/50">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-400">AMC Due This Month</span>
                </div>
                <p className="text-xl font-black text-white">{isLoadingWarranties ? "..." : amcDueThisMonthCount}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Renewals this calendar month</p>
              </CardContent>
            </Card>
          </div>

          {/* New Sections: Recent Leads & Warranty Alerts */}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            
            {/* Recent Leads */}
            <Card className="glass-panel">
              <CardContent className="p-5 xl:p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-black text-white italic uppercase tracking-tight">Recent Leads</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Latest inquiries received from website integrations</p>
                  </div>
                  <Link href="/leads" className="text-xs font-black text-accent uppercase tracking-widest italic flex items-center gap-1 hover:underline">
                    View All <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-3 flex-1">
                  {isLoadingLeads ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-accent" />
                    </div>
                  ) : safeLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                      <MessageSquare className="h-8 w-8 mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest text-center">No leads recorded</p>
                    </div>
                  ) : (
                    safeLeads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white leading-tight">{lead.name}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {lead.product_interest && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[9px] font-black uppercase tracking-wider text-blue-400 border border-blue-500/20">
                                {lead.product_interest}
                              </span>
                            )}
                            <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider", getStatusColor(lead.status))}>
                              {lead.status ? lead.status.replace("_", " ") : "new"}
                            </span>
                          </div>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase whitespace-nowrap shrink-0">
                          {getLeadTimeAgo(lead.created_at)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Warranty Alerts */}
            {safeWarranties.length > 0 && (
              <Card className="glass-panel">
                <CardContent className="p-5 xl:p-6 flex flex-col h-full">
                  <h2 className="text-lg font-black text-white italic uppercase tracking-tight mb-4">Warranty Alerts</h2>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {expiringWarrantiesAlerts.length === 0 && amcDueWarrantiesAlerts.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-10 text-center text-green-400 bg-green-500/[0.02] border border-green-500/20 rounded-2xl p-4">
                        <ShieldCheck className="h-8 w-8 mb-2" />
                        <p className="text-xs font-black uppercase tracking-widest">All Protected</p>
                        <p className="text-[10px] text-muted-foreground mt-1 font-semibold uppercase leading-normal">
                          All client warranties are active and up to date.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Expiring warranties */}
                        {expiringWarrantiesAlerts.map(w => (
                          <div key={w.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-3 flex flex-col gap-1.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-bold text-white leading-tight">{w.customer_name}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-semibold mt-0.5">{w.product_name}</p>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                                Expiring Soon
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-amber-400 font-mono">
                              <Calendar className="h-3 w-3" />
                              <span>Expires: {w.warranty_expires ? new Date(w.warranty_expires).toLocaleDateString("en-IN") : "N/A"}</span>
                            </div>
                          </div>
                        ))}

                        {/* Due AMCs */}
                        {amcDueWarrantiesAlerts.map(w => (
                          <div key={w.id} className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.03] p-3 flex flex-col gap-1.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-bold text-white leading-tight">{w.customer_name}</p>
                                <p className="text-[9px] text-muted-foreground uppercase font-semibold mt-0.5">{w.product_name}</p>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full border border-orange-500/20">
                                AMC Due
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] text-orange-400 font-mono">
                              <Clock className="h-3 w-3 animate-pulse" />
                              <span>Due Date: {w.amc_due_date ? new Date(w.amc_due_date).toLocaleDateString("en-IN") : "N/A"}</span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* ── Material Liability Widget (Manufacturing) ── */}
        {criticalChallans.length > 0 && (
          <div className="border-t border-white/5 pt-8 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666] italic">Material Liability Alert</h2>
              <Link href="/job-work" className="text-[10px] font-black text-accent uppercase tracking-widest">View all</Link>
            </div>
            <Card className="glass-panel border-red-500/30">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <Timer className="h-5 w-5 text-red-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-red-400 uppercase italic tracking-wide">
                      {criticalChallans.length} Job Work {criticalChallans.length === 1 ? "Challan" : "Challans"} Expiring Soon!
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      CGST Sec. 143 requires return of job work material within 1 year. Material not returned becomes a deemed supply.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {criticalChallans.slice(0, 3).map((c: { id: string; challan_number: string; expiry_date: string; job_worker_name: string }) => {
                    const days = Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000);
                    return (
                      <Link key={c.id} href={`/job-work/${c.id}`}>
                        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.03] px-3 py-2 hover:bg-red-500/[0.06] transition-colors">
                          <div>
                            <p className="text-xs font-bold text-white">#{c.challan_number}</p>
                            <p className="text-[10px] text-muted-foreground">{c.job_worker_name}</p>
                          </div>
                          <span className="text-[10px] font-black text-red-400">{days}d left</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href="/job-work"
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-2.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> Manage Job Work Challans
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

      </motion.div>
    </main>
  );
}
