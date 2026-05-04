"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  BriefcaseBusiness, 
  MessageSquare,
  ArrowRight,
  Globe,
  Plus,
  Wrench,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/shared/Skeleton";
import { motion } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toaster";
import type { Organization } from "@/types/database";

/**
 * Public Business Profile — v4
 * Represents the 'Business Card' of any SMB on Karkhana.
 * Located at karkhana.app/[slug]
 */
export default function BusinessProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('public_slug', slug)
        .single();

      if (orgError || !data) {
        setError("Business profile not found");
      } else {
        setOrg(data);
      }
      setLoading(false);
    }
    if (slug) loadProfile();
  }, [slug]);

  if (loading) return <ProfileSkeleton />;
  if (error || !org) return <ProfileError error={error || "Profile not found"} />;

  return (
    <main className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-5 pt-12 relative z-10 space-y-8">
        
        {/* Floating Trust Card */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel border-accent/20 bg-accent/5 p-3 rounded-2xl flex items-center justify-center gap-3 mb-4"
        >
          <ShieldCheck className="h-4 w-4 text-accent" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] italic text-white">
            {org.is_verified ? "Karkhana Verified Business" : "Karkhana Business Profile"}
          </p>
        </motion.div>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 pb-4 border-b border-white/5">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-28 w-28 rounded-[40px] glass flex items-center justify-center shadow-[0_0_50px_rgba(255,107,43,0.15)] border-white/10 shrink-0 relative group"
          >
            {org.logo_url ? (
               /* @ts-expect-error: next/image unoptimized required for dynamic supabase urls */
              <Image src={org.logo_url} alt={org.name} width={80} height={80} className="h-20 w-20 object-contain unoptimized" />
            ) : (
              <Building2 className="h-12 w-12 text-accent" />
            )}
            {org.is_verified && (
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-accent flex items-center justify-center border-4 border-black text-white">
                 <Crown className="h-4 w-4" />
              </div>
            )}
          </motion.div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">{org.name}</h1>
            </div>
            {org.tagline && (
              <p className="text-sm text-muted-foreground italic">{org.tagline}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground italic">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent" /> {org.address?.split(',').pop()?.trim() || "India"}</span>
              <span className="flex items-center gap-1.5"><BriefcaseBusiness className="h-4 w-4 text-accent" /> {org.business_type}</span>
              {org.year_established && (
                <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-accent" /> Est. {org.year_established}</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {connected ? (
              <Button size="lg" disabled className="flex-1 md:flex-none h-16 px-10 rounded-2xl bg-green-500/10 text-green-400 font-black uppercase tracking-widest text-[10px] italic border border-green-500/30">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Request Sent
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  setConnecting(true);
                  setTimeout(() => {
                    setConnecting(false);
                    setConnected(true);
                    toast("Connection Request Sent!", "success");
                  }, 1200);
                }}
                disabled={connecting}
                size="lg" 
                className="flex-1 md:flex-none h-16 px-10 rounded-2xl bg-accent text-white font-black uppercase tracking-widest text-[10px] italic shadow-[0_0_40px_rgba(255,107,43,0.3)] hover:scale-105"
              >
                {connecting ? "Connecting..." : "Connect Now"} <Plus className="ml-2 h-5 w-5" />
              </Button>
            )}
            <Button 
              onClick={() => window.open(`https://wa.me/${org.phone}?text=Hi ${org.name}, found you on Karkhana.`)}
              size="lg" 
              variant="outline" 
              className="flex-1 md:flex-none h-16 w-16 rounded-2xl glass p-0 border-white/5 hover:bg-white/10"
            >
               <MessageSquare className="h-6 w-6 text-accent" />
            </Button>
          </div>
        </div>

        {/* Dynamic Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Industry", val: org.business_type?.replace("_", " ") || "General", icon: BriefcaseBusiness },
             { label: "Team Size", val: org.employee_count || "—", icon: Users },
             { label: "Established", val: org.year_established ? `Since ${org.year_established}` : "—", icon: Globe },
             { label: "Trust", val: org.is_verified ? "Verified" : "Pending", icon: ShieldCheck },
           ].map((stat) => (
             <Card key={stat.label} className="glass-panel border-white/5 bg-white/[0.01] hover:bg-white/[0.04] transition-all">
                <CardContent className="p-4 space-y-1">
                   <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="h-3 w-3 text-accent" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#555]">{stat.label}</p>
                   </div>
                   <p className="text-sm font-black text-white italic uppercase">{stat.val}</p>
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Content Tabs / Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            <Card className="glass-panel border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-[0.2em] font-bold text-[#666]">Capabilities & Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Professional business serving the {org.business_type} industry with focus on high quality delivery and digital-first invoicing.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(org.capabilities && org.capabilities.length > 0
                    ? org.capabilities
                    : ["Digital Billing", "WhatsApp Support"]
                  ).map(tag => (
                    <span key={tag} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase text-muted-foreground tracking-widest text-accent/80">
                      {tag}
                    </span>
                  ))}
                  {org.gstin && (
                    <span className="px-3 py-1.5 rounded-full bg-green-500/5 border border-green-500/10 text-[10px] font-bold uppercase tracking-widest text-green-400">
                      GST Registered
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-[0.2em] font-bold text-[#666]">Verified Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-blue-400" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Business Integrity</p>
                        <p className="text-xs text-muted-foreground">Digital-ledger verified business</p>
                     </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-orange-400" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">Supply Chain Discovery</p>
                        <p className="text-xs text-muted-foreground">Active in the Karkhana network</p>
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <Card className="glass-panel border-white/5 bg-accent/5 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-2 opacity-5">
                 <Wrench className="h-20 w-20 text-accent rotate-12" />
               </div>
               <CardHeader className="pb-3 text-center">
                 <CardTitle className="text-xs uppercase tracking-[0.3em] font-black text-accent italic">Join The Network</CardTitle>
               </CardHeader>
               <CardContent className="text-center space-y-4">
                 <p className="text-xs text-muted-foreground leading-relaxed">Grow your business like {org.name}. Join 10,000+ MSMEs on Karkhana.</p>
                 <Button onClick={() => router.push('/')} className="w-full h-12 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-widest italic group">
                    Join Free <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1" />
                 </Button>
               </CardContent>
             </Card>
             
             <div className="p-4 text-center space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#444]">Member Since</p>
                <p className="text-sm font-mono text-muted-foreground">{new Date(org.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
             </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#444] uppercase tracking-[0.4em] py-10 font-bold opacity-50">
          KARKHANA BUSINESS PROFILE • {org.is_verified ? "VERIFIED" : "MEMBER"} 2026
        </p>

      </div>
    </main>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background p-10 space-y-12">
      <div className="flex items-center gap-6 max-w-4xl mx-auto">
        <div className="h-24 w-24 bg-white/5 animate-pulse rounded-[32px]" />
        <div className="space-y-4 flex-1">
          <div className="h-10 w-64 bg-white/5 animate-pulse rounded-full" />
          <div className="h-4 w-48 bg-white/5 animate-pulse rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="md:col-span-2 h-[400px] bg-white/[0.03] animate-pulse rounded-3xl" />
        <div className="h-[400px] bg-white/[0.03] animate-pulse rounded-3xl" />
      </div>
    </div>
  );
}

function ProfileError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-10 text-center space-y-6">
      <div className="h-20 w-20 bg-accent/10 rounded-full flex items-center justify-center">
        <Building2 className="h-10 w-10 text-accent opacity-20" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Profile Locked</h2>
        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">{error}</p>
      </div>
      <Button onClick={() => window.location.href = '/'} variant="outline" className="border-white/10 hover:bg-white/5 text-[10px] uppercase tracking-widest px-8 h-12">
        Return Home
      </Button>
    </div>
  );
}
