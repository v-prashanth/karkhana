"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Percent,
  Wallet,
  IndianRupee,
  Activity,
  Plus,
  Box,
  Hammer,
  ArrowRight,
  Eye,
  FileSpreadsheet
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { costsApi } from "@/lib/api/costs";
import { QuickCostLogModal } from "@/components/costing/QuickCostLogModal";
import { CostBreakdownModal } from "@/components/costing/CostBreakdownModal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TargetProgressCard } from "@/components/targets/TargetProgressCard";

export default function CostingPage() {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedOrderDescription, setSelectedOrderDescription] = useState("");
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);

  // 1. Fetch costing & margin aggregates
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["costing-margins"],
    queryFn: () => costsApi.getMargins(),
  });

  const summaries = data?.summaries || [];
  const metrics = data?.metrics || {
    totalRevenue: 0,
    totalCosts: 0,
    totalProfit: 0,
    averageMarginPercentage: 0,
    materialTotal: 0,
    laborTotal: 0,
    outsourcingTotal: 0,
    otherTotal: 0
  };

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getMarginBadgeClasses = (pct: number) => {
    if (pct >= 40) return "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.15)]";
    if (pct >= 20) return "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]";
    if (pct > 0) return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]";
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
      case "invoiced":
        return "bg-green-500/20 text-green-400";
      case "in_progress":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-blue-500/20 text-blue-400";
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pb-24 text-foreground">
      {/* Background radial overlays */}
      <div className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/3 rounded-full bg-accent/3 blur-[150px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/3 translate-y-1/3 rounded-full bg-green-500/2 blur-[120px]" />

      <PageHeader 
        title="Cost & Margin Center" 
        subtitle="Track product costs, labor hours, and operational profit margins" 
      />

      <div className="max-w-7xl mx-auto p-5 xl:p-8 space-y-8">
        
        {isLoading ? (
          <div className="flex py-32 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : (
          <>
            <TargetProgressCard />

            {/* Global Costing KPIs Cards grid */}
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <Card className="glass-panel overflow-hidden border-l-2 border-l-green-500/50 relative">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Total Booked Value</span>
                  </div>
                  <p className="text-xl font-black text-white">{formatCurrency(metrics.totalRevenue)}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Cumulative quoted value</p>
                </CardContent>
              </Card>

              <Card className="glass-panel overflow-hidden border-l-2 border-l-red-500/50 relative">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-red-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Total Direct Cost</span>
                  </div>
                  <p className="text-xl font-black text-white">{formatCurrency(metrics.totalCosts)}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Production expenses assigned</p>
                </CardContent>
              </Card>

              <Card className="glass-panel overflow-hidden border-l-2 border-l-blue-500/50 relative">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-blue-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Net Gross Profit</span>
                  </div>
                  <p className="text-xl font-black text-white">{formatCurrency(metrics.totalProfit)}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Profit across all quoted items</p>
                </CardContent>
              </Card>

              <Card className="glass-panel overflow-hidden border-l-2 border-l-accent/50 relative bg-gradient-to-br from-[#121212] to-[#080808]">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Percent className="h-4 w-4 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-accent italic">Average Profit Margin</span>
                  </div>
                  <p className="text-xl font-black text-white italic">{metrics.averageMarginPercentage}%</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Average operational margin</p>
                </CardContent>
              </Card>
            </section>

            {/* Direct Cost Categories Breakdown Deck */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666] italic">
                Direct Cost Allocation
              </h3>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                    <Box className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Raw Materials</span>
                    <span className="text-lg font-black text-white">{formatCurrency(metrics.materialTotal)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                    <Hammer className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Labor Wages</span>
                    <span className="text-lg font-black text-white">{formatCurrency(metrics.laborTotal)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Outsourcing Bending/Laser</span>
                    <span className="text-lg font-black text-white">{formatCurrency(metrics.outsourcingTotal)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 text-muted-foreground">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">Custom / Shipping</span>
                    <span className="text-lg font-black text-white">{formatCurrency(metrics.otherTotal)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Central Profit Margins List */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666] italic">
                  Job Profitability Log
                </h3>
                <Button
                  onClick={() => setIsLogOpen(true)}
                  className="cred-btn-gold h-10 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Log Production Cost
                </Button>
              </div>

              {summaries.length === 0 ? (
                <EmptyState
                  type="orders"
                  title="No costing logs recorded"
                  description="Complete a quote or create a new job to start allocating direct expenses."
                />
              ) : (
                <div className="grid gap-3">
                  {summaries.map((summary) => (
                    <motion.div
                      key={summary.orderId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="glass-panel border-white/5 bg-[#090909] hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                        {/* Interactive inner layout */}
                        <CardContent className="p-5">
                          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr_1fr_120px] gap-6 items-center">
                            
                            {/* Job info */}
                            <div className="min-w-0 text-left">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase text-accent tracking-wider font-semibold">
                                  {summary.clientName}
                                </span>
                                <span className={cn("text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full", getJobStatusColor(summary.status))}>
                                  {summary.status}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-white uppercase italic leading-snug truncate">
                                {summary.description}
                              </h4>
                              {summary.orderNumber && (
                                <span className="text-[9px] text-muted-foreground font-mono block mt-0.5">
                                  Order Ref: {summary.orderNumber}
                                </span>
                              )}
                            </div>

                            {/* Quoted vs Direct Cost */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-left">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Selling Price</span>
                                <span className="text-sm font-bold text-white font-mono">{formatCurrency(summary.sellingPrice)}</span>
                              </div>
                              <div className="text-left">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Direct Costs</span>
                                <span className="text-sm font-bold text-white/70 font-mono">{formatCurrency(summary.totalCost)}</span>
                              </div>
                            </div>

                            {/* Net Profit amount */}
                            <div className="text-left xl:text-center">
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Net Margin Value</span>
                              <span className={cn("text-base font-black font-mono", summary.profit >= 0 ? "text-green-400" : "text-red-400")}>
                                {formatCurrency(summary.profit)}
                              </span>
                            </div>

                            {/* Margin Badge pill */}
                            <div className="flex items-center xl:justify-end gap-3">
                              <span className={cn("text-xs font-black italic border px-3 py-1.5 rounded-xl block min-w-[55px] text-center", getMarginBadgeClasses(summary.marginPercentage))}>
                                {summary.marginPercentage}%
                              </span>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity ml-auto xl:ml-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrderId(summary.orderId);
                                    setSelectedOrderDescription(summary.description);
                                    setSelectedOrderNumber(summary.orderNumber);
                                    setIsBreakdownOpen(true);
                                  }}
                                  className="h-9 w-9 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/5 flex items-center justify-center p-0"
                                >
                                  <Eye className="h-4 w-4 text-white/70" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrderId(summary.orderId);
                                    setIsLogOpen(true);
                                  }}
                                  className="h-9 w-9 rounded-lg border border-accent/20 bg-accent/5 hover:bg-accent/10 flex items-center justify-center p-0"
                                >
                                  <Plus className="h-4 w-4 text-accent" />
                                </Button>
                              </div>
                            </div>

                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* QUICK LOG COST ENTRY MODAL */}
      <QuickCostLogModal
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        defaultOrderId={selectedOrderId}
        onSuccess={() => {
          refetch();
          setSelectedOrderId("");
        }}
      />

      {/* DETAILED COST BREAKDOWN CHECKLIST MODAL */}
      <CostBreakdownModal
        isOpen={isBreakdownOpen}
        onClose={() => setIsBreakdownOpen(false)}
        orderId={selectedOrderId}
        orderDescription={selectedOrderDescription}
        orderNumber={selectedOrderNumber}
        onSuccess={() => {
          refetch();
        }}
      />
    </main>
  );
}
