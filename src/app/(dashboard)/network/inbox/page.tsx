"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useStore } from "@/store/useStore";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/currency";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toaster";

export default function POInboxPage() {
  const organization = useStore((state) => state.organization);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["po-inbox", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: async () => {
      const res = await fetch("/api/network/po?view=inbox");
      if (!res.ok) throw new Error("Failed to load PO inbox");
      return res.json();
    },
  });

  const convertToJob = useMutation({
    mutationFn: async (poId: string) => {
      const res = await fetch(`/api/network/po/${poId}/convert`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to convert PO");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast(`PO ${data.po_number} → Job created. View it in Jobs.`, "success");
      queryClient.invalidateQueries({ queryKey: ["po-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err: Error) => {
      toast(err.message, "error");
    },
  });

  const statusColors: Record<string, string> = {
    sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    acknowledged: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    in_progress: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <PageHeader
        title="PO Inbox"
        subtitle="Purchase orders from your buyers"
        backHref="/home"
      />

      <div className="mx-auto max-w-4xl space-y-4 p-4 xl:px-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : !pos.length ? (
          <div className="rounded-2xl border border-white/5 bg-background/50 p-12 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 opacity-30 mb-4" />
            <p className="text-lg font-bold text-white">No Purchase Orders</p>
            <p className="text-sm mt-2">
              When buyers on Karkhana issue POs to your business, they will appear here.
              <br />
              You can convert them to Jobs with a single tap.
            </p>
          </div>
        ) : (
          pos.map((po: any) => (
            <Card
              key={po.id}
              className={cn(
                "border-border/50 bg-background/50 transition-all",
                po.status === "sent" && "border-blue-500/30 bg-blue-500/[0.02]"
              )}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-black text-accent uppercase tracking-widest mb-1">
                      From: {po.buyer?.name}
                    </p>
                    <p className="text-lg font-bold font-mono">{po.po_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white italic">{formatCurrency(po.total)}</p>
                    <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border mt-1 inline-block", statusColors[po.status] || "bg-white/5")}>
                      {po.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{po.description}</p>

                {po.due_date && (
                  <p className="text-xs font-bold text-red-400 uppercase mt-2">
                    Due: {format(new Date(po.due_date), "dd MMM yyyy")}
                  </p>
                )}

                {po.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic">&ldquo;{po.notes}&rdquo;</p>
                )}

                {/* Convert to Job Button - only for new/sent POs */}
                {po.status === "sent" && !po.converted_order_id && (
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => convertToJob.mutate(po.id)}
                      disabled={convertToJob.isPending}
                      className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      {convertToJob.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Convert to Job
                    </button>
                  </div>
                )}

                {po.converted_order_id && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest">
                    <CheckCircle2 className="h-4 w-4" />
                    Converted to Job
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
