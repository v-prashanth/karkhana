"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function JobDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Job detail error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400 mb-2">
          Something went wrong
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {error.message || "Unable to load this job. It may have been deleted or you may not have access."}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try Again
        </button>
        <Link
          href="/jobs"
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent/90 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Jobs
        </Link>
      </div>
    </main>
  );
}
