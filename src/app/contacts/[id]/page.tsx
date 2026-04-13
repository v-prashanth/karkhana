"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Phone, 
  MapPin, 
  FileText, 
  CreditCard,
  Share2,
  Clock,
  History,
  ShieldCheck,
  Globe,
  Inbox,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { contactsApi } from "@/lib/api/contacts";
import { useToast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/**
 * Contact Ledger Page — v4
 * The Digital 'Khata' (Ledger).
 * Shows full history of invoices vs payments for a specific contact.
 */
export default function ContactLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const { data: ledger, isLoading, error } = useQuery({
    queryKey: ["ledger", id],
    queryFn: () => contactsApi.getLedger(id),
    enabled: !!id,
  });

  if (isLoading) return <LedgerSkeleton />;
  if (error) return <div className="p-10 text-center text-red-400">Error: {(error as Error).message}</div>;
  if (!ledger) return null;

  const { contact, invoices, payments, outstanding, totalInvoiced, receivedDocs = [] } = ledger;

  const handleWhatsAppReminder = () => {
    const text = `Hello ${contact.name},\n\nThis is a gentle reminder regarding the outstanding balance of ₹${outstanding.toLocaleString('en-IN')} in your account with us.\n\nYou can view your full statement here: [Link will follow]\n\nPlease let us know if you have any questions.\n\nRegards,\nManaged with Karkhana`;
    const url = `https://wa.me/${contact.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareLedger = async () => {
    toast("Ledger sharing coming soon! For now, use WhatsApp reminder.", "info");
  };

  const timeline = [
    ...invoices.map(inv => ({ ...inv, timelineType: 'invoice' as const, sortDate: new Date(inv.date) })),
    ...payments.map(pay => ({ ...pay, timelineType: 'payment' as const, sortDate: new Date(pay.date) })),
    ...receivedDocs.map((doc: { received_at?: string; date?: string }) => ({ ...doc, timelineType: 'received' as const, sortDate: new Date(doc.received_at || doc.date || "") }))
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  return (
    <main className="min-h-screen bg-background pb-24 text-foreground">
      <PageHeader 
        title={
          <div className="flex items-center gap-2">
            {contact.name}
            {contact.on_karkhana_org_id && <ShieldCheck className="h-4 w-4 text-accent" />}
          </div>
        } 
        subtitle={
          contact.on_karkhana_org_id ? (
            <span className="flex items-center gap-1.5 text-accent font-black uppercase text-[9px] tracking-widest italic">
               <Globe className="h-3 w-3" /> Network Partner
            </span>
          ) : (
            contact.contact_person || 'Contact Ledger'
          )
        }
        backHref="/contacts" 
      />

      <div className="grid grid-cols-2 gap-3 px-5 pt-2">
        <Card className="glass-panel border-l-2 border-l-accent">
          <CardContent className="p-4 space-y-1">
             <p className="text-[10px] uppercase font-bold tracking-widest text-[#666]">Total Invoiced</p>
             <p className="text-xl font-black text-white">₹{totalInvoiced.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card className={cn("glass-panel border-l-2", outstanding > 0 ? "border-l-red-500" : "border-l-green-500")}>
          <CardContent className="p-4 space-y-1">
             <p className="text-[10px] uppercase font-bold tracking-widest text-[#666]">Balance Due</p>
             <p className={cn("text-xl font-black", outstanding > 0 ? "text-red-400" : "text-green-400")}>₹{outstanding.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 px-5 mt-4">
        <Button onClick={handleWhatsAppReminder} className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-widest text-[10px] italic group">
          <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp Reminder
        </Button>
        <Button onClick={handleShareLedger} variant="outline" className="h-14 w-14 rounded-2xl glass p-0 border-white/10">
           <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-5 mt-6">
        <Card className="glass-panel border-white/5 bg-white/[0.02]">
          <CardContent className="p-5 space-y-4">
             <div className="flex items-center gap-4 text-xs">
                <div className="h-10 w-10 glass rounded-xl flex items-center justify-center text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[#555] font-bold uppercase tracking-widest text-[10px]">Phone Number</p>
                  <p className="text-white font-mono">{contact.phone || 'N/A'}</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 rounded-lg glass border-white/5 px-3">Call</Button>
             </div>
             
             {contact.address && (
               <div className="flex items-start gap-4 text-xs pt-4 border-t border-white/5">
                  <div className="h-10 w-10 glass rounded-xl flex items-center justify-center text-muted-foreground shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[#555] font-bold uppercase tracking-widest text-[10px]">Address</p>
                    <p className="text-white leading-relaxed mt-1">{contact.address}</p>
                  </div>
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      <div className="px-5 mt-10 space-y-4 pb-10">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#666] italic flex items-center gap-2">
            <History className="h-3 w-3" /> Transaction History
          </h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{timeline.length} ENTRIES</p>
        </div>

        <div className="space-y-3">
          {timeline.map((item, i) => (
            <motion.div 
              key={`${item.timelineType}-${item.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (i > 10 ? 10 : i) * 0.05 }}
            >
              <Card className="glass-panel border-white/5 overflow-hidden">
                <CardContent className="p-0">
                   <div className="flex items-stretch">
                    <div className={cn(
                      "w-1.5 shrink-0",
                      item.timelineType === 'invoice' ? "bg-red-500/40" : 
                      item.timelineType === 'received' ? "bg-blue-500/40" : "bg-green-500/40"
                    )} />
                    <div className="flex-1 p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                           "h-10 w-10 rounded-xl flex items-center justify-center",
                           item.timelineType === 'invoice' ? "bg-red-500/10 text-red-500" : 
                           item.timelineType === 'received' ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
                         )}>
                            {item.timelineType === 'invoice' ? <FileText className="h-4 w-4" /> : 
                             item.timelineType === 'received' ? <Inbox className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                         </div>
                         <div>
                            <p className="text-xs font-black text-white tracking-tight uppercase">
                               {item.timelineType === 'invoice' ? `Invoice ${item.invoice_number}` : 
                                item.timelineType === 'received' ? `${item.document_type} (Received)` : `Payment Received`}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                              {new Date(item.sortDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={cn(
                           "text-sm font-black text-white",
                           item.timelineType === 'payment' && "text-green-400",
                           item.timelineType === 'received' && "text-blue-400"
                         )}>
                           {item.timelineType === 'invoice' ? `-₹${Number(item.total).toLocaleString('en-IN')}` : 
                            item.timelineType === 'received' ? `₹${Number(item.amount || 0).toLocaleString('en-IN')}` : `+₹${Number(item.amount).toLocaleString('en-IN')}`}
                         </p>
                         {item.timelineType === 'invoice' && Number(item.amount_due) > 0 && (
                            <p className="text-[10px] font-bold text-red-400/80 uppercase mt-0.5 italic">Pending</p>
                         )}
                         {item.timelineType === 'received' && item.status === 'new' && (
                            <p className="text-[10px] font-black text-accent uppercase mt-0.5 italic flex items-center justify-end gap-1"><Zap className="h-2.5 w-2.5 fill-accent" /> New</p>
                         )}
                         {item.timelineType === 'payment' && (
                            <p className="text-[10px] font-bold text-green-500/80 uppercase mt-0.5 italic">{item.method}</p>
                         )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {timeline.length === 0 && (
            <div className="p-10 text-center space-y-4">
              <div className="h-16 w-16 glass rounded-full flex items-center justify-center mx-auto opacity-20">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No transactions found for this contact.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function LedgerSkeleton() {
  return (
    <div className="min-h-screen bg-background p-5 space-y-6">
      <div className="h-8 w-48 bg-white/5 animate-pulse rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-white/5 animate-pulse rounded-2xl" />
        <div className="h-20 bg-white/5 animate-pulse rounded-2xl" />
      </div>
      <div className="h-40 bg-white/5 animate-pulse rounded-2xl" />
      <div className="space-y-3 pt-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-white/5 animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
