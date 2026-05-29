"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Trash2, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { targetsApi } from "@/lib/api/targets";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";

interface TargetSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTarget?: {
    id: string;
    annual_amount: number;
    target_type: string;
  };
  targetType: "revenue" | "collections" | "production";
  onSuccess: () => void;
}

export function TargetSetupModal({
  isOpen,
  onClose,
  activeTarget,
  targetType,
  onSuccess,
}: TargetSetupModalProps) {
  const [annualAmount, setAnnualAmount] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default state when target or type changes
  useEffect(() => {
    if (activeTarget) {
      setAnnualAmount(String(activeTarget.annual_amount));
    } else {
      // Elegant prefill suggestion: Revenue/Collections default to 12L/year, Production to 60/year
      setAnnualAmount(targetType === "production" ? "120" : "1200000");
    }
    setErrorMsg(null);
  }, [activeTarget, targetType, isOpen]);

  const numAnnual = Number(annualAmount) || 0;
  const numMonthly = Math.round((numAnnual / 12) * 100) / 100;

  // Formatting helpers
  const formatCurrency = (val: number) => {
    if (targetType === "production") {
      return `${val} Job${val !== 1 ? "s" : ""}`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case "revenue":
        return "Revenue (Sales)";
      case "collections":
        return "Collections";
      default:
        return "Production (Jobs Completed)";
    }
  };

  // TanStack Query Mutations for saving and deleting
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (numAnnual <= 0) {
        throw new Error("Goal must be greater than zero");
      }
      return targetsApi.create({
        target_type: targetType,
        annual_amount: numAnnual,
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to save target");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return targetsApi.delete(undefined, targetType);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to remove target");
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dark Glassmorphic Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Premium CRED Neumorphic Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="w-full max-w-md bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.8)] z-10"
          >
            {/* Ambient Gold Glowing background element */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white italic">
                  {activeTarget ? "Adjust Business Goal" : "Set Target Goal"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Body Form */}
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  Target Field
                </span>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/95 font-bold uppercase tracking-wider">
                  {getTargetTypeLabel(targetType)}
                </div>
              </div>

              {/* Annual Input Field */}
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                  Annual Target Amount
                </span>
                <div className="relative">
                  <Input
                    type="number"
                    value={annualAmount}
                    onChange={(e) => setAnnualAmount(e.target.value)}
                    placeholder="Enter annual amount"
                    className="cred-inset pr-16 text-white text-lg font-bold"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-white/5 px-2 py-1 rounded-md border border-white/5">
                    {targetType === "production" ? "Units" : "INR/Year"}
                  </div>
                </div>
              </div>

              {/* Monthly breakdown visualizer */}
              <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 relative group">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                  Monthly Run Rate Needed
                </span>
                <span className="text-2xl font-black text-white italic tracking-tight">
                  {formatCurrency(numMonthly)}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-1 leading-relaxed">
                  The system will automatically compute your monthly target relative to this pacing.
                </span>
              </div>

              {/* Smart Helper suggestions */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#090909] border border-white/5">
                <Zap className="h-4.5 w-4.5 text-accent shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong>CEO Rule of Thumb:</strong> For {targetType === "revenue" ? "sales growth" : "cash efficiency"}, a target of{" "}
                  <strong className="text-white">
                    {targetType === "production" ? "60 units/year" : "₹12,00,000/year"}
                  </strong>{" "}
                  is typical for small businesses scaling up operations.
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-white/5">
              {activeTarget ? (
                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to deactivate and remove this target?")) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="rounded-xl px-4 gap-1.5 h-12 text-xs font-bold uppercase tracking-wider hover:bg-error/90"
                  disabled={deleteMutation.isPending || saveMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Deactivate
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="h-12 rounded-xl px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white"
                  disabled={saveMutation.isPending}
                >
                  Cancel
                </Button>

                <Button
                  onClick={() => saveMutation.mutate()}
                  className="cred-btn-gold h-12 px-6 rounded-xl font-bold uppercase tracking-wider text-xs gap-1.5"
                  disabled={saveMutation.isPending}
                >
                  <Check className="h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Goal"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
