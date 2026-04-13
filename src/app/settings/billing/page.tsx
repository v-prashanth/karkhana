"use client";

import { useState } from "react";
import { 
  Check, 
  ShieldCheck, 
  Zap, 
  Crown, 
  ArrowRight, 
  HelpCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Billing & Monetization Hub — v4
 * Implements the Free, Pro, and Business tiers.
 */
export default function BillingPage() {
  const { organization } = useStore();
  const currentPlan = organization?.plan || "free";

  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "₹0",
      description: "For small workshops and new businesses.",
      icon: Zap,
      features: [
        "Up to 3 Clients",
        "20 Documents / Month",
        "Basic Reports",
        "Karkhana Branding on Docs",
        "Single User Access"
      ],
      cta: "Current Plan",
      highlight: false
    },
    {
      id: "pro",
      name: "Pro",
      price: "₹499",
      period: "/month",
      description: "For growing businesses needing scale.",
      icon: Crown,
      features: [
        "Unlimited Clients",
        "Unlimited Documents",
        "Custom Branding (No Logo)",
        "GST & GSTR Reports",
        "Up to 5 User Seats",
        "Priority Support"
      ],
      cta: "Upgrade to Pro",
      highlight: true
    },
    {
      id: "business",
      name: "Business",
      price: "₹999",
      period: "/month",
      description: "For established factories and agencies.",
      icon: Sparkles,
      features: [
        "Everything in Pro",
        "API Access",
        "Advanced Analytics",
        "White Label Option",
        "Unlimited User Seats",
        "Dedicated Account Manager"
      ],
      cta: "Go Business",
      highlight: false
    }
  ];

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <PageHeader title="Billing & Plans" subtitle="Choose the plan that fits your scale" backHref="/settings" />

      <div className="px-5 space-y-10 max-w-5xl mx-auto">
        
        {/* Current Plan Card */}
        <Card className="glass-panel border-accent/20 bg-accent/5 overflow-hidden">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center shadow-[0_0_30px_rgba(255,107,43,0.3)]">
                 <Crown className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#666]">Current Active Plan</p>
                <h2 className="text-2xl font-black text-white uppercase italic">{currentPlan} Edition</h2>
                <p className="text-xs text-muted-foreground mt-1">Your next cycle resets in 14 days.</p>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 uppercase text-[10px] tracking-widest font-black h-12 px-8">
              Manage Subscription
            </Button>
          </CardContent>
        </Card>

        {/* Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div 
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={cn(
                "glass-panel border-white/5 h-full flex flex-col transition-all duration-500",
                tier.highlight && "border-accent/40 bg-accent/[0.03] scale-105 shadow-2xl relative z-10"
              )}>
                {tier.highlight && (
                   <div className="absolute top-0 right-8 -translate-y-1/2 bg-accent text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl italic">
                     Best Value
                   </div>
                )}
                <CardHeader className="p-8 pb-4">
                  <div className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors",
                    tier.highlight ? "bg-accent text-white" : "bg-white/5 text-muted-foreground"
                  )}>
                    <tier.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl font-black text-white uppercase italic">{tier.name}</CardTitle>
                  <CardDescription className="text-muted-foreground leading-relaxed mt-1">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-4 flex-1 flex flex-col">
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black text-white italic">{tier.price}</span>
                    <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest">{tier.period || ""}</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {tier.features.map(feature => (
                      <li key={feature} className="flex items-start gap-3 text-xs">
                        <div className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          tier.highlight ? "bg-accent/20 text-accent" : "bg-white/5 text-muted-foreground"
                        )}>
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-muted-foreground font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    disabled={currentPlan === tier.id}
                    className={cn(
                      "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] italic shadow-xl transition-all",
                      tier.highlight 
                        ? "bg-accent text-white hover:bg-accent/90" 
                        : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
                    )}
                  >
                    {currentPlan === tier.id ? "Your Active Plan" : tier.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Verification Section */}
        <section className="pt-10 border-t border-white/5">
           <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 space-y-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest italic">
                    <ShieldCheck className="h-3 w-3" /> Build Trust
                 </div>
                 <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Karkhana Verified Badge</h3>
                 <p className="text-muted-foreground leading-relaxed">
                    Verified businesses are 4x more likely to attract new buyers. For ₹999/year, we verify your GSTIN, address, and legitimacy to give you the Green Badge.
                 </p>
                 <Button onClick={() => window.location.href = '/settings/verification'} size="lg" className="h-14 px-8 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] italic group">
                    Get Verified <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1" />
                 </Button>
              </div>
              <div className="h-[300px] w-full md:w-[300px] glass rounded-[48px] flex items-center justify-center relative overflow-hidden shrink-0 border border-white/5">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                 <ShieldCheck className="h-40 w-40 text-blue-400 opacity-20 absolute" />
                 <div className="relative z-10 flex flex-col items-center gap-4 text-center p-8">
                    <div className="h-20 w-20 rounded-[24px] bg-blue-400 shadow-[0_0_40px_rgba(96,165,250,0.4)] flex items-center justify-center">
                       <ShieldCheck className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-xs font-black text-white uppercase italic tracking-widest">Trust Economy</p>
                 </div>
              </div>
           </div>
        </section>

        {/* FAQ Area */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 pt-10">
           <div className="space-y-2">
              <h4 className="font-black text-white uppercase italic tracking-tight flex items-center gap-2 text-sm">
                <HelpCircle className="h-4 w-4 text-accent" /> Can I downgrade later?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Yes, you can downgrade at the end of your billing cycle. Your data remains safe, but limits will be reapplied.</p>
           </div>
           <div className="space-y-2">
              <h4 className="font-black text-white uppercase italic tracking-tight flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-accent" /> Is my payment secure?
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">Payments are processed via Razorpay/Stripe with enterprise-grade encryption. Karkhana never stores your card details.</p>
           </div>
        </section>

        <p className="text-center text-[10px] text-[#444] uppercase tracking-[0.4em] pt-10 font-bold opacity-50">
          Tiered Monetization v4 • karkhana.app
        </p>
      </div>
    </main>
  );
}
