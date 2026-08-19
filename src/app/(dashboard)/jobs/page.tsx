"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ordersApi } from "@/lib/api/orders";
import { getBusinessTemplate } from "@/lib/config/templates";
import { useStore } from "@/store/useStore";
import type { OrderStatus } from "@/types/database";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  received: { label: "Received", color: "text-blue-400", bg: "bg-blue-500/10" },
  in_progress: { label: "In Progress", color: "text-amber-400", bg: "bg-amber-500/10" },
  completed: { label: "Done", color: "text-green-400", bg: "bg-green-500/10" },
  delivered: { label: "Delivered", color: "text-purple-400", bg: "bg-purple-500/10" },
  invoiced: { label: "Invoiced", color: "text-muted-foreground", bg: "bg-white/5" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const organization = useStore((state) => state.organization);
  const template = getBusinessTemplate(organization?.business_type);
  const pluralOrderLabel = `${template.orderLabel}s`;

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.list(),
  });

  const tabs = [
    { id: "all", label: "All" },
    { id: "received", label: "New" },
    { id: "in_progress", label: "Active" },
    { id: "completed", label: "Done" },
    { id: "delivered", label: "Sent" },
  ];

  const allOrders = (ordersQuery.data || []) as Array<{
    id: string;
    contact?: { name?: string | null };
    description: string;
    quantity_completed: number;
    quantity: number | null;
    status: OrderStatus;
    created_at: string;
    priority: "normal" | "urgent";
  }>;

  const filtered = allOrders
    .filter((order) => activeTab === "all" || order.status === activeTab)
    .filter(
      (order) =>
        search === "" ||
        order.description.toLowerCase().includes(search.toLowerCase()) ||
        (order.contact?.name || "").toLowerCase().includes(search.toLowerCase())
    );

  const getDaysOld = (date: string) => {
    const diff = new Date().getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const formatAge = (date: string) => {
    const daysOld = getDaysOld(date);
    if (daysOld <= 0) return "Today";
    if (daysOld === 1) return "Yesterday";
    return `${daysOld}d`;
  };

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <PageHeader title={pluralOrderLabel} subtitle={`${allOrders.length} total`} addHref="/orders/new" />

      <div className="px-5 py-3">
        <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Keep every {template.orderLabel.toLowerCase()} in one place so you can see new work, urgent items, and completed delivery-ready work at a glance.
          </p>
        </div>
      </div>

      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`Search ${pluralOrderLabel.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" />
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
              activeTab === tab.id ? "bg-accent text-white shadow-[0_0_16px_rgba(255,107,43,0.3)]" : "glass text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
        {filtered.length === 0 ? (
          <EmptyState
            type="orders"
            title={`No ${pluralOrderLabel.toLowerCase()} found`}
            description={search ? "Try a different search term" : `Create your first ${template.orderLabel.toLowerCase()} to get started`}
            action={
              !search && (
                <Link href="/orders/new" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white">
                  + New {template.orderLabel}
                </Link>
              )
            }
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filtered.map((order, i) => {
              const status = statusConfig[order.status] || statusConfig.received;
              const daysOld = getDaysOld(order.created_at);
              const progress = order.quantity ? (order.quantity_completed / order.quantity) * 100 : 0;

              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/jobs/${order.id}`}>
                  <Card className={cn("glass-panel group overflow-hidden transition-colors hover:bg-white/[0.03]", order.priority === "urgent" && "border-l-2 border-l-red-500")}>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className={cn("text-[11px] font-bold uppercase tracking-wider", status.color)}>
                              {order.contact?.name || "No contact"}
                            </span>
                            {order.priority === "urgent" && (
                              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-400">URGENT</span>
                            )}
                          </div>
                          <h3 className="truncate font-semibold text-foreground">{order.description}</h3>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", status.bg, status.color)}>
                            {status.label}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {formatAge(order.created_at)}
                          </span>
                        </div>

                        {order.quantity && (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                              <div className={cn("h-full rounded-full transition-all", progress >= 100 ? "bg-green-400" : "bg-accent")} style={{ width: `${Math.min(progress, 100)}%` }} />
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {order.quantity_completed}/{order.quantity}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </main>
  );
}
