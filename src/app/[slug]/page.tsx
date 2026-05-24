"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  MapPin,
  ShieldCheck,
  Users,
  BriefcaseBusiness,
  Globe,
  Crown,
  Phone,
  Mail,
  ExternalLink,
  Download,
  Share2,
  MessageCircle,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Organization } from "@/types/database";

/**
 * Public Business Card — v5 (Flippable Card)
 * A premium shareable digital business card at karkhana.app/[slug]
 * Front: Brand identity, logo, name, tagline
 * Back: Contact details, capabilities, UPI, address
 */
export default function BusinessCardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`/api/profile/${slug}`);
        if (!res.ok) throw new Error("Business profile not found");
        const data = await res.json();
        setOrg(data);
      } catch {
        setError("This business card doesn't exist or has been removed.");
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadProfile();
  }, [slug]);

  const flip = useCallback(() => setIsFlipped((f) => !f), []);

  const handleSaveContact = () => {
    window.open(`/api/profile/${slug}/vcard`, "_blank");
  };

  const handleWhatsApp = () => {
    if (!org?.phone) return;
    const phone = org.phone.startsWith("+") ? org.phone : `+91${org.phone.replace(/\D/g, "")}`;
    window.open(`https://wa.me/${phone.replace(/\+/g, "")}?text=Hi ${org.name}, I found your business card on Karkhana.`, "_blank");
  };

  const handleCall = () => {
    if (!org?.phone) return;
    window.open(`tel:${org.phone.startsWith("+") ? org.phone : "+91" + org.phone.replace(/\D/g, "")}`, "_self");
  };

  const handleEmail = () => {
    if (!org?.email) return;
    window.open(`mailto:${org.email}?subject=Inquiry from Karkhana&body=Hi ${org.name},`, "_self");
  };

  const handleDirections = () => {
    if (!org?.address) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(org.address)}`, "_blank");
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${org?.name} — Business Card`,
      text: `Check out ${org?.name} on Karkhana`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleCopyPhone = async () => {
    if (!org?.phone) return;
    await navigator.clipboard.writeText(org.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // UPI deep link
  const upiLink = org?.upi_id
    ? `upi://pay?pa=${org.upi_id}&pn=${encodeURIComponent(org.name)}&cu=INR`
    : null;

  if (loading) return <CardSkeleton />;
  if (error || !org) return <CardError error={error || "Profile not found"} />;

  const brandColor = org.brand_primary_color || "#ff6b2b";
  const city = org.address?.split(",").pop()?.trim() || "India";
  const memberSince = new Date(org.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const capabilities = org.capabilities?.length > 0 ? org.capabilities : [];

  return (
    <main className="min-h-screen bg-[#030303] text-white overflow-hidden relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: `radial-gradient(circle, ${brandColor}, transparent 70%)` }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8 md:py-12">

        {/* Top Badge */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 backdrop-blur-xl"
        >
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: brandColor }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            {org.is_verified ? "Verified Business" : "Karkhana Business Card"}
          </span>
        </motion.div>

        {/* ═══ THE CARD ═══ */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-[420px] mb-8"
          style={{ perspective: "1200px" }}
        >
          <div
            onClick={flip}
            className={cn(
              "relative w-full cursor-pointer transition-transform duration-500 ease-out",
              "[transform-style:preserve-3d]",
              isFlipped && "[transform:rotateY(180deg)]"
            )}
            style={{ aspectRatio: "1.6 / 1" }}
          >
            {/* ─── FRONT ─── */}
            <div className="absolute inset-0 [backface-visibility:hidden] rounded-[24px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#111] via-[#0a0a0a] to-[#080808] border border-white/[0.08] rounded-[24px]" />
              {/* Accent glow line at top */}
              <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full opacity-80"
                style={{ background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)` }} />
              {/* Subtle grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />

              <div className="relative h-full flex flex-col justify-between p-6 md:p-8">
                {/* Top section */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center border border-white/10 bg-white/[0.04] shadow-lg overflow-hidden shrink-0">
                      {org.logo_url ? (
                        <Image src={org.logo_url} alt={org.name} width={48} height={48} className="h-full w-full object-contain p-1" unoptimized />
                      ) : (
                        <Building2 className="h-6 w-6 text-white/40" />
                      )}
                    </div>
                    {org.is_verified && (
                      <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/20">EST.</p>
                    <p className="text-sm font-bold text-white/40 font-mono">
                      {org.year_established || "—"}
                    </p>
                  </div>
                </div>

                {/* Center — Business Name */}
                <div className="space-y-1.5">
                  <h1 className="text-2xl md:text-[28px] font-black tracking-tight text-white uppercase leading-[1.1]">
                    {org.name}
                  </h1>
                  {org.tagline && (
                    <p className="text-[11px] text-white/40 leading-relaxed max-w-[280px]">{org.tagline}</p>
                  )}
                </div>

                {/* Bottom row */}
                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-medium text-white/30 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{city}</span>
                    <span className="flex items-center gap-1"><BriefcaseBusiness className="h-3 w-3" />{org.business_type?.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-white/20 uppercase tracking-widest">
                    <RotateCcw className="h-3 w-3" />
                    Flip
                  </div>
                </div>
              </div>
            </div>

            {/* ─── BACK ─── */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[24px] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e0e] via-[#080808] to-[#050505] border border-white/[0.08] rounded-[24px]" />
              <div className="absolute bottom-0 left-8 right-8 h-[2px] rounded-full opacity-80"
                style={{ background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)` }} />

              <div className="relative h-full flex flex-col justify-between p-6 md:p-8 overflow-hidden">
                {/* Contact Details */}
                <div className="space-y-2.5">
                  {org.owner_name && (
                    <p className="text-sm font-bold text-white/80">{org.owner_name}</p>
                  )}
                  {org.phone && (
                    <div className="flex items-center gap-2 text-[11px] text-white/50">
                      <Phone className="h-3 w-3 shrink-0" style={{ color: brandColor }} />
                      <span className="font-mono">{org.phone.startsWith("+") ? org.phone : `+91 ${org.phone}`}</span>
                    </div>
                  )}
                  {org.email && (
                    <div className="flex items-center gap-2 text-[11px] text-white/50">
                      <Mail className="h-3 w-3 shrink-0" style={{ color: brandColor }} />
                      <span className="truncate">{org.email}</span>
                    </div>
                  )}
                  {org.address && (
                    <div className="flex items-start gap-2 text-[11px] text-white/50 leading-relaxed">
                      <MapPin className="h-3 w-3 shrink-0 mt-0.5" style={{ color: brandColor }} />
                      <span className="line-clamp-2">{org.address}</span>
                    </div>
                  )}
                </div>

                {/* Bottom — GSTIN + Karkhana badge */}
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    {org.gstin && (
                      <p className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
                        GSTIN: {org.gstin}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-md flex items-center justify-center" style={{ backgroundColor: `${brandColor}20` }}>
                        <Sparkles className="h-2.5 w-2.5" style={{ color: brandColor }} />
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/20">Karkhana</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-white/20 uppercase tracking-widest">
                    <RotateCcw className="h-3 w-3" />
                    Flip
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ QUICK ACTIONS ═══ */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-[420px] grid grid-cols-4 gap-2 mb-6"
        >
          {[
            { icon: Phone, label: "Call", action: handleCall, disabled: !org.phone },
            { icon: MessageCircle, label: "WhatsApp", action: handleWhatsApp, disabled: !org.phone },
            { icon: Mail, label: "Email", action: handleEmail, disabled: !org.email },
            { icon: MapPin, label: "Directions", action: handleDirections, disabled: !org.address },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              disabled={item.disabled}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-all active:scale-95",
                item.disabled ? "opacity-30 cursor-not-allowed" : "hover:bg-white/[0.05] hover:border-white/10"
              )}
            >
              <item.icon className="h-5 w-5 text-white/70" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">{item.label}</span>
            </button>
          ))}
        </motion.div>

        {/* ═══ SAVE & SHARE ═══ */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-[420px] grid grid-cols-2 gap-3 mb-8"
        >
          <button
            onClick={handleSaveContact}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-wider transition-all hover:bg-white/90 active:scale-[0.98] shadow-[0_8px_32px_rgba(255,255,255,0.08)]"
          >
            <Download className="h-4 w-4" />
            Save Contact
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 h-14 rounded-2xl border border-white/10 bg-white/[0.03] text-white font-bold text-xs uppercase tracking-wider transition-all hover:bg-white/[0.06] active:scale-[0.98]"
          >
            {shared ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
            {shared ? "Copied!" : "Share Card"}
          </button>
        </motion.div>

        {/* ═══ DETAILS BELOW THE CARD ═══ */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-[420px] space-y-4 mb-8"
        >
          {/* Capabilities */}
          {capabilities.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Services & Capabilities</p>
              <div className="flex flex-wrap gap-2">
                {capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    style={{
                      color: brandColor,
                      borderColor: `${brandColor}20`,
                      backgroundColor: `${brandColor}08`,
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <BriefcaseBusiness className="h-4 w-4 mx-auto mb-2 text-white/20" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Industry</p>
              <p className="text-xs font-bold text-white/70 mt-1 capitalize">{org.business_type?.replace("_", " ")}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <Users className="h-4 w-4 mx-auto mb-2 text-white/20" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Team</p>
              <p className="text-xs font-bold text-white/70 mt-1">{org.employee_count || "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <Calendar className="h-4 w-4 mx-auto mb-2 text-white/20" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Since</p>
              <p className="text-xs font-bold text-white/70 mt-1">{org.year_established || "—"}</p>
            </div>
          </div>

          {/* UPI Payment Section */}
          {org.upi_id && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" style={{ color: brandColor }} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Pay via UPI</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                <p className="text-sm font-mono text-white/60 flex-1 truncate">{org.upi_id}</p>
                <button
                  onClick={handleCopyPhone}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-white/10"
                  style={{ color: brandColor }}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <a
                href={upiLink!}
                className="flex items-center justify-center gap-2 w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider text-white transition-all active:scale-[0.98]"
                style={{ backgroundColor: brandColor }}
              >
                Pay Now
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Trust Signals */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Trust & Verification</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${brandColor}15` }}>
                  <ShieldCheck className="h-4 w-4" style={{ color: brandColor }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/70">{org.is_verified ? "Verified Business" : "Karkhana Member"}</p>
                  <p className="text-[10px] text-white/30">Since {memberSince}</p>
                </div>
              </div>
              {org.gstin && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/70">GST Registered</p>
                    <p className="text-[10px] font-mono text-white/30">{org.gstin}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ VIRAL CTA ═══ */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-[420px] mb-8"
        >
          <a
            href="/register"
            className="block w-full rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-6 hover:border-white/10 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white/70">Create your own Business Card</p>
                <p className="text-[10px] text-white/30">Join thousands of Indian SMBs on Karkhana — Free</p>
              </div>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center transition-all group-hover:translate-x-1"
                style={{ backgroundColor: `${brandColor}15` }}>
                <ArrowRight className="h-4 w-4" style={{ color: brandColor }} />
              </div>
            </div>
          </a>
        </motion.div>

        {/* Footer */}
        <p className="text-[9px] text-white/15 uppercase tracking-[0.4em] font-bold pb-4">
          Powered by Karkhana
        </p>
      </div>
    </main>
  );
}

/* ═══ Loading Skeleton ═══ */
function CardSkeleton() {
  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px] space-y-6">
        <div className="mx-auto h-8 w-48 rounded-full bg-white/5 animate-pulse" />
        <div className="w-full rounded-[24px] bg-white/[0.03] animate-pulse" style={{ aspectRatio: "1.6 / 1" }} />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 rounded-2xl bg-white/5 animate-pulse" />
          <div className="h-14 rounded-2xl bg-white/[0.03] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ═══ Error State ═══ */
function CardError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="h-20 w-20 bg-white/[0.03] border border-white/[0.06] rounded-3xl flex items-center justify-center">
        <Building2 className="h-8 w-8 text-white/10" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white/80">Card Not Found</h2>
        <p className="text-sm text-white/30 mt-2 max-w-xs">{error}</p>
      </div>
      <a
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-white/50 hover:bg-white/[0.06] transition-all"
      >
        Go to Karkhana
      </a>
    </div>
  );
}
