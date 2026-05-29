"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Wallet, Flame, Plus, CheckCircle, BarChart3, Edit3, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { targetsApi } from "@/lib/api/targets";
import { TargetSetupModal } from "./TargetSetupModal";
import { motion, AnimatePresence } from "framer-motion";

export function TargetProgressCard({ minimal = false }: { minimal?: boolean }) {
  const [selectedType, setSelectedType] = useState<"revenue" | "collections" | "production">("revenue");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const queryClient = useQueryClient();

  // 1. Fetch all active targets
  const { data: activeTargets = [], isLoading: isLoadingTargets } = useQuery({
    queryKey: ["activeTargets"],
    queryFn: () => targetsApi.getActive(),
  });

  // 2. Fetch progress for selected type
  const { data: progress, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["targetProgress", selectedType],
    queryFn: () => targetsApi.getProgress(selectedType),
    staleTime: 30000, // 30s cache
  });

  const activeTargetForType = activeTargets.find((t) => t.target_type === selectedType);
  const hasAnyTarget = activeTargets.length > 0;

  // Formatting helpers
  const formatCurrency = (val: number) => {
    if (selectedType === "production") {
      return `${val} Job${val !== 1 ? "s" : ""}`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getTargetTypeIcon = (type: string) => {
    switch (type) {
      case "revenue":
        return TrendingUp;
      case "collections":
        return Wallet;
      default:
        return BarChart3;
    }
  };

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case "revenue":
        return "Revenue (Sales)";
      case "collections":
        return "Collections";
      default:
        return "Production (Jobs)";
    }
  };

  // SVG Circular progress configurations
  const radius = 55;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const percentage = progress?.hasTarget ? Math.min(100, Math.max(0, progress.percentage)) : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  if (minimal) {
    const miniRadius = 16;
    const miniStrokeWidth = 4;
    const miniCircumference = 2 * Math.PI * miniRadius;
    const miniStrokeDashoffset = miniCircumference - (percentage / 100) * miniCircumference;

    return (
      <Link href="/costing" className="block w-full active:scale-[0.99] transition-transform">
        <Card className="glass-panel overflow-hidden border border-white/5 bg-[#090909] hover:bg-white/[0.03] transition-colors relative">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            {isLoadingTargets || isLoadingProgress ? (
              <div className="flex w-full items-center justify-center py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : !progress?.hasTarget ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white">
                    Set up your first business goal
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  {/* Small Circular Progress Ring */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <svg width="44" height="44" className="transform -rotate-90">
                      <circle
                        cx="22"
                        cy="22"
                        r={miniRadius}
                        className="stroke-[#030303]"
                        strokeWidth={miniStrokeWidth}
                        fill="transparent"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r={miniRadius}
                        className="stroke-white/[0.02]"
                        strokeWidth={miniStrokeWidth}
                        fill="transparent"
                      />
                      <circle
                        cx="22"
                        cy="22"
                        r={miniRadius}
                        stroke="url(#goldGradientMini)"
                        strokeWidth={miniStrokeWidth}
                        strokeDasharray={miniCircumference}
                        strokeDashoffset={miniStrokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                      <defs>
                        <linearGradient id="goldGradientMini" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#c5a880" />
                          <stop offset="50%" stopColor="#d4af37" />
                          <stop offset="100%" stopColor="#f3e5ab" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute text-[8px] font-black text-white italic">
                      {progress.percentage}%
                    </span>
                  </div>

                  {/* High level metrics */}
                  <div className="min-w-0 text-left">
                    <span className="text-[8px] font-bold text-accent uppercase tracking-widest block leading-none mb-1">
                      {selectedType} target goal
                    </span>
                    <p className="text-xs font-bold text-white truncate max-w-[220px]">
                      {formatCurrency(progress.current)} of {formatCurrency(progress.monthlyTarget)} achieved
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground hover:text-white shrink-0">
                  {progress.streak > 0 && (
                    <span className="text-[9px] font-bold text-orange-500 flex items-center gap-0.5 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      🔥 {progress.streak}m
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="space-y-4">
      {/* Target Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#666] italic">
          Target & Milestones
        </h2>
        {hasAnyTarget && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 rounded-lg px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-white"
            onClick={() => setIsSetupOpen(true)}
          >
            <Edit3 className="h-3 w-3" />
            Adjust Goal
          </Button>
        )}
      </div>

      {/* Main Premium Neumorphic Target Progress Card */}
      <Card className="glass-panel overflow-hidden border border-white/5 relative bg-[#090909]">
        <CardContent className="p-5">
          {/* Target Type Switcher Pills */}
          <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-5">
            {(["revenue", "collections", "production"] as const).map((type) => {
              const isActive = selectedType === type;
              const hasTargetOfType = activeTargets.some((t) => t.target_type === type);
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "bg-accent/15 text-accent shadow-[0_0_15px_rgba(212,175,55,0.15)] border border-accent/20"
                      : "text-white/40 hover:text-white/70 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {hasTargetOfType && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
                    {type}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {isLoadingTargets || isLoadingProgress ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-44 items-center justify-center"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </motion.div>
            ) : !progress?.hasTarget ? (
              /* elegant CRED CTA Card for No Target */
              <motion.div
                key="no-target"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center text-center py-6 px-4"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.02] border border-white/5 shadow-inner">
                  {React.createElement(getTargetTypeIcon(selectedType), {
                    className: "h-6 w-6 text-white/30",
                  })}
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Track Your {getTargetTypeLabel(selectedType)} Goal
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mb-6 leading-relaxed">
                  Set your target to unlock real-time run-rate projections, progress visualizers, and milestones streak tracking.
                </p>
                <Button
                  onClick={() => setIsSetupOpen(true)}
                  className="cred-btn-gold h-11 px-6 rounded-xl font-bold uppercase tracking-wider text-xs gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Set {selectedType} target
                </Button>
              </motion.div>
            ) : (
              /* Fully Interactive Neumorphic Progress Visualizer */
              <motion.div
                key="progress-visualizer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6 items-center">
                  {/* Neumorphic Circular Progress Ring */}
                  <div className="flex justify-center relative">
                    <svg width="130" height="130" className="transform -rotate-90">
                      {/* Outer Shadow Ring */}
                      <circle
                        cx="65"
                        cy="65"
                        r={radius}
                        className="stroke-[#030303]"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      {/* Track Ring */}
                      <circle
                        cx="65"
                        cy="65"
                        r={radius}
                        className="stroke-white/[0.02]"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      {/* Filled Progress Arc with champagne gold gradient */}
                      <circle
                        cx="65"
                        cy="65"
                        r={radius}
                        stroke="url(#goldGradient)"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                      {/* Definitions for Gradient & Shadows */}
                      <defs>
                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#c5a880" />
                          <stop offset="50%" stopColor="#d4af37" />
                          <stop offset="100%" stopColor="#f3e5ab" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Inside Ring Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white italic tracking-tighter">
                        {progress.percentage}%
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-accent/80">
                        Achieved
                      </span>
                    </div>
                  </div>

                  {/* Goal Achievements Details & Insights */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                          Current Achieved
                        </span>
                        <span className="text-xl font-black text-white tracking-tight">
                          {formatCurrency(progress.current)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
                          Monthly Goal
                        </span>
                        <span className="text-xl font-black text-white/70 tracking-tight">
                          {formatCurrency(progress.monthlyTarget)}
                        </span>
                      </div>
                    </div>

                    {/* Encouraging Run-rate feedback with gorgeous indicators */}
                    <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
                      <p className="text-xs text-white/90 leading-relaxed font-medium">
                        {progress.percentage >= 100 ? (
                          <span className="flex items-center gap-1.5 text-green-400 font-bold">
                            <CheckCircle className="h-4 w-4 shrink-0 text-green-400" />
                            Target achieved! Sensational month! 🎉
                          </span>
                        ) : progress.projected >= progress.target ? (
                          <span className="flex items-start gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0 animate-ping" />
                            <span>
                              On track! Projected to reach{" "}
                              <strong className="text-white">{formatCurrency(progress.projected)}</strong> by
                              month-end at current pace.
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-start gap-1.5 text-amber-400/90">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-pulse" />
                            <span>
                              Need{" "}
                              <strong className="text-white">
                                {formatCurrency(Math.ceil((progress.target - progress.current) / Math.max(1, progress.daysRemaining)))}
                              </strong>
                              /day over remaining <strong className="text-white">{progress.daysRemaining} days</strong> to catch up.
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Active Streaks & Histograph */}
                <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Active Streak Counter */}
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                      <Flame className="h-4.5 w-4.5 text-orange-500 fill-orange-500" />
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block">
                        Target Streak
                      </span>
                      <span className="text-xs font-bold text-white">
                        {progress.streak > 0
                          ? `${progress.streak} Month${progress.streak !== 1 ? "s" : ""} 🔥`
                          : "Start your streak today!"}
                      </span>
                    </div>
                  </div>

                  {/* 6-Month Micro Histograph dots/mini-bars */}
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {progress.monthlyHistory.map((hist, idx) => (
                      <div key={hist.month} className="flex flex-col items-center gap-1">
                        {/* Ring progress dot indicator */}
                        <div className="h-6 w-6 rounded-full bg-[#030303] border border-white/5 flex items-center justify-center relative group">
                          {/* Inner achieved color filled dot */}
                          <div
                            className={`h-3.5 w-3.5 rounded-full transition-all duration-500 ${
                              hist.percentage >= 100
                                ? "bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                : hist.percentage > 50
                                ? "bg-accent/70 shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                                : hist.achieved > 0
                                ? "bg-amber-500/40"
                                : "bg-white/5"
                            }`}
                          />
                          {/* Hover achievements detail badge */}
                          <div className="absolute bottom-full mb-1.5 hidden group-hover:block bg-[#121212] border border-white/10 text-[9px] px-2 py-1 rounded text-white whitespace-nowrap z-10 shadow-xl">
                            {hist.percentage}% ({formatCurrency(hist.achieved)})
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                          {hist.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* SETUP & EDIT DIALOG MODAL */}
      <TargetSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        activeTarget={activeTargetForType}
        targetType={selectedType}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["activeTargets"] });
          queryClient.invalidateQueries({ queryKey: ["targetProgress", selectedType] });
        }}
      />
    </div>
  );
}
