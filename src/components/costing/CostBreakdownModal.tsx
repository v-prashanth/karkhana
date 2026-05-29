"use client";

import React, { useState } from "react";
import { X, Trash2, ShieldCheck, Box, Hammer, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { costsApi } from "@/lib/api/costs";
import { motion, AnimatePresence } from "framer-motion";

interface CostBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderDescription: string;
  orderNumber: string | null;
  onSuccess: () => void;
}

export function CostBreakdownModal({
  isOpen,
  onClose,
  orderId,
  orderDescription,
  orderNumber,
  onSuccess,
}: CostBreakdownModalProps) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch costs list for this order
  const { data: costs = [], isLoading } = useQuery({
    queryKey: ["order-costs-breakdown", orderId],
    queryFn: () => costsApi.list(orderId),
    enabled: isOpen && Boolean(orderId),
  });

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "material":
        return Box;
      case "labor":
        return Hammer;
      case "outsourcing":
        return Activity;
      default:
        return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "material":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "labor":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "outsourcing":
        return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default:
        return "text-muted-foreground bg-white/5 border-white/5";
    }
  };

  // Delete cost item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return costsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-costs-breakdown", orderId] });
      onSuccess();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to remove cost item");
    },
  });

  const totalDirectCost = costs.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)] z-10"
          >
            {/* Ambient Gold glow */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-accent block">
                  Itemized Cost Breakdown
                </span>
                <h3 className="text-sm font-black uppercase tracking-widest text-white italic truncate max-w-[340px] mt-0.5">
                  {orderDescription} {orderNumber ? `(${orderNumber})` : ""}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Body */}
            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
              {isLoading ? (
                <div className="flex py-12 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : costs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.02] border border-white/5 text-white/20">
                    <Box className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                    No Costs Logged Yet
                  </h4>
                  <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                    Tap &quot;Log Cost&quot; on the Margins Center to add materials or labor rates assigned to this job.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {costs.map((cost) => {
                    const Icon = getCategoryIcon(cost.cost_category);
                    const colorClasses = getCategoryColor(cost.cost_category);

                    return (
                      <div
                        key={cost.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center border shrink-0 ${colorClasses}`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 text-left">
                            <h4 className="text-xs font-bold text-white truncate max-w-[240px]">
                              {cost.description}
                            </h4>
                            <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider block mt-0.5">
                              {cost.cost_category} • {new Date(cost.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-black text-white font-mono">
                            {formatCurrency(cost.amount)}
                          </span>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this cost entry?")) {
                                deleteMutation.mutate(cost.id);
                              }
                            }}
                            className="h-8 w-8 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border border-red-500/10"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#666]">
                Total Direct Cost
              </span>
              <span className="text-xl font-black text-white italic tracking-tight">
                {formatCurrency(totalDirectCost)}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
