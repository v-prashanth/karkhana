"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Upload, 
  FileCheck, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  ArrowRight,
  Info,
  BadgeCheck,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/ui/Toaster";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Business Verification Page — v4
 * For GSTIN and legitimacy proof uploads.
 * Result: Verified Business Badge.
 */
export default function VerificationPage() {
  const { organization } = useStore();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [formData, setFormData] = useState({
    gstin: "",
    aadhaar: "",
    address_proof: null as File | null,
    gst_cert: null as File | null
  });

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    setIsVerifying(false);
    setStep(3);
    toast("Verification details submitted!", "success");
  };

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <PageHeader title="Trust & Verification" subtitle="Get your Green Verification Badge" backHref="/settings/billing" />

      <div className="px-5 max-w-3xl mx-auto py-10">
        
        {/* Verification Status Banner */}
        <div className="mb-10 p-8 glass rounded-[32px] border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
           <ShieldCheck className="absolute top-0 right-0 h-40 w-40 text-blue-400 opacity-5 -translate-y-10 translate-x-10" />
           <div className="flex items-center gap-6 relative z-10">
              <div className="h-20 w-20 rounded-3xl bg-blue-400 flex items-center justify-center shadow-2xl">
                 <BadgeCheck className="h-10 w-10 text-white" />
              </div>
              <div className="flex-1">
                 <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Karkhana Trusted Network</h2>
                 <p className="text-sm text-muted-foreground mt-1 max-w-md">Verified businesses appear first in search and gain higher trust from new buyers.</p>
              </div>
           </div>
        </div>

        {/* Multi-step Flow */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
               <Card className="glass-panel border-white/5">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black text-white uppercase italic">Step 1: Business Identity</CardTitle>
                    <CardDescription>Enter your official business identification details.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[#666]">GST Number (GSTIN)</label>
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="e.g. 27AAACR1234A1Z1" 
                            className="h-14 pl-12 bg-white/[0.02] border-white/10 rounded-2xl font-mono uppercase"
                            value={formData.gstin}
                            onChange={e => setFormData({...formData, gstin: e.target.value})}
                          />
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-[#666]">Aadhaar / PAN of Founder</label>
                       <Input 
                          placeholder="e.g. 1234 5678 9012" 
                          className="h-14 bg-white/[0.02] border-white/10 rounded-2xl font-mono"
                          value={formData.aadhaar}
                          onChange={e => setFormData({...formData, aadhaar: e.target.value})}
                       />
                    </div>
                    
                    <Button onClick={() => setStep(2)} className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-[10px] italic rounded-2xl mt-4">
                       Next: Proof Uploads <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                 </CardContent>
               </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
               <Card className="glass-panel border-white/5">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black text-white uppercase italic">Step 2: Proof of Legitimacy</CardTitle>
                    <CardDescription>Upload clear documents for verification.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-6 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] flex flex-col items-center justify-center text-center gap-3 group hover:border-blue-500/20 transition-colors">
                          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400">
                             <Upload className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-xs font-black text-white uppercase tracking-tight">GST Certificate</p>
                             <p className="text-[10px] text-muted-foreground mt-1">PDF or Image (Max 5MB)</p>
                          </div>
                       </div>
                       
                       <div className="p-6 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] flex flex-col items-center justify-center text-center gap-3 group hover:border-blue-500/20 transition-colors">
                          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-400">
                             <MapPin className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-xs font-black text-white uppercase tracking-tight">Address Proof</p>
                             <p className="text-[10px] text-muted-foreground mt-1">Utility Bill or Lease</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                       <Info className="h-5 w-5 text-amber-500 shrink-0" />
                       <p className="text-[10px] font-bold text-amber-500/80 uppercase leading-relaxed">Verification usually takes 24-48 business hours. You'll be notified via SMS/WhatsApp.</p>
                    </div>

                    <div className="flex gap-4">
                       <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-14 rounded-2xl border-white/10 hover:bg-white/5 uppercase text-[10px] tracking-widest font-black">
                         Back
                       </Button>
                       <Button onClick={handleVerify} disabled={isVerifying} className="flex-[2] h-14 bg-white text-black font-black uppercase tracking-widest text-[10px] italic rounded-2xl">
                          {isVerifying ? "Submitting..." : "Submit for Verification"}
                       </Button>
                    </div>
                 </CardContent>
               </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-8 py-10"
            >
               <div className="h-32 w-32 rounded-[48px] bg-green-500 shadow-[0_0_60px_rgba(34,197,94,0.4)] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-16 w-16 text-white" />
               </div>
               <div className="space-y-3">
                  <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Details Submitted</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">Your verification is in the queue. We'll update your status in 24-48 hours.</p>
               </div>
               <Button onClick={() => window.location.href = '/settings'} size="lg" className="h-14 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] italic">
                  Return to Settings
               </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-[#444] uppercase tracking-[0.4em] pt-20 font-bold opacity-50 italic">
          Trust Protocol v4 • Managed by Karkhana
        </p>
      </div>
    </main>
  );
}
