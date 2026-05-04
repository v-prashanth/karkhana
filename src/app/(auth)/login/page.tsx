"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toaster";
import { authApi } from "@/lib/api/auth";
import { useStore } from "@/store/useStore";

import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { OTPInput } from "@/components/auth/OTPInput";

import validator from "validator";

type AuthMethod = "otp" | "password";
type Step = "input" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, authHydrated } = useStore();

  const [method, setMethod] = useState<AuthMethod>("otp");
  const [step, setStep] = useState<Step>("input");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (authHydrated && user) {
      router.replace("/home");
    }
  }, [authHydrated, user, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = email.replace(/<[^>]*>/g, "").trim().toLowerCase();
    if (!validator.isEmail(sanitizedEmail)) {
      toast("Please enter a valid email address", "error");
      return;
    }

    setLoading(true);
    try {
      await authApi.requestEmailOtp(sanitizedEmail);
      setStep("verify");
      setCountdown(60);
      toast("Login code sent to your email", "success");
    } catch (error: any) {
      toast(error.message || "Could not send login code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    try {
      const sanitizedEmail = email.replace(/<[^>]*>/g, "").trim().toLowerCase();
      await authApi.verifyEmailOtp(sanitizedEmail, otp);
      toast("Verified successfully", "success");
      router.push("/home");
    } catch (error: any) {
      toast(error.message || "Invalid or expired code", "error");
      setLoading(false); 
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = email.replace(/<[^>]*>/g, "").trim().toLowerCase();
    if (!validator.isEmail(sanitizedEmail)) {
      toast("Please enter a valid email address", "error");
      return;
    }
    if (!password) {
      toast("Password is required", "error");
      return;
    }

    setLoading(true);
    try {
      await authApi.signInWithPassword(sanitizedEmail, password);
      router.push("/home");
    } catch (error: any) {
      toast("Incorrect email or password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authApi.signInWithGoogle();
    } catch (error: any) {
      toast(error.message || "Google login failed", "error");
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
            
            {/* ── EMAIL OTP INPUT STEP ── */}
            {step === "input" && method === "otp" && (
              <motion.div key="otp_input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="space-y-8">
                <div>
                  <h1 className="text-3xl font-medium tracking-tight text-white/95">Welcome to Karkhana</h1>
                  <p className="mt-3 text-sm text-white/50 font-light">Enter your email to receive a secure login code.</p>
                </div>

                <form onSubmit={handleOtpRequestSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email_otp" className="text-sm font-medium text-white/70">Work email</label>
                    <Input
                      id="email_otp"
                      type="email"
                      placeholder="you@company.com"
                      className="h-14 bg-[#111111] border-[#1E1E1E] focus:border-accent focus:ring-1 focus:ring-accent text-sm font-light text-white rounded-xl transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || !email}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Send Login Code"}
                  </Button>
                </form>

                <div className="flex items-center justify-between mt-4 text-sm">
                  <Link href="/forgot-password" className="text-white/60 hover:text-white transition-colors">Forgot password?</Link>
                  <p className="text-white/40">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-white hover:underline font-medium ml-1">Create one</Link>
                  </p>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#1E1E1E]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#030303] px-4 text-white/30 tracking-widest">or</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button onClick={() => setMethod("password")} variant="outline" className="w-full h-14 rounded-xl border-[#1E1E1E] bg-transparent text-sm font-medium text-white/80 hover:bg-[#111111] hover:text-white transition-all justify-center" disabled={loading}>
                    Use password instead
                  </Button>
                  <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-14 rounded-xl border-[#1E1E1E] bg-transparent text-sm font-medium text-white/80 hover:bg-[#111111] hover:text-white transition-all justify-center" disabled={loading}>
                    <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} height={18} className="mr-3" unoptimized />
                    Continue with Google
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── EMAIL OTP VERIFY STEP ── */}
            {step === "verify" && method === "otp" && (
              <motion.div key="otp_verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-8">
                <div>
                  <h1 className="text-3xl font-medium tracking-tight text-white/95">Enter login code</h1>
                  <p className="mt-3 text-sm text-white/50 font-light">Sent to <span className="text-white font-medium">{email}</span></p>
                </div>

                <div className="space-y-6">
                  <OTPInput onComplete={handleOTPComplete} disabled={loading} />

                  <div className="flex flex-col gap-4 mt-6">
                    <button
                      onClick={handleOtpRequestSubmit}
                      disabled={countdown > 0 || loading}
                      className="text-sm font-medium text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend code (${countdown}s)` : "Resend code"}
                    </button>
                    <button
                      onClick={() => { setStep("input"); }}
                      disabled={loading}
                      className="text-sm font-medium text-white/60 hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> Change email
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── EMAIL PASSWORD INPUT STEP ── */}
            {step === "input" && method === "password" && (
              <motion.div key="password_input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-8">
                <div>
                  <h1 className="text-3xl font-medium tracking-tight text-white/95">Log in to Karkhana</h1>
                  <p className="mt-3 text-sm text-white/50 font-light">Enter your email and password to log in.</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white/70">Email <span className="text-red-500">*</span></label>
                    <Input
                      id="email"
                      type="email"
                      className="h-14 bg-[#111111] border-[#1E1E1E] focus:border-accent focus:ring-1 focus:ring-accent text-sm font-light text-white rounded-xl transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-white/70">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="h-14 bg-[#111111] border-[#1E1E1E] focus:border-accent focus:ring-1 focus:ring-accent text-sm font-light text-white rounded-xl transition-all pr-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || !email || !password}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Log in"}
                  </Button>
                </form>

                <div className="flex items-center justify-between mt-4 text-sm">
                  <Link href="/forgot-password" className="text-white/60 hover:text-white transition-colors">Forgot password?</Link>
                  <p className="text-white/40">
                    Don't have account?{" "}
                    <Link href="/register" className="text-white hover:underline font-medium ml-1">Create one</Link>
                  </p>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#1E1E1E]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#030303] px-4 text-white/30 tracking-widest">or</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button onClick={() => setMethod("otp")} variant="outline" className="w-full h-14 rounded-xl border-[#1E1E1E] bg-transparent text-sm font-medium text-white/80 hover:bg-[#111111] hover:text-white transition-all justify-center" disabled={loading}>
                    Use login code instead
                  </Button>
                  <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-14 rounded-xl border-[#1E1E1E] bg-transparent text-sm font-medium text-white/80 hover:bg-[#111111] hover:text-white transition-all justify-center" disabled={loading}>
                    <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} height={18} className="mr-3" unoptimized />
                    Continue with Google
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}
