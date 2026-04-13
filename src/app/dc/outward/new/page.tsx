"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Download, ExternalLink, FileOutput, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { generateOutwardDCPdf } from "@/lib/pdfGenerator";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";

type OutwardDCForm = {
  clientName: string;
  clientReference: string;
  particulars: string;
  quantity: string;
};

export default function NewOutwardDCPage() {
  const router = useRouter();
  const { organization } = useStore();
  const [loading, setLoading] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const pdfPreviewUrl = useMemo(() => (pdfBlob ? URL.createObjectURL(pdfBlob) : null), [pdfBlob]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const { register, handleSubmit } = useForm<OutwardDCForm>({
    defaultValues: {
      clientName: "AJ Packaging Limited", // Mock selected client
      clientReference: "PO-4421",
      particulars: "Aluminium Suckers 25x42x130mm\nMachined complete as per drg",
      quantity: "50 Nos"
    }
  });

  const onSubmit = async (data: OutwardDCForm) => {
    setLoading(true);
    
    const doc = await generateOutwardDCPdf({
      shopName: organization?.name || "Sri Vishwakarma Engineering Works",
      shopAddress: organization?.address || "Jagadgirigutta, Hyderabad",
      logoUrl: organization?.logo_url,
      primaryColor: organization?.brand_primary_color,
      secondaryColor: organization?.brand_secondary_color,
      footerText: organization?.footer_text,
      signatureName: organization?.signature_name,
      dcNumber: organization?.dc_counter?.toString() || "240",
      date: format(new Date(), "dd/MM/yyyy"),
      clientName: data.clientName,
      clientReference: data.clientReference,
      items: [
        { particulars: data.particulars, qty: data.quantity }
      ]
    });

    const blob = doc.output("blob");
    setPdfBlob(blob);
    setLoading(false);
  };

  const handleShare = async () => {
    if (!pdfBlob) return;
    const file = new File([pdfBlob], `DC_${organization?.dc_counter || 240}.pdf`, { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Delivery Challan',
        text: 'Please find the attached Delivery Challan',
      });
    } else {
      // Fallback download if share not supported
      handleDownload();
    }
  };

  const handleDownload = () => {
    if (!pdfPreviewUrl) return;
    const link = document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = `DC_${organization?.dc_counter || 240}.pdf`;
    link.click();
  };

  return (
    <main className="min-h-screen pb-24 bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center">
          <Link href="/dashboard" className="p-2 -ml-2 text-muted hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-semibold ml-2 text-foreground">Create DC</h1>
        </div>
      </header>

      {pdfBlob ? (
        <div className="px-4 pb-12 pt-8 xl:px-8">
          <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/20 text-success">
            <FileOutput className="h-10 w-10" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">DC Created!</h2>
            <p className="text-muted mt-2">DC #{organization?.dc_counter || 240} is ready.</p>
          </div>
          </div>

          <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-[0_20px_80px_-50px_rgba(0,0,0,0.4)]">
              {pdfPreviewUrl ? (
                <iframe
                  title="Delivery Challan PDF Preview"
                  src={pdfPreviewUrl}
                  className="h-[70vh] w-full bg-white"
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent/80">Preview</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Review the generated delivery challan before sending or downloading it.
                </p>
              </div>
          <div className="grid grid-cols-2 gap-4 w-full mt-8">
            <Button onClick={handleShare} className="h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white">
              <Share2 className="mr-2 h-5 w-5" /> WhatsApp
            </Button>
            <Button onClick={handleDownload} variant="outline" className="h-14">
              <Download className="mr-2 h-5 w-5" /> Download
            </Button>
          </div>
          {pdfPreviewUrl ? (
            <Button onClick={() => window.open(pdfPreviewUrl, "_blank")} variant="ghost" className="h-12 w-full">
              <ExternalLink className="mr-2 h-4 w-4" /> Open PDF in New Tab
            </Button>
          ) : null}
          <Button variant="ghost" className="mt-4 w-full" onClick={() => router.push('/dashboard')}>
            Back to Home
          </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
          <section className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Client & Reference</label>
              <Input placeholder="Client Name" {...register("clientName")} className="mb-3" />
              <Input placeholder="Client Order/PO Number" {...register("clientReference")} />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Particulars</label>
              <textarea
                placeholder="Item description and machining details..."
                className="w-full min-h-[120px] p-3 rounded-md border border-border bg-card text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mb-3"
                {...register("particulars", { required: true })}
              />
              <Input placeholder="Quantity (e.g. 50 Nos)" {...register("quantity", { required: true })} />
            </div>
          </section>

          <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
            {loading ? "Generating PDF..." : "Generate Delivery Challan"}
          </Button>
        </form>
      )}
    </main>
  );
}
