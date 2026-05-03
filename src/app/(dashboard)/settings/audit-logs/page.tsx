"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";
import { Card } from "@/components/ui/Card";

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  performed_by: { name: string; email: string } | null;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, organization } = useStore();

  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs", organization?.id],
    enabled: Boolean(organization?.id && user?.role === "owner"),
    queryFn: async () => {
      const res = await fetch("/api/audit-logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  if (user?.role !== "owner") {
    return (
      <main className="min-h-screen p-5">
        <p className="text-error mt-10 text-center">403 Forbidden: Enterprise feature.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-12">
      <PageHeader
        title="Audit Center"
        subtitle="Immutable log of system actions"
        action={
          <button onClick={() => router.back()} className="rounded-full bg-white/5 p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
        }
      />

      <div className="mx-auto max-w-4xl p-4 xl:px-8">
        <div className="space-y-4">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-3xl border border-border/70 bg-background/55 p-10 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No records found</h3>
              <p className="text-sm text-muted-foreground">Audit logs will appear here when actions are taken.</p>
            </div>
          ) : (
            logs.map((log) => (
              <Card key={log.id} className="flex flex-col gap-3 p-4 bg-background/60 border-border/70 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {log.action_type}
                    </span>
                    <span className="text-sm font-semibold text-foreground uppercase tracking-widest">{log.entity_type}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Performed by <span className="text-foreground">{log.performed_by?.name || "System"}</span> {log.performed_by?.email && `(${log.performed_by.email})`}
                  </p>
                  <p className="mt-1 text-xs font-mono text-muted-foreground break-all">
                    Entity ID: {log.entity_id}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(log.created_at), "PPp")}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
