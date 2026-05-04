"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import type { Document } from "@/types/database";

export default function OutwardDCPage() {
  const [search, setSearch] = useState("");
  const organization = useStore((state) => state.organization);

  const { data: outwardDCs = [] } = useQuery<Document[]>({
    queryKey: ["outward-dcs", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: async () => {
      const response = await fetch(`/api/outward-dc`);
      if (!response.ok) throw new Error("Failed to load outward DCs");
      return response.json();
    },
  });

  const filtered = outwardDCs.filter((dc: Document) => {
    const query = search.toLowerCase();
    return (
      query === "" ||
      (dc.document_number || "").toLowerCase().includes(query) ||
      (dc.notes || "").toLowerCase().includes(query) ||
      (dc.contact?.name || "").toLowerCase().includes(query)
    );
  });

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <PageHeader title="Outward DCs" subtitle={`${outwardDCs.length || 0} documents`} addHref="/dc/outward/new" />

      <div className="px-5 py-3 xl:px-8">
        <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
          <Search className="pointer-events-none absolute h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by DC #, particulars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 px-5 py-4 xl:px-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Truck className="h-12 w-12" />}
            title="No outward DCs found"
            description={search ? "Try adjusting your search" : "Start by creating a new outward DC"}
            action={
              <Link href="/dc/outward/new">
                <button className="mt-4 rounded-xl bg-primary px-6 py-2 font-medium text-primary-foreground">
                  New Outward DC
                </button>
              </Link>
            }
          />
        ) : (
          filtered.map((dc: Document, idx: number) => (
            <motion.div key={dc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card className="cursor-pointer border border-border/60 hover:border-primary/30 hover:bg-background/80 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">DC #{dc.document_number}</p>
                      <p className="text-base font-semibold truncate">{dc.notes || "Outward DC"}</p>
                      <p className="text-sm text-muted-foreground mt-1">{dc.contact?.name || "No contact"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", "bg-green-500/10", "text-green-400")}>
                          Outward
                        </span>
                        <span className="text-xs text-muted-foreground">Dated: {new Date(dc.date).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}
