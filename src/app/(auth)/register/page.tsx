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
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { OTPInput } from "@/components/auth/OTPInput";

import validator from "validator";

type AuthMethod = "otp" | "password";
type Step = "input" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, authHydrated } = useStore();
  
  const [method, setMethod] = useState<AuthMethod>("password");
  const [step, setStep] = useState<Step>("input");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpValue, setOtpValue] = useState("");
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
      toast("Sign-up code sent to your email", "success");
    } catch (error: any) {
      toast(error.message || "Could not send sign-up code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    try {
      const sanitizedEmail = email.replace(/<[^>]*>/g, "").trim().toLowerCase();
      await authApi.verifyEmailOtp(sanitizedEmail, otp);
      toast("Account created! Welcome to Karkhana.", "success");
      setRegistered(true);
      // Wait for hydration
    } catch (error: any) {
      toast(error.message || "Invalid or expired code", "error");
      setLoading(false); 
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const sanitizedEmail = email.replace(/<[^>]*>/g, "").trim().toLowerCase();
    if (!validator.isEmail(sanitizedEmail)) {
      toast("Please enter a valid email address", "error");
      return;
    }
    
    // Strict password validation
    if (password.length < 8 || password.length > 64) {
      toast("Password must be between 8 and 64 characters", "error");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      toast("Password must contain at least 1 uppercase letter", "error");
      return;
    }
    if (!/[a-z]/.test(password)) {
      toast("Password must contain at least 1 lowercase letter", "error");
      return;
    }
    if (!/[0-9]/.test(password)) {
      toast("Password must contain at least 1 number", "error");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      toast("Password must contain at least 1 special character", "error");
      return;
    }
    if (sanitizedEmail && password.toLowerCase().includes(sanitizedEmail.split("@")[0].toLowerCase())) {
      toast("Password must not contain your email", "error");
      return;
    }
    if (password !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      await authApi.signUpWithPassword(sanitizedEmail, password);
      toast("Account created! Welcome to Karkhana.", "success");
      setRegistered(true);
    } catch (error: any) {
      toast(error.message || "Could not create account", "error");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authApi.signInWithGoogle();
    } catch (error: any) {
      toast("Google signup failed", "error");
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030303] text-white">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
            <ShieldCheck className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Account Created!</h2>
          <p className="text-sm text-white/50">Setting up your workspace…</p>
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#030303] text-white selection:bg-accent/30 lg:grid lg:grid-cols-2">
      <AuthBrandingPanel />

      <div className="flex w-full items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[400px] py-10">
          
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
                  <h1 className="text-3xl font-black uppercase italic tracking-tight bg-gradient-to-r from-white via-white to-accent bg-clip-text text-transparent">Create your account</h1>
                  <p className="mt-3 text-sm text-white/50 font-light">Enter your email to receive a secure sign-up code.</p>
                </div>

                <form onSubmit={handleOtpRequestSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email_otp" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/75">Work email <span className="text-red-500">*</span></label>
                    <Input
                      id="email_otp"
                      type="email"
                      placeholder="you@company.com"
                      className="h-14 bg-[#030303] border-white/5 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.9),inset_-1px_-1px_6px_rgba(255,255,255,0.01)] text-white text-sm font-light rounded-xl transition-all focus:border-accent/40 focus:ring-0 focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.95),0_0_8px_rgba(212,175,55,0.1)]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-xl bg-gradient-to-r from-accent to-[#ffd700] text-black font-black uppercase tracking-widest text-[10px] italic shadow-[0_8px_20px_rgba(255,122,26,0.2)] hover:shadow-[0_8px_25px_rgba(255,122,26,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] border border-accent/20 flex items-center justify-center" disabled={loading || !email}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Send Sign up Code"}
                  </Button>
                </form>

                <div className="text-center text-xs font-bold tracking-wider uppercase">
                  <p className="text-white/40">
                    Already have an account?{" "}
                    <Link href="/login" className="text-white hover:underline font-bold ml-1">Log in</Link>
                  </p>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-[#030303] px-4 text-white/30 tracking-widest">or</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button onClick={() => setMethod("password")} variant="outline" className="w-full h-14 rounded-xl bg-gradient-to-b from-[#121212] to-[#080808] border border-white/5 shadow-[6px_6px_16px_rgba(0,0,0,0.8),-3px_-3px_12px_rgba(255,255,255,0.012),inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-white/10 hover:scale-[1.01] transition-all text-white font-bold uppercase tracking-widest text-[9px] italic flex items-center justify-center" disabled={loading}>
                    Use password instead
                  </Button>
                  <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-14 rounded-xl bg-gradient-to-b from-[#121212] to-[#080808] border border-white/5 shadow-[6px_6px_16px_rgba(0,0,0,0.8),-3px_-3px_12px_rgba(255,255,255,0.012),inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-white/10 hover:scale-[1.01] transition-all text-white font-bold uppercase tracking-widest text-[9px] italic flex items-center justify-center" disabled={loading}>
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
                  <h1 className="text-3xl font-black uppercase italic tracking-tight bg-gradient-to-r from-white via-white to-accent bg-clip-text text-transparent">Enter sign-up code</h1>
                  <p className="mt-3 text-sm text-white/50 font-light">Sent to <span className="text-white font-medium">{email}</span></p>
                </div>

                <div className="space-y-6">
                  <OTPInput onComplete={(otp) => { setOtpValue(otp); handleOTPComplete(otp); }} disabled={loading} />

                  <Button
                    type="button"
                    onClick={() => { if (otpValue.length === 6) handleOTPComplete(otpValue); }}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-accent to-[#ffd700] text-black font-black uppercase tracking-widest text-[10px] italic shadow-[0_8px_20px_rgba(255,122,26,0.2)] hover:shadow-[0_8px_25px_rgba(255,122,26,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] border border-accent/20 flex items-center justify-center"
                    disabled={loading || otpValue.length < 6}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Verify & Sign Up"}
                  </Button>

                  <div className="flex flex-col gap-4 mt-2">
                    <button
                      onClick={handleOtpRequestSubmit}
                      disabled={countdown > 0 || loading}
                      className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend code (${countdown}s)` : "Resend code"}
                    </button>
                    <button
                      onClick={() => { setStep("input"); setOtpValue(""); }}
                      disabled={loading}
                      className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" /> Change email
                    </button>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                      <span className="bg-[#030303] px-4 text-white/30 tracking-widest">or</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button onClick={() => { setMethod("password"); setStep("input"); setOtpValue(""); }} variant="outline" className="w-full h-14 rounded-xl bg-gradient-to-b from-[#121212] to-[#080808] border border-white/5 shadow-[6px_6px_16px_rgba(0,0,0,0.8),-3px_-3px_12px_rgba(255,255,255,0.012),inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-white/10 hover:scale-[1.01] transition-all text-white font-bold uppercase tracking-widest text-[9px] italic flex items-center justify-center" disabled={loading}>
                      Use password instead
                    </Button>
                  </div>

                  <div className="text-center text-xs font-bold tracking-wider uppercase">
                    <p className="text-white/40">
                      Already have an account?{" "}
                      <Link href="/login" className="text-white hover:underline font-bold ml-1">Log in</Link>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── EMAIL PASSWORD INPUT STEP ── */}
            {step === "input" && method === "password" && (
              <motion.div key="password_input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-8">
                <div>
                  <h1 className="text-3xl font-black uppercase italic tracking-tight bg-gradient-to-r from-white via-white to-accent bg-clip-text text-transparent">Create your account</h1>
                  <p className="mt-3 text-sm text-white/50 font-light">Join thousands of Indian SMBs running their business flawlessly.</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/75">Work email <span className="text-red-500">*</span></label>
                    <Input
                      id="email"
                      type="email"
                      className="h-14 bg-[#030303] border-white/5 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.9),inset_-1px_-1px_6px_rgba(255,255,255,0.01)] text-white text-sm font-light rounded-xl transition-all focus:border-accent/40 focus:ring-0 focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.95),0_0_8px_rgba(212,175,55,0.1)]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/75">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="h-14 bg-[#030303] border-white/5 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.9),inset_-1px_-1px_6px_rgba(255,255,255,0.01)] text-white text-sm font-light rounded-xl transition-all pr-12 focus:border-accent/40 focus:ring-0 focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.95),0_0_8px_rgba(212,175,55,0.1)]"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={password} email={email} />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/75">Confirm password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        className="h-14 bg-[#030303] border-white/5 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.9),inset_-1px_-1px_6px_rgba(255,255,255,0.01)] text-white text-sm font-light rounded-xl transition-all pr-12 focus:border-accent/40 focus:ring-0 focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.95),0_0_8px_rgba(212,175,55,0.1)]"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-xl bg-gradient-to-r from-accent to-[#ffd700] text-black font-black uppercase tracking-widest text-[10px] italic shadow-[0_8px_20px_rgba(255,122,26,0.2)] hover:shadow-[0_8px_25px_rgba(255,122,26,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99] border border-accent/20 flex items-center justify-center" disabled={loading || !email || !password || !confirmPassword}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Create account"}
                  </Button>
                </form>

                <div className="text-center text-xs font-bold tracking-wider uppercase">
                  <p className="text-white/40">
                    Already have an account?{" "}
                    <Link href="/login" className="text-white hover:underline font-bold ml-1">Log in</Link>
                  </p>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-[#030303] px-4 text-white/30 tracking-widest">or</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button onClick={() => setMethod("otp")} variant="outline" className="w-full h-14 rounded-xl bg-gradient-to-b from-[#121212] to-[#080808] border border-white/5 shadow-[6px_6px_16px_rgba(0,0,0,0.8),-3px_-3px_12px_rgba(255,255,255,0.012),inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-white/10 hover:scale-[1.01] transition-all text-white font-bold uppercase tracking-widest text-[9px] italic flex items-center justify-center" disabled={loading}>
                    Use sign-up code instead
                  </Button>
                  <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-14 rounded-xl bg-gradient-to-b from-[#121212] to-[#080808] border border-white/5 shadow-[6px_6px_16px_rgba(0,0,0,0.8),-3px_-3px_12px_rgba(255,255,255,0.012),inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-white/10 hover:scale-[1.01] transition-all text-white font-bold uppercase tracking-widest text-[9px] italic flex items-center justify-center" disabled={loading}>
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
