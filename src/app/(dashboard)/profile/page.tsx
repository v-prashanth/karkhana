"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { User, Phone, Mail, ShieldCheck, CheckCircle2, UserCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toaster";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, setUser, organization } = useStore();
  const { toast } = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: (updatedUser) => {
      setUser({ ...user, ...updatedUser });
      toast("Profile updated successfully", "success");
    },
    onError: (error: Error) => {
      toast(error.message, "error");
    },
  });

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-white/5 bg-background/95 px-4 backdrop-blur-xl">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="-ml-2 p-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="ml-2">
            <h1 className="text-lg font-semibold text-foreground">Your Profile</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 xl:px-8 py-8 space-y-8">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_30px_rgba(255,107,43,0.15)]">
            <UserCircle2 className="h-12 w-12" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">{user?.name || "User"}</h2>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{user?.role} at {organization?.name}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Active Account
          </div>
        </div>

        {/* Edit Form */}
        <Card className="border-white/5 bg-white/[0.01]">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground border-b border-white/5 pb-3 mb-4">Personal Details</h3>
            
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                <User className="h-3 w-3" /> Full Name
              </label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="Your full name" 
                className="h-12 bg-white/[0.02]"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  <Phone className="h-3 w-3" /> Phone Number
                </label>
                <Input 
                  value={form.phone} 
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                  placeholder="Your phone number" 
                  className="h-12 bg-white/[0.02]"
                  disabled // Phone numbers usually shouldn't be edited freely if they are auth identifiers
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">Used for login. Contact support to change.</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  <Mail className="h-3 w-3" /> Email Address
                </label>
                <Input 
                  type="email"
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })} 
                  placeholder="Your email address" 
                  className="h-12 bg-white/[0.02]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security / Role Info */}
        <Card className="border-white/5 bg-white/[0.01]">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Role & Permissions</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  You are an <span className="text-foreground font-semibold capitalize">{user?.role}</span> in this workspace. 
                  {user?.role === 'owner' ? " You have full administrative access to all features, settings, and billing." : " Your access is restricted based on your role."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs shadow-[0_8px_32px_rgba(255,255,255,0.1)] hover:bg-white/90"
          onClick={() => saveProfile.mutate()} 
          disabled={saveProfile.isPending || (form.name === user?.name && form.email === user?.email && form.phone === user?.phone)}
        >
          {saveProfile.isPending ? "Saving..." : "Save Profile"}
        </Button>

      </div>
    </main>
  );
}
