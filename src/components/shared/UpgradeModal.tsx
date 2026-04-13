"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, 
  X, 
  ArrowRight, 
  Zap,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  limitType?: "contacts" | "documents";
}

/**
 * UpgradeModal — v4 Monetization
 * High-aesthetic conversion engine. Shows when a plan limit is reached.
 */
export function UpgradeModal({ 
  isOpen, 
  onClose, 
  title = "Unlock Your Potential", 
  message = "You've reached the limit for your current plan.",
  limitType = "contacts"
}: UpgradeModalProps) {
  
  const benefits = [
    { icon: Zap, label: "Unlimited Clients & Suppliers" },
    { icon: Sparkles, label: "Unlimited Invoices & Documents" },
    { icon: ShieldCheck, label: "GSTR Verified Reports" },
    { icon: Crown, label: "Premium Industrial Branding" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg glass-panel overflow-hidden border-accent/20 bg-accent/5 shadow-[0_0_100px_rgba(255,107,43,0.1)]"
          >
            {/* Top Accents */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
            <div className="absolute top-4 right-4">
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 pt-12 text-center flex flex-col items-center">
              {/* Icon Cluster */}
              <div className="mb-8 relative">
                <div className="h-20 w-20 rounded-[32px] bg-accent flex items-center justify-center shadow-[0_0_40px_rgba(255,107,43,0.4)] animate-pulse-slow">
                   <Crown className="h-10 w-10 text-white" />
                </div>
                <Zap className="absolute -top-2 -right-2 h-8 w-8 text-white fill-accent animate-bounce-slow" />
              </div>

              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-3">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-sm">
                {message} <br/> The **Karkhana Pro** plan gives you the scale to build a bigger business.
              </p>

              {/* Benefits List */}
              <div className="w-full grid grid-cols-1 gap-3 mb-10">
                 {benefits.map((benefit) => (
                   <div key={benefit.label} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                         <benefit.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-white uppercase tracking-tight">{benefit.label}</span>
                   </div>
                 ))}
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-3">
                 <Button 
                   onClick={() => window.location.href = '/settings/billing'}
                   size="lg" 
                   className="h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] italic text-[10px] shadow-2xl hover:bg-white/90 group"
                 >
                   Upgrade to Pro Mode <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1" />
                 </Button>
                 <button 
                   onClick={onClose}
                   className="h-12 text-[10px] font-black uppercase tracking-widest text-[#666] hover:text-[#888] transition-colors"
                 >
                    Maybe Later
                 </button>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 text-center">
               <p className="text-[10px] font-bold text-[#444] uppercase tracking-[0.3em] italic">Build with Confidence • Managed by Karkhana</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
