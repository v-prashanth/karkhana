"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  User, Phone, Mail, ShieldCheck, CheckCircle2, UserCircle2, ArrowLeft,
  Crown, MapPin, BriefcaseBusiness, RotateCcw, Globe, Sparkles, Building2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toaster";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, setUser, organization } = useStore();
  const { toast } = useToast();
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);

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

  const brandColor = organization?.brand_primary_color || "#ff6b2b";
  const city = organization?.address?.split(",").pop()?.trim() || "India";

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

        {/* Business Card Section */}
        {organization?.public_slug && (
          <div className="space-y-4 max-w-[420px] mx-auto w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#888]">Your Digital Business Card</h3>
              <a
                href={`/${organization.public_slug}`}
                target="_blank"
                className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
              >
                View Live Card <Globe className="h-3 w-3" />
              </a>
            </div>

            {/* Flippable Card */}
            <div className="w-full" style={{ perspective: "1200px" }}>
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={cn(
                  "relative w-full cursor-pointer transition-transform duration-500 ease-out",
                  "[transform-style:preserve-3d]",
                  isFlipped && "[transform:rotateY(180deg)]"
                )}
                style={{ aspectRatio: "1.6 / 1" }}
              >
                {/* FRONT */}
                <div className="absolute inset-0 [backface-visibility:hidden] rounded-[20px] overflow-hidden border border-white/[0.08]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#111] via-[#0a0a0a] to-[#080808]" />
                  <div className="absolute top-0 left-6 right-6 h-[1.5px] rounded-full opacity-80"
                    style={{ background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)` }} />
                  
                  <div className="relative h-full flex flex-col justify-between p-5 md:p-6 text-white text-left">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.04] overflow-hidden shrink-0">
                          {organization.logo_url ? (
                            <Image src={organization.logo_url} alt={organization.name} width={40} height={40} className="h-full w-full object-contain p-1" unoptimized />
                          ) : (
                            <Building2 className="h-5 w-5 text-white/40" />
                          )}
                        </div>
                        {organization.is_verified && (
                          <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                            <Crown className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[7px] font-bold uppercase tracking-[0.3em] text-white/20">EST.</p>
                        <p className="text-xs font-bold text-white/40 font-mono">{organization.year_established || "—"}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-lg font-black tracking-tight text-white uppercase leading-tight truncate">
                        {organization.name}
                      </h4>
                      {organization.tagline && (
                        <p className="text-[9px] text-white/40 leading-relaxed truncate max-w-[280px]">{organization.tagline}</p>
                      )}
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="flex items-center gap-3 text-[8px] font-medium text-white/30 uppercase tracking-wider font-semibold">
                        <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{city}</span>
                        <span className="flex items-center gap-0.5"><BriefcaseBusiness className="h-2.5 w-2.5" />{organization.business_type?.replace("_", " ")}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[8px] text-white/20 uppercase tracking-widest font-semibold">
                        <RotateCcw className="h-2.5 w-2.5" /> Flip
                      </span>
                    </div>
                  </div>
                </div>

                {/* BACK */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[20px] overflow-hidden border border-white/[0.08]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e0e] via-[#080808] to-[#050505]" />
                  <div className="absolute bottom-0 left-6 right-6 h-[1.5px] rounded-full opacity-80"
                    style={{ background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)` }} />

                  <div className="relative h-full flex flex-col justify-between p-5 md:p-6 text-white text-left">
                    <div className="space-y-2">
                      {organization.owner_name && (
                        <p className="text-xs font-bold text-white/80">{organization.owner_name}</p>
                      )}
                      {organization.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                          <Phone className="h-2.5 w-2.5 shrink-0" style={{ color: brandColor }} />
                          <span className="font-mono">{organization.phone}</span>
                        </div>
                      )}
                      {organization.email && (
                        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                          <Mail className="h-2.5 w-2.5 shrink-0" style={{ color: brandColor }} />
                          <span className="truncate">{organization.email}</span>
                        </div>
                      )}
                      {organization.address && (
                        <div className="flex items-start gap-1.5 text-[10px] text-white/50 leading-tight">
                          <MapPin className="h-2.5 w-2.5 shrink-0 mt-0.5" style={{ color: brandColor }} />
                          <span className="line-clamp-2">{organization.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-end justify-between">
                      <div className="space-y-0.5">
                        {organization.gstin && (
                          <p className="text-[8px] font-mono text-white/20 uppercase tracking-wider">GSTIN: {organization.gstin}</p>
                        )}
                        <div className="flex items-center gap-1">
                          <div className="h-3.5 w-3.5 rounded-md flex items-center justify-center" style={{ backgroundColor: `${brandColor}20` }}>
                            <Sparkles className="h-2 w-2" style={{ color: brandColor }} />
                          </div>
                          <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-white/20">Karkhana</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[8px] text-white/20 uppercase tracking-widest font-semibold">
                        <RotateCcw className="h-2.5 w-2.5" /> Flip
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
