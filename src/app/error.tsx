"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center">
        <div className="glass-panel w-full rounded-[32px] p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/10 text-red-400">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.35em] text-red-400">Something Broke</p>
          <h1 className="mt-3 text-3xl font-black uppercase italic tracking-tight text-white">We hit a problem</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Your data is safe. Try reloading this screen. If this keeps happening, go back to the dashboard and try again.
          </p>
          {error?.message ? (
            <p className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 font-mono text-xs text-muted-foreground">
              {error.message}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={reset} className="h-12 rounded-2xl bg-accent px-6 text-[11px] font-black uppercase tracking-widest italic">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
            <Link href="/home">
              <Button variant="outline" className="h-12 rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest italic">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
