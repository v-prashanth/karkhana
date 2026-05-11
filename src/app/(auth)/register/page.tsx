"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toaster";
import { authApi } from "@/lib/api/auth";
import { useStore } from "@/store/useStore";

import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

import validator from "validator";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, authHydrated } = useStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (authHydrated && user) {
      router.replace("/home");
    }
  }, [authHydrated, user, router]);

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
      // Show success state — AuthProvider's onAuthStateChange will
      // hydrate the session and the useEffect above will redirect to /home
      setRegistered(true);
    } catch (error: any) {
      // Show the actual error message from the API
      toast(error.message || "Could not create account", "error");
    } finally {
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

  // Show a polished success screen while AuthProvider hydrates
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

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
            <div>
              <h1 className="text-3xl font-medium tracking-tight text-white/95">Create your account</h1>
              <p className="mt-3 text-sm text-white/50 font-light">Join thousands of Indian SMBs running their business flawlessly.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-white/70">Work email <span className="text-red-500">*</span></label>
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
                <PasswordStrengthIndicator password={password} email={email} />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-white/70">Confirm password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="h-14 bg-[#111111] border-[#1E1E1E] focus:border-accent focus:ring-1 focus:ring-accent text-sm font-light text-white rounded-xl transition-all pr-12"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-14 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || !email || !password || !confirmPassword}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Create account"}
              </Button>
            </form>

            <div className="text-center text-sm">
              <p className="text-white/40">
                Already have account?{" "}
                <Link href="/login" className="text-white hover:underline font-medium ml-1">Log in</Link>
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
              <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-14 rounded-xl border-[#1E1E1E] bg-transparent text-sm font-medium text-white/80 hover:bg-[#111111] hover:text-white transition-all justify-center" disabled={loading}>
                <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={18} height={18} className="mr-3" unoptimized />
                Continue with Google
              </Button>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
