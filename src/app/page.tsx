"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Loader2,
  Lock,
  ChevronLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/lib/api/auth";
import { useToast } from "@/components/ui/Toaster";
import { useStore } from "@/store/useStore";

export default function GatewayPage() {
  const [step, setStep] = useState<"enter_identifier" | "login_password" | "verify_otp">("enter_identifier");
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [isNewUser, setIsNewUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { user, authHydrated } = useStore();

  // Auth guard: If user is already authenticated, send them to dashboard
  useEffect(() => {
    if (authHydrated && user) {
      router.replace("/home");
    }
  }, [authHydrated, user, router]);

  const isEmail = identifier.includes("@");

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    if (!isEmail && identifier.replace(/\D/g, "").length < 10) {
      toast("Please enter a valid email or 10-digit mobile number", "error");
      return;
    }

    setLoading(true);
    try {
      const exists = await authApi.checkUserExists(identifier);
      setIsNewUser(!exists);

      // For ALL users (new and existing), the primary flow is OTP.
      // This fixes the bug where users created via magic link have no password,
      // causing signInWithPassword() to always fail.
      if (isEmail) {
        await authApi.requestEmailOtp(identifier);
      } else {
        await authApi.signInWithPhone(identifier);
      }
      setStep("verify_otp");
      toast(
        exists
          ? (isEmail ? "Login code sent to your email" : "Code sent to your mobile")
          : (isEmail ? "Setup code sent to email" : "Setup code sent to mobile"),
        "success"
      );
    } catch (error: unknown) {
      toast((error as Error).message || "Could not verify details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.signInWithEmail(identifier, password);
      // Let the middleware handle the secure routing to dashboard or onboarding!
      router.push("/home"); 
    } catch (error: unknown) {
      toast((error as Error).message || "Invalid password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEmail) {
        await authApi.verifyEmailOtp(identifier, otp);
      } else {
        await authApi.verifyOtp(identifier, otp);
      }
      toast("Verified successfully", "success");
      // If this was a password reset flow, go to /update-password.
      // Otherwise, go to dashboard.
      router.push(isPasswordReset ? "/update-password" : "/home");
    } catch (error: unknown) {
      toast((error as Error).message || "Invalid code", "error");
      setLoading(false);
    }
  };

  const handleRequestEmailOtpInstead = async () => {
    setLoading(true);
    try {
      await authApi.requestEmailOtp(identifier);
      setStep("verify_otp");
      toast("Code sent to your email", "success");
    } catch (error: unknown) {
      toast((error as Error).message || "Failed to send code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      // Send an OTP code instead of a link. After they verify, we redirect
      // to /update-password. This bypasses the unreliable Supabase redirect chain.
      await authApi.requestEmailOtp(identifier);
      setIsPasswordReset(true);
      setStep("verify_otp");
      toast("Verification code sent to your email", "success");
    } catch (error: unknown) {
      toast((error as Error).message || "Could not send verification code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await authApi.signInWithGoogle();
    } catch (error: unknown) {
      toast((error as Error).message || "Google login failed", "error");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-[#030303] text-white selection:bg-white/20">
      
      {/* ── LEFT PANE: BRANDING (Hidden on Mobile) ── */}
      <div className="relative hidden w-full lg:flex lg:w-[55%] flex-col justify-between overflow-hidden p-12">
        <Image 
          src="/auth-bg.png" 
          alt="Architectural Abstract" 
          fill 
          className="object-cover object-center absolute inset-0 opacity-80" 
          priority 
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#030303]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/40 to-transparent" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold uppercase tracking-tight text-white">Karkhana</span>
        </div>

        <div className="relative z-10 max-w-xl pb-12">
          <h1 className="text-5xl font-medium tracking-tight text-white/95 leading-[1.1] md:text-6xl">
            Streamline your operations.
          </h1>
          <p className="mt-8 text-lg font-light text-white/60 leading-relaxed max-w-md">
            The premium workspace built for manufacturers, suppliers, and traders to manage day-to-day business flawlessly.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANE: AUTHENTICATION ── */}
      <div className="flex w-full flex-col justify-center items-center p-6 lg:w-[45%] lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[380px] space-y-8">
          
          {/* Mobile Logo Logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold uppercase tracking-tight text-white">Karkhana</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── IDENTIFIER STEP ── */}
            {step === "enter_identifier" && (
              <motion.div key="identifier" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-medium tracking-tight text-white/95">
                    Welcome
                  </h2>
                  <p className="text-sm text-white/50 mt-3 font-light">
                    Log in or create a business account to continue.
                  </p>
                </div>

                <form onSubmit={handleIdentifierSubmit} className="space-y-6">
                  <Input
                    type="text"
                    placeholder="Email address or numbers"
                    className="h-14 bg-white/[0.02] border-white/10 focus:border-white/30 focus:bg-white/[0.04] text-lg font-light text-white rounded-lg transition-all"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.toLowerCase().trim())}
                    autoFocus
                    required
                  />
                  <Button type="submit" className="w-full h-12 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-all font-bold" disabled={loading || !identifier}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </form>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <Button
                    onClick={handleGoogleLogin}
                    variant="outline"
                    className="w-full h-12 rounded-lg border-white/10 bg-[transparent] text-sm font-medium text-white/90 hover:bg-white/[0.05] hover:text-white transition-all justify-center"
                    disabled={loading}
                  >
                    <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" width={18} height={18} className="mr-3" unoptimized />
                    Continue with Google
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── PASSWORD LOGIN STEP ── */}
            {step === "login_password" && (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <button onClick={() => { setStep("enter_identifier"); setPassword(""); }} className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors mb-6 font-medium uppercase tracking-widest">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <h2 className="text-3xl font-medium tracking-tight text-white/95">Enter password</h2>
                  <p className="mt-3 text-sm text-white/50 font-light max-w-[280px] break-all">
                    Logging into {identifier}
                  </p>
                </div>
                
                <form onSubmit={handlePasswordLogin} className="space-y-5">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      className="h-12 bg-white/[0.02] border-white/10 focus:border-white/30 focus:bg-white/[0.04] text-sm text-white placeholder:text-white/30 rounded-lg transition-all pr-12 font-light"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="pt-2 space-y-3">
                    <Button type="submit" className="w-full h-12 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-all font-bold" disabled={loading || !password}>
                      {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Sign In"}
                    </Button>
                    
                    <Button type="button" onClick={handleRequestEmailOtpInstead} variant="outline" className="w-full h-12 rounded-lg border-white/10 bg-[transparent] text-sm font-medium text-white/90 hover:bg-white/[0.05] hover:text-white transition-all justify-center" disabled={loading}>
                      Sign in with Code Instead
                    </Button>
                  </div>
                </form>

                {!forgotSent && (
                  <button onClick={handleForgotPassword} disabled={loading} className="text-sm text-white/50 hover:text-white transition-colors">
                    Forgot your password?
                  </button>
                )}
                {forgotSent && (
                  <p className="text-sm text-[#4DBE7A]">
                    Reset link sent — please check your inbox.
                  </p>
                )}
              </motion.div>
            )}

            {/* ── OTP VERIFY STEP (For Login & Signup) ── */}
            {step === "verify_otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-medium tracking-tight text-white/95">
                    {isPasswordReset ? "Reset password" : isNewUser ? "Create account" : "Enter code"}
                  </h2>
                  <p className="text-sm text-white/50 mt-3 font-light max-w-[280px] break-all">
                    Code sent to {identifier}
                  </p>
                </div>
                
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                    <Input
                      type="text"
                      placeholder="••••••"
                      maxLength={6}
                      className="h-14 pl-12 bg-white/[0.02] border-white/10 focus:border-white/30 focus:bg-white/[0.04] text-2xl font-light text-center tracking-[0.5em] text-white rounded-lg transition-all"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-all font-bold" disabled={loading || otp.length < 6}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : isPasswordReset ? "Verify & Reset Password" : isNewUser ? "Verify & Continue" : "Verify & Sign In"}
                  </Button>
                  <button type="button" onClick={() => { setOtp(""); setStep("enter_identifier"); }} className="w-full text-left text-sm text-white/50 hover:text-white transition-colors">
                    Wait, let me change my {isEmail ? "email" : "number"}
                  </button>
                  {!isNewUser && isEmail && (
                    <div className="pt-2 border-t border-white/10">
                      <Button
                        type="button"
                        onClick={() => { setOtp(""); setStep("login_password"); }}
                        variant="outline"
                        className="w-full h-12 rounded-lg border-white/10 bg-[transparent] text-sm font-medium text-white/90 hover:bg-white/[0.05] hover:text-white transition-all justify-center"
                      >
                        Sign in with password instead
                      </Button>
                    </div>
                  )}
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer Links */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 text-xs text-white/30">
           <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
           <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
