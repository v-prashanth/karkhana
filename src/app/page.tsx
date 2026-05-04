import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto flex min-h-[85vh] max-w-2xl flex-col justify-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Built for Indian SMBs
          </div>

          <h1 className="text-4xl font-black uppercase italic tracking-tight text-white sm:text-5xl">
            Run your business like a system.
          </h1>

          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Karkhana replaces registers, loose paper, and WhatsApp confusion with a simple workspace for contacts, work,
            bills, payments, and expenses.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/login"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-6 text-[11px] font-black uppercase tracking-widest italic text-black"
            >
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/auth/login"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] px-6 text-[11px] font-black uppercase tracking-widest italic text-white hover:bg-white/[0.04]"
            >
              Sign in
            </Link>
          </div>

          <div className="grid gap-3 pt-6 sm:grid-cols-3">
            {[
              { title: "Contacts", body: "Clients and suppliers in one place." },
              { title: "Work", body: "Track jobs, tickets, or projects." },
              { title: "Bills", body: "Create, share, and record payments." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#777]">{item.title}</p>
                <p className="mt-2 text-sm font-semibold text-white">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="pt-10 text-[10px] font-black uppercase tracking-[0.28em] text-[#555]">
            By continuing, you agree to our{" "}
            <Link className="text-accent hover:underline" href="/privacy">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link className="text-accent hover:underline" href="/network-terms">
              Network Terms
            </Link>
            .
          </div>
        </div>
      </div>
    </main>
  );
}
