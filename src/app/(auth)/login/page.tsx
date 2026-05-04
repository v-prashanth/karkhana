"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isRegister = pathname.includes("register");
  
  const [step, setStep] = useState<"enter_identifier" | "login_password" | "signup_password" | "verify_otp">("enter_identifier");
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

      if (exists) {
        setStep("login_password");
      } else {
        setStep("signup_password");
      }
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
      await authApi.signInWithPassword(identifier, password);
      router.push("/home"); 
    } catch (error: unknown) {
      toast((error as Error).message || "Invalid password", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast("Password must be at least 8 characters", "error");
      return;
    }
    setLoading(true);
    try {
      await authApi.signUpWithPassword(identifier, password);
      if (!isEmail) {
        // Phone signups send an SMS verify OTP automatically
        setStep("verify_otp");
        toast("Verification code sent to your mobile", "success");
      } else {
        // Assuming email auto-confirms or they are now logged in
        toast("Account created successfully", "success");
        router.push("/home");
      }
    } catch (error: unknown) {
      toast((error as Error).message || "Could not create account", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtpInstead = async () => {
    setLoading(true);
    try {
      if (isEmail) {
        await authApi.requestEmailOtp(identifier);
      } else {
        await authApi.signInWithPhone(identifier);
      }
      setStep("verify_otp");
      toast("Code sent to your device", "success");
    } catch (error: unknown) {
      toast((error as Error).message || "Failed to send code", "error");
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
      router.push(isPasswordReset ? "/update-password" : "/home");
    } catch (error: unknown) {
      toast((error as Error).message || "Invalid code", "error");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
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
    <main className="flex min-h-screen bg-[#030303] text-white selection:bg-white/20 items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-10">
        
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-xl">
            <ShieldCheck className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-white">Karkhana</h1>
            <p className="text-xs text-white/40 font-medium tracking-widest uppercase mt-1">Universal Business OS</p>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── IDENTIFIER STEP ── */}
          {step === "enter_identifier" && (
            <motion.div key="identifier" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-medium tracking-tight text-white/95">
                  {isRegister ? "Create account" : "Welcome back"}
                </h2>
                <p className="text-sm text-white/50 mt-3 font-light">
                  {isRegister ? "Start managing your business flawlessly." : "Sign in to continue to your workspace."}
                </p>
              </div>

              <form onSubmit={handleIdentifierSubmit} className="space-y-6">
                <Input
                  type="text"
                  placeholder="Email or Mobile number"
                  className="h-14 bg-white/[0.02] border-white/10 focus:border-white/30 focus:bg-white/[0.04] text-lg font-light text-white rounded-2xl transition-all"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.toLowerCase().trim())}
                  autoFocus
                  required
                />
                <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || !identifier}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#030303] px-4 text-white/30 tracking-widest">or</span>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleGoogleLogin}
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-white/10 bg-transparent text-sm font-medium text-white/90 hover:bg-white/[0.05] hover:text-white transition-all justify-center"
                  disabled={loading}
                >
                  <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" width={18} height={18} className="mr-3" unoptimized />
                  Continue with Google
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-white/40">
                  {isRegister ? "Already have an account?" : "New to Karkhana?"}{" "}
                  <Link href={isRegister ? "/login" : "/register"} className="text-white hover:underline font-medium ml-1">
                    {isRegister ? "Sign in" : "Sign up"}
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── LOGIN PASSWORD STEP ── */}
          {step === "login_password" && (
            <motion.div key="login_password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <button onClick={() => { setStep("enter_identifier"); setPassword(""); }} className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors mb-6 font-medium uppercase tracking-widest">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <h2 className="text-3xl font-medium tracking-tight text-white/95">Enter password</h2>
                <p className="mt-3 text-sm text-white/50 font-light break-all">
                  Logging into {identifier}
                </p>
              </div>
              
              <form onSubmit={handlePasswordLogin} className="space-y-5">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    className="h-14 bg-white/[0.02] border-white/10 focus:border-white/30 focus:bg-white/[0.04] text-sm text-white placeholder:text-white/30 rounded-2xl transition-all pr-12 font-light"
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
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || !password}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Sign In"}
                  </Button>
                  
                  <Button type="button" onClick={handleRequestOtpInstead} variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-transparent text-sm font-medium text-white/90 hover:bg-white/[0.05] hover:text-white transition-all justify-center" disabled={loading}>
                    Sign in with Code Instead
                  </Button>
                </div>
              </form>

              {!forgotSent && (
                <div className="text-center">
                  <button onClick={handleForgotPassword} disabled={loading} className="text-sm text-white/50 hover:text-white transition-colors">
                    Forgot your password?
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── SIGNUP PASSWORD STEP ── */}
          {step === "signup_password" && (
            <motion.div key="signup_password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <button onClick={() => { setStep("enter_identifier"); setPassword(""); }} className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors mb-6 font-medium uppercase tracking-widest">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <h2 className="text-3xl font-medium tracking-tight text-white/95">Create password</h2>
                <p className="mt-3 text-sm text-white/50 font-light break-all">
                  Creating an account for {identifier}
                </p>
              </div>
              
              <form onSubmit={handlePasswordSignup} className="space-y-5">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    className="h-14 bg-white/[0.02] border-white/10 focus:border-white/30 focus:bg-white/[0.04] text-sm text-white placeholder:text-white/30 rounded-2xl transition-all pr-12 font-light"
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
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || password.length < 8}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Sign Up"}
                  </Button>
                  
                  <Button type="button" onClick={handleRequestOtpInstead} variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-transparent text-sm font-medium text-white/90 hover:bg-white/[0.05] hover:text-white transition-all justify-center" disabled={loading}>
                    Sign up with Code Instead
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── OTP VERIFY STEP ── */}
          {step === "verify_otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div>
                <button onClick={() => { setStep("enter_identifier"); setOtp(""); }} className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors mb-6 font-medium uppercase tracking-widest">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <h2 className="text-3xl font-medium tracking-tight text-white/95">
                  {isPasswordReset ? "Reset password" : isNewUser ? "Verify account" : "Enter code"}
                </h2>
                <p className="text-sm text-white/50 mt-3 font-light break-all">
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
                    className="h-16 pl-12 bg-white/[0.02] border-white/10 focus:border-white/30 focus:bg-white/[0.04] text-3xl font-light text-center tracking-[0.5em] text-white rounded-2xl transition-all"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || otp.length < 6}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : isPasswordReset ? "Verify & Reset" : "Verify & Continue"}
                </Button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Footer Links */}
        <div className="pt-8 flex justify-center gap-6 text-xs text-white/20">
           <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
           <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
      </div>
    </main>
  );
}
