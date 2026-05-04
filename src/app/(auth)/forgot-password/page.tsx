"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, ChevronLeft, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toaster";
import { authApi } from "@/lib/api/auth";

import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";
import DOMPurify from "isomorphic-dompurify";
import validator from "validator";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sanitizedEmail = DOMPurify.sanitize(email).trim().toLowerCase();
    if (!validator.isEmail(sanitizedEmail)) {
      toast("Please enter a valid email address", "error");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(sanitizedEmail);
      setSuccess(true);
    } catch (error: any) {
      // Per spec: Always show same success message regardless of whether email exists
      // "If an account exists with this email, you'll receive a reset link within a few minutes."
      // We do not reveal if the email exists or not to prevent enumeration.
      setSuccess(true);
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
            {!success ? (
              <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="space-y-8">
                <div>
                  <Link href="/login" className="flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors mb-6 font-medium uppercase tracking-widest w-fit">
                    <ChevronLeft className="h-4 w-4" /> Back to log in
                  </Link>
                  <h1 className="text-3xl font-medium tracking-tight text-white/95">Reset your password</h1>
                  <p className="mt-3 text-sm text-white/50 font-light">
                    Enter your email address and we'll send a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white/70">Email</label>
                    <Input
                      id="email"
                      type="email"
                      className="h-14 bg-[#111111] border-[#1E1E1E] focus:border-accent focus:ring-1 focus:ring-accent text-sm font-light text-white rounded-xl transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-xl bg-white text-black text-sm font-bold hover:bg-white/90 transition-all" disabled={loading || !email}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Send reset link"}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="space-y-6 text-center">
                <div className="flex justify-center mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <MailCheck className="h-8 w-8" />
                  </div>
                </div>
                <h1 className="text-2xl font-medium tracking-tight text-white/95">Check your email</h1>
                <p className="text-sm text-white/50 font-light leading-relaxed">
                  If an account exists with <span className="font-medium text-white">{email}</span>, you'll receive a password reset link within a few minutes.
                </p>
                <div className="pt-6">
                  <Link href="/login">
                    <Button className="w-full h-14 rounded-xl border border-[#1E1E1E] bg-transparent text-sm font-medium text-white/80 hover:bg-[#111111] hover:text-white transition-all">
                      Return to log in
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}
