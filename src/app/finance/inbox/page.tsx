"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Inbox, 
  FileText, 
  Search, 
  Clock, 
  Eye, 
  IndianRupee,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { sharingApi } from "@/lib/api/sharing";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { ReceivedDocument, Organization } from "@/types/database";

type FilterStatus = "all" | "new" | "viewed" | "paid";

/**
 * Received Documents Inbox — v4
 * The hub for incoming B2B documents.
 */
export default function ReceivedInboxPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  type ReceivedDocWithSender = ReceivedDocument & { 
    from_organization: Organization;
    amount?: number; 
  };

  const { data: documents = [], isLoading } = useQuery<ReceivedDocWithSender[]>({
    queryKey: ["received-documents"],
    queryFn: () => sharingApi.getReceivedDocs() as unknown as Promise<ReceivedDocWithSender[]>,
  });

  const filtered = documents
    .filter((doc) => filterStatus === "all" || doc.status === filterStatus)
    .filter((doc) => 
      search === "" || 
      doc.document_type.toLowerCase().includes(search.toLowerCase()) ||
      doc.from_organization?.name.toLowerCase().includes(search.toLowerCase())
    );

  const newCount = documents.filter((doc) => doc.status === "new").length;

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader 
        title="Received Inbox" 
        subtitle="Automatic B2B document sync"
        backHref="/finance"
      />

      {/* Inbox Stats */}
      <div className="px-5 py-3">
        <Card className="glass-panel border-accent/20 bg-accent/5">
           <CardContent className="p-4 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#666] italic">New Documents</p>
                 <p className="text-2xl font-black text-white italic">{newCount} <span className="text-xs font-bold text-accent uppercase not-italic">Pending Review</span></p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                 <Inbox className="h-5 w-5" />
              </div>
           </CardContent>
        </Card>
      </div>

      {/* Tabs / Filters */}
      <div className="sticky top-16 z-20 bg-background/80 px-5 py-3 backdrop-blur-xl">
        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: "All Items" },
            { id: "new", label: "New (Unseen)" },
            { id: "viewed", label: "Awaiting Action" },
            { id: "paid", label: "Signed / Paid" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as FilterStatus)}
              className={cn(
                "whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-transparent",
                filterStatus === tab.id 
                  ? "bg-white text-black shadow-lg italic" 
                  : "text-[#555] hover:text-white border-white/5"
              )}
            >
              {tab.label}
              {tab.id === "new" && newCount > 0 && (
                <span className="ml-2 bg-accent px-1.5 py-0.5 rounded-md text-[8px] text-white italic">{newCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
           <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#444]" />
           <input 
              placeholder="Search by supplier or type..." 
              className="w-full h-10 pl-10 pr-4 bg-black/40 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-tight focus:outline-none focus:border-accent italic placeholder:not-italic"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {isLoading ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-20 animate-pulse">
              <Clock className="h-10 w-10 mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Syncing with Network...</span>
           </div>
        ) : filtered.length === 0 ? (
           <EmptyState 
              icon={<Inbox className="h-10 w-10" />}
              title="Inbox is Empty"
              description="When connected businesses share bills or DCs with you, they will automatically appear here."
              action={<Button variant="outline" className="rounded-xl border-white/10 uppercase font-black text-[10px] italic">Learn how it works</Button>}
           />
        ) : (
           filtered.map((doc, i: number) => (
             <motion.div
               key={doc.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
             >
               <Card className={cn(
                 "glass-panel border-white/5 hover:border-white/20 transition-all cursor-pointer group",
                 doc.status === "new" && "bg-white/[0.03] border-accent/20 shadow-[0_0_20px_rgba(255,107,43,0.05)]"
               )}>
                 <CardContent className="p-4 flex flex-col gap-4">
                   <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center",
                          doc.status === "new" ? "bg-accent/10 text-accent" : "bg-white/5 text-[#555]"
                        )}>
                           <FileText className="h-6 w-6" />
                        </div>
                        <div>
                           <div className="flex items-center gap-1.5">
                              <p className="text-sm font-black text-white uppercase italic tracking-tight">{doc.document_type}</p>
                              {doc.status === "new" && <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />}
                           </div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                               From <span className="text-foreground">{doc.from_organization?.name}</span>
                               {doc.from_organization?.is_verified && <ShieldCheck className="h-3 w-3 text-accent" />}
                           </p>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-[#444] uppercase tracking-tighter italic">
                        {format(new Date(doc.received_at), "dd MMM, yyyy")}
                      </p>
                   </div>

                   <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                      <div className="flex gap-2 text-[10px] font-black text-[#666] uppercase italic tracking-widest">
                         <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {doc.status}</span>
                         {doc.amount && <span className="text-white flex items-center ml-2 italic"><IndianRupee className="h-3 w-3" /> {doc.amount}</span>}
                      </div>
                      <div className="flex gap-2">
                         <Button variant="outline" className="h-9 rounded-xl border-white/5 bg-white/5 px-4 text-[10px] font-black uppercase italic tracking-widest hover:bg-white/10" onClick={() => {
                           if (doc.status === 'new') {
                             // mark as viewed
                           }
                           toast("Secure Viewer activating...", "info");
                         }}>
                            View <ArrowRight className="ml-2 h-3 w-3" />
                         </Button>
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
