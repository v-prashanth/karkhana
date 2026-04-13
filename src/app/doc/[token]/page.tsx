"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sharingApi } from "@/lib/api/sharing";
import { 
  Download, 
  Printer, 
  ShieldCheck, 
  FileText,
  ArrowRight,
  Info,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { motion } from "framer-motion";
import Image from "next/image";
import type { Organization, Document } from "@/types/database";

/**
 * Shared Document Viewer Page — v4
 * This is the public view of an Invoice or DC.
 * Designed for High Aesthetic First Impressions.
 */
export default function SharedDocPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<{ 
    document: Document & { total_amount?: number; total?: number }; 
    organization: Organization 
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoc() {
      try {
        const doc = await sharingApi.getDocByToken(token);
        setData(doc);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load document";
        setError(message);
      } finally {
        setLoading(false);
      }
    }
    if (token) loadDoc();
  }, [token]);

  if (loading) return <DocSkeleton />;
  if (error || !data) return <DocError error={error || "Document not found"} />;

  const { document, organization } = data;

  return (
    <main className="min-h-screen bg-[#080808] text-foreground p-4 pb-24 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Verification Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-[#666]">
            <ShieldCheck className="h-3 w-3 text-green-500" />
            Verified Secure Document • karkhana.app
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="p-2 glass rounded-lg text-muted-foreground hover:text-white transition-colors">
              <Printer className="h-4 w-4" />
            </button>
            <button className="p-2 glass rounded-lg text-muted-foreground hover:text-white transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* The Document Card */}
        <Card className="glass-panel overflow-hidden border-white/10 shadow-2xl">
          <CardContent className="p-8 md:p-12 space-y-10">
            
            {/* Header: Business Info */}
            <div className="flex flex-col md:flex-row justify-between gap-8 border-b border-white/5 pb-10">
              <div className="space-y-4">
                {organization.logo_url ? (
                  <Image src={organization.logo_url} alt={organization.name} width={100} height={64} className="h-16 w-auto grayscale contrast-125 unoptimized" />
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-accent" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tighter text-white">{organization.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">{organization.address}</p>
                  <p className="text-[11px] font-mono text-[#555] mt-2 uppercase">GSTIN: {organization.gstin || "N/A"}</p>
                </div>
              </div>
              
              <div className="text-left md:text-right space-y-2">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-[#333]">
                  {document.type.includes('invoice') ? 'Invoice' : 'Challan'}
                </h2>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white"># {document.document_number}</p>
                  <p className="text-sm text-muted-foreground font-mono">{new Date(document.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#555]">Billed To</p>
                <div className="space-y-1">
                  <p className="font-bold text-white">Client Information</p>
                  <p className="text-muted-foreground leading-relaxed">Referenced in internal records</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#555]">Ship To</p>
                <p className="text-muted-foreground italic">Same as billing address</p>
              </div>
            </div>

            {/* Table Area (Skeleton for now, until line items added to schema/api) */}
            <div className="border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase tracking-widest font-bold text-[#666]">
                  <tr>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {/* Real implementation will map through document.meta.items */}
                  <tr>
                    <td className="px-6 py-6 font-semibold text-white">
                      Generic Business Line Item
                      <p className="text-xs font-normal text-muted-foreground mt-1">Industrial quality machined component</p>
                    </td>
                    <td className="px-6 py-6 text-center text-muted-foreground">1.00</td>
                    <td className="px-6 py-6 text-right font-bold text-white">₹{(document.total_amount || document.total || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="flex justify-end pt-6">
              <div className="w-full md:w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-white">₹{(document.total_amount || document.total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (0%)</span>
                  <span className="text-white">₹0.00</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                  <span className="text-sm font-bold uppercase tracking-widest text-accent">Total</span>
                  <span className="text-3xl font-black text-white">₹{(document.total_amount || document.total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="pt-10 border-t border-white/5 text-[11px] text-[#444] leading-relaxed">
              <p className="font-bold text-[#666] mb-1Uppercase uppercase">Notes & Terms</p>
              <p>Please acknowledge the receipt within 24 hours. This is a computer generated document and does not require a physical signature.</p>
            </div>
          </CardContent>
        </Card>

        {/* The Network Growth Conversion Hook */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass shadow-2xl rounded-[32px] p-8 mt-12 border border-accent/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldCheck className="h-32 w-32 text-accent" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="h-20 w-20 rounded-3xl bg-accent flex items-center justify-center shadow-[0_0_40px_rgba(255,107,43,0.3)] shrink-0">
               <Wrench className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-xl font-black tracking-tight text-white italic uppercase">Manage your business like {organization.name}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">Use Karkhana to create professional documents, track pending payments, and connect with verified suppliers.</p>
            </div>
            <Button onClick={() => router.push('/')} size="lg" className="px-10 h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-black tracking-widest uppercase text-xs italic group">
              Join Karkhana Free <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-[#444] uppercase tracking-[0.4em] py-10 font-bold opacity-50">
          Built for Bharat MSMEs • karkhana.app
        </p>
      </div>
    </main>
  );
}

function DocSkeleton() {
  return (
    <div className="min-h-screen bg-[#080808] p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-10">
        <div className="h-6 w-48 bg-white/5 animate-pulse rounded-full mx-auto" />
        <div className="h-[800px] w-full bg-white/[0.03] animate-pulse rounded-[32px]" />
      </div>
    </div>
  );
}

function DocError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center p-10 text-center space-y-6">
      <div className="h-24 w-24 bg-red-500/10 rounded-full flex items-center justify-center">
        <Info className="h-10 w-10 text-red-500" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Access Denied</h2>
        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">{error}</p>
      </div>
      <Button onClick={() => window.location.href = '/'} variant="outline" className="border-white/10 hover:bg-white/5 text-xs uppercase tracking-widest px-8">
        Return to Safety
      </Button>
    </div>
  );
}
