import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Users, BriefcaseBusiness, FileText, Building2 } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile) {
      redirect("/home");
    }
  }

  return (
    <main className="min-h-screen bg-[#040404] px-5 py-12 text-foreground relative overflow-hidden flex flex-col justify-center">
      {/* Premium ambient glow background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-yellow-500/[0.015] blur-[150px] pointer-events-none" />

      <div className="mx-auto w-full max-w-2xl z-10 space-y-12">
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1c1a17] to-[#0e0d0c] border border-accent/20 text-accent shadow-[0_8px_20px_rgba(255,122,26,0.15),inset_0_1px_0_rgba(255,255,255,0.03)]">
            <Building2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-lg font-black uppercase tracking-[0.25em] text-white italic">Karkhana</span>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Where Business Grows</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-[#101010] px-4 py-2 text-[9px] font-black uppercase tracking-[0.25em] text-accent/90 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)]">
            <ShieldCheck className="h-4 w-4 text-accent animate-pulse" />
            Built for Growing Indian Businesses & Job Shops
          </div>

          <h1 className="text-4xl font-black uppercase italic leading-[1.1] tracking-tight sm:text-6.5xl">
            <span className="bg-gradient-to-r from-white via-white to-[#a6a6a6] bg-clip-text text-transparent">Where business</span>
            <br />
            <span className="bg-gradient-to-r from-[#ffd700] via-accent to-accent bg-clip-text text-transparent">grows naturally.</span>
          </h1>

          <p className="max-w-xl text-sm leading-7 text-muted-foreground/85 font-light">
            Karkhana replaces registers, paper books, and memory-based tracking with a flexible, mobile-first workspace tailored specifically to how your business works.
          </p>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-accent to-[#ffd700] px-8 text-[11px] font-black uppercase tracking-widest italic text-black shadow-[0_8px_25px_rgba(255,122,26,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(255,122,26,0.55)] active:scale-[0.98] border border-accent/25"
            >
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#101010] to-[#070707] border border-white/5 px-8 text-[11px] font-black uppercase tracking-widest italic text-white shadow-[6px_6px_16px_rgba(0,0,0,0.8),-3px_-3px_12px_rgba(255,255,255,0.012),inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-white/10 hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
              Sign in
            </Link>
          </div>

          {/* Neumorphic Feature Cards */}
          <div className="grid gap-4 pt-8 sm:grid-cols-3">
            {[
              { title: "Contacts", body: "Clients & suppliers details in one safe place.", icon: Users },
              { title: "Work", body: "Track jobs, tickets, and production orders.", icon: BriefcaseBusiness },
              { title: "Bills", body: "Create GST invoices, share, and track payments.", icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/5 bg-gradient-to-br from-[#101010] to-[#060606] p-5 shadow-[6px_6px_16px_rgba(0,0,0,0.8),-3px_-3px_12px_rgba(255,255,255,0.012),inset_0_1px_0_rgba(255,255,255,0.03)] space-y-4 hover:border-accent/15 transition-colors group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/5 text-accent border border-accent/10 shadow-[inset_1px_1px_3px_rgba(255,122,26,0.15)] group-hover:bg-accent/10 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">{item.title}</p>
                    <p className="mt-2 text-xs font-medium text-white/80 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Footer */}
          <div className="pt-8 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground/60">
            <span>Karkhana — Where Business Grows</span>
            <span>Made for Indian MSMEs</span>
          </div>
        </div>
      </div>
    </main>
  );
}
