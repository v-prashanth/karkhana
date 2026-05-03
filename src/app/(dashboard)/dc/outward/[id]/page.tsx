"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toaster";
import { generateOutwardDCPdf } from "@/lib/pdfGenerator";
import { generateWhatsAppLink, generateDCWhatsAppMessage } from "@/lib/utils/whatsapp";
import type { Document, Contact } from "@/types/database";

export default function DCOutwardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { organization } = useStore();
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const { data: document } = useQuery<Document>({
    queryKey: ["outward-dc-detail", organization?.id, params.id],
    enabled: Boolean(organization?.id && params.id),
    queryFn: async () => {
      const res = await fetch(`/api/outward-dc/${params.id}`);
      if (!res.ok) throw new Error("Failed to load document");
      return res.json() as Promise<Document>;
    },
  });

  const pdfPreviewUrl = useMemo(() => (pdfBlob ? URL.createObjectURL(pdfBlob) : null), [pdfBlob]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  useEffect(() => {
    const buildPreview = async () => {
      if (!document || !organization) return;
      
      const doc = await generateOutwardDCPdf({
        shopName: organization.name || "Karkhana Workspace",
        shopAddress: organization.address || "India",
        logoUrl: organization.logo_url,
        primaryColor: organization.brand_primary_color,
        secondaryColor: organization.brand_secondary_color,
        footerText: organization.footer_text,
        signatureName: organization.signature_name,
        dcNumber: document.document_number,
        date: new Date(document.date).toLocaleDateString("en-GB"),
        clientName: document.contact?.name || "Client",
        clientReference: document.reference_number || "-",
        items: document.items?.map((item: any) => ({
          particulars: item.description,
          qty: String(item.quantity) + " " + (item.unit || "Nos"),
        })) || [],
      });
      setPdfBlob(doc.output("blob"));
    };

    buildPreview();
  }, [document, organization]);

  const handleCreateShareLink = async () => {
    try {
      const res = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_type: "document",
          resource_id: params.id,
          title: `Delivery Challan ${document?.document_number || ""}`
        })
      });
      const link = await res.json();
      return `${window.location.origin}/share/${link.token}`;
    } catch (err) {
      toast("Failed to generate share link", "error");
      throw err;
    }
  };

  const handleShareClick = async () => {
    try {
      const url = await handleCreateShareLink();
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast("DC link copied", "success");
    } catch (e) {}
  };

  const handleWhatsAppShare = async () => {
    if (!document) return;
    
    let currentShareUrl = shareUrl;
    if (!currentShareUrl) {
      try {
        currentShareUrl = await handleCreateShareLink();
        setShareUrl(currentShareUrl);
      } catch (err) {
        return;
      }
    }
    
    const message = generateDCWhatsAppMessage(
      document.contact?.name || "Client",
      document.document_number,
      currentShareUrl
    );
    
    const whatsappUrl = generateWhatsAppLink(document.contact?.phone, message);
    window.open(whatsappUrl, "_blank");
  };

  const handleDownload = () => {
    if (!pdfPreviewUrl || !document) return;
    const link = window.document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = `${document.document_number.replace(/\//g, "-")}.pdf`;
    link.click();
  };

  if (!document) {
    return (
      <main className="min-h-screen bg-background p-5">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-white/5" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-background/80 px-5 py-4 backdrop-blur-xl xl:px-8">
        <div className="flex items-center gap-4">
          <Link href="/dc/outward" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white italic tracking-tight">{document.document_number}</h1>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{document.contact?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-10 w-10 text-muted-foreground hover:text-white rounded-xl">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShareClick} className="h-10 w-10 text-muted-foreground hover:text-white rounded-xl">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button onClick={handleWhatsAppShare} className="h-10 rounded-2xl bg-[#00A884]/10 text-[#00A884] hover:bg-[#00A884]/20 border border-[#00A884]/20 font-black uppercase tracking-widest text-[10px] hidden md:flex items-center gap-2 px-4 shadow-[0_0_20px_rgba(0,168,132,0.15)]">
            <MessageCircle className="h-4 w-4" /> Send WhatsApp DC
          </Button>
        </div>
      </header>

      <div className="mx-auto mt-6 w-full max-w-4xl px-5 xl:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-6">
            <Card className="glass-panel overflow-hidden border-t-2 border-t-accent">
              <CardContent className="p-0">
                <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex gap-4 overflow-x-auto no-scrollbar">
                  <div className="min-w-fit">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                    <span className="inline-flex items-center rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      {document.status}
                    </span>
                  </div>
                  <div className="min-w-fit border-l border-white/10 pl-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Date</p>
                    <p className="text-sm font-medium text-white">{new Date(document.date).toLocaleDateString()}</p>
                  </div>
                  <div className="min-w-fit border-l border-white/10 pl-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Client Reference</p>
                    <p className="text-sm font-medium text-white">{document.reference_number || "-"}</p>
                  </div>
                  <div className="min-w-fit border-l border-white/10 pl-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Items Shipped</p>
                    <p className="text-sm font-medium text-white">{document.items?.length || 0}</p>
                  </div>
                </div>
                {pdfPreviewUrl && (
                  <div className="aspect-[1/1.4] w-full bg-white relative">
                    <iframe src={`${pdfPreviewUrl}#toolbar=0&view=FitH`} className="absolute inset-0 h-full w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
