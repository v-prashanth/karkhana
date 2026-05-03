"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toaster";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast("Password updated successfully!", "success");
      // Since they are fully authenticated to do this, take them to the dashboard
      router.push("/home");
    } catch (error: unknown) {
      toast((error as Error).message || "Could not update password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#030303] p-6 text-white selection:bg-white/20">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-black mb-2">
            <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-white/95">Set New Password</h1>
          <p className="text-sm font-light text-white/50">
            Please enter your new secure password below to regain access to your workspace.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Your new password"
              className="h-14 pl-12 bg-white/[0.02] border-white/10 focus:border-white/30 focus:bg-white/[0.04] text-lg font-light text-white rounded-lg transition-all pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-all" 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : "Update Password"}
          </Button>
        </form>
      </div>
    </main>
  );
}
