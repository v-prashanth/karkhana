"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, ChevronLeft, MailCheck, ArrowRight, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toaster";
import { authApi } from "@/lib/api/auth";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";

import validator from "validator";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const sanitizedEmail = email.replace(/<[^>]*>/g, "").trim().toLowerCase();
    if (!validator.isEmail(sanitizedEmail)) {
      toast("Please enter a valid email address", "error");
      return;
    }

    setLoading(true);
    try {
      await authApi.requestEmailOtp(sanitizedEmail);
      setStep("otp");
      setCountdown(60);
      toast("Reset code sent to your email", "success");
    } catch (error: any) {
      toast(error.message || "Could not send reset code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length < 6) {
      toast("Please enter the full 6-digit code", "error");
      return;
    }

    setLoading(true);
    try {
      const sanitizedEmail = email.replace(/<[^>]*>/g, "").trim().toLowerCase();
      await authApi.verifyEmailOtp(sanitizedEmail, code);
      // Success! They are now authenticated in the browser session.
      toast("Identity verified", "success");
      router.push("/update-password");
    } catch (error: any) {
      toast(error.message || "Invalid or expired code", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-[#030303] text-white selection:bg-accent/30 lg:grid lg:grid-cols-2">
      <AuthBrandingPanel />

      <div className="flex w-full items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">
          
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-black shadow-lg">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold uppercase tracking-tight text-white italic">Karkhana</span>
          </div>

          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div key="form-email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="space-y-8">
                <div>
                  <Link href="/login" className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors mb-6 font-medium uppercase tracking-widest w-fit">
                    <ChevronLeft className="h-4 w-4" /> Back to log in
                  </Link>
                  <h1 className="text-3xl font-medium tracking-tight text-white/95">Reset password</h1>
                  <p className="mt-3 text-sm text-white/50 font-light">
                    Enter your email address to receive a 6-digit reset code.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white/70">Email</label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      className="h-14 bg-[#111111] border-[#1E1E1E] focus:border-accent focus:ring-1 focus:ring-accent text-sm font-light text-white rounded-xl transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || !email}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Send reset code"}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="form-otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
                <div>
                  <button onClick={() => setStep("email")} className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors mb-6 font-medium uppercase tracking-widest w-fit">
                    <ChevronLeft className="h-4 w-4" /> Change email
                  </button>
                  <h1 className="text-3xl font-medium tracking-tight text-white/95">Enter reset code</h1>
                  <p className="mt-3 text-sm text-white/50 font-light leading-relaxed">
                    We sent a 6-digit code to <span className="font-medium text-white">{email}</span>.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="code" className="text-sm font-medium text-white/70">6-digit Code</label>
                      <button 
                        type="button" 
                        onClick={() => handleRequestOtp()} 
                        disabled={countdown > 0 || loading}
                        className="text-xs font-medium text-accent hover:text-accent/80 disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
                      >
                        {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                      </button>
                    </div>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      style={{ backgroundColor: "#101010", borderColor: "rgba(255, 255, 255, 0.15)" }}
                      className="h-14 border text-center tracking-[0.5em] text-xl font-bold text-white rounded-xl transition-all focus:border-accent focus:ring-2 focus:ring-accent/40"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || code.length < 6}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Verify identity"}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}
