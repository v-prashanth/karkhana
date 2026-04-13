"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, ExternalLink, FileOutput, Link2, Plus, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/shared/PageHeader";
import { generateInvoicePdf } from "@/lib/pdfGenerator";
import { useStore } from "@/store/useStore";
import { format } from "date-fns";
import { contactsApi } from "@/lib/api/contacts";
import { invoicesApi } from "@/lib/api/invoices";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { useToast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils/currency";
import { generateInvoiceWhatsAppMessage, generateWhatsAppLink } from "@/lib/utils/whatsapp";
import type { Contact, Invoice } from "@/types/database";
import { MessageCircle } from "lucide-react";

type InvoiceItemForm = {
  particulars: string;
  qty: number;
  rate: number;
};

type InvoiceForm = {
  contactId: string;
  clientReference: string;
  dueDate: string;
  gstApplicable: boolean;
  items: InvoiceItemForm[];
};

export default function NewInvoicePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useStore();
  const { toast } = useToast();
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const pdfPreviewUrl = useMemo(() => (pdfBlob ? URL.createObjectURL(pdfBlob) : null), [pdfBlob]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["invoice-contacts", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => contactsApi.list("client"),
  });

  const { register, control, handleSubmit, watch } = useForm<InvoiceForm>({
    defaultValues: {
      contactId: "",
      clientReference: "",
      dueDate: new Date().toISOString().split("T")[0],
      items: [{ particulars: "", qty: 1, rate: 0 }],
      gstApplicable: false,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const formValues = watch();
  const selectedContact = contacts.find((contact) => contact.id === formValues.contactId);

  const subtotal = formValues.items?.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.rate || 0)), 0) || 0;
  const gstAmount = formValues.gstApplicable ? subtotal * 0.18 : 0;
  const total = subtotal + gstAmount;

  const createInvoice = useMutation({
    mutationFn: async (data: InvoiceForm) => {
      const invoice = await invoicesApi.create(
        {
          contact_id: data.contactId || null,
          order_id: null,
          document_id: null,
          type: "tax_invoice",
          invoice_number: "",
          date: new Date().toISOString().split("T")[0],
          due_date: data.dueDate || null,
          reference_number: data.clientReference || null,
          subtotal,
          discount_percent: 0,
          discount_amount: 0,
          taxable_amount: subtotal,
          cgst_rate: data.gstApplicable ? 9 : 0,
          cgst_amount: data.gstApplicable ? gstAmount / 2 : 0,
          sgst_rate: data.gstApplicable ? 9 : 0,
          sgst_amount: data.gstApplicable ? gstAmount / 2 : 0,
          igst_rate: 0,
          igst_amount: 0,
          total,
          total_in_words: "Amount as per invoice",
          status: "sent",
          amount_paid: 0,
          amount_due: total,
          pdf_url: null,
          notes: null,
        },
        data.items.map((item) => ({
          description: item.particulars,
          hsn_sac: null,
          quantity: Number(item.qty || 0),
          unit: "Nos",
          rate: Number(item.rate || 0),
          discount_percent: 0,
          taxable_amount: Number(item.qty || 0) * Number(item.rate || 0),
          tax_rate: data.gstApplicable ? 18 : 0,
          tax_amount: data.gstApplicable ? Number(item.qty || 0) * Number(item.rate || 0) * 0.18 : 0,
          amount: Number(item.qty || 0) * Number(item.rate || 0),
          sort_order: 0,
        }))
      );

      const shareLink = await invoicesApi.createShareLink(invoice.id, `Invoice ${invoice.invoice_number}`);
      return { invoice, shareLink };
    },
    onSuccess: async ({ invoice, shareLink }) => {
      setSavedInvoice(invoice);
      setShareUrl(`${window.location.origin}/share/${shareLink.token}`);

      const doc = await generateInvoicePdf({
        shopName: organization?.name || "Karkhana Workspace",
        shopAddress: organization?.address || "India",
        logoUrl: organization?.logo_url,
        primaryColor: organization?.brand_primary_color,
        secondaryColor: organization?.brand_secondary_color,
        footerText: organization?.footer_text,
        signatureName: organization?.signature_name,
        bankDetails: organization?.bank_details,
        upiId: organization?.upi_id,
        billNumber: invoice.invoice_number,
        date: format(new Date(invoice.date), "dd/MM/yyyy"),
        clientName: selectedContact?.name || "Client",
        clientReference: invoice.reference_number || "-",
        items: formValues.items.map((item) => ({
          particulars: item.particulars,
          qty: Number(item.qty || 0),
          rate: Number(item.rate || 0),
          amount: Number(item.qty || 0) * Number(item.rate || 0),
        })),
        subtotal,
        gstApplicable: formValues.gstApplicable,
        gstRate: 18,
        gstAmount,
        total,
        totalWords: "Amount as per invoice",
      });

      setPdfBlob(doc.output("blob"));
      toast("Invoice created and share link generated", "success");
      queryClient.invalidateQueries({ queryKey: ["finance-invoices", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["reports-invoices", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["payments-outstanding", organization?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics", organization?.id] });
    },
    onError: (error: Error) => {
      if (error.message.includes("PLAN_LIMIT_REACHED")) {
        setLimitMessage("Your Free plan is limited to 20 documents per month. Upgrade to Pro for unlimited billing.");
        setShowUpgrade(true);
      } else {
        toast(error.message || "Could not create invoice", "error");
      }
    },
  });

  const handleShare = async () => {
    if (!pdfBlob) return;

    const file = new File([pdfBlob], `${savedInvoice?.invoice_number || "invoice"}.pdf`, { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: savedInvoice?.invoice_number || "Invoice",
        text: shareUrl ? `Invoice link: ${shareUrl}` : "Please find the attached invoice.",
      });
    } else {
      handleDownload();
    }
  };

  const handleWhatsAppShare = () => {
    if (!savedInvoice || !shareUrl) return;

    const upiLink = organization?.upi_id 
      ? `\n\nPay directly via UPI:\nupi://pay?pa=${organization.upi_id}&pn=${organization.name.replace(/ /g, '%20')}&am=${total}&cu=INR` 
      : "";

    const message = generateInvoiceWhatsAppMessage(
      selectedContact?.name || "Client",
      savedInvoice.invoice_number,
      formatCurrency(total),
      shareUrl,
      upiLink
    );

    const whatsappUrl = generateWhatsAppLink(selectedContact?.phone, message);
    window.open(whatsappUrl, "_blank");
  };

  const handleDownload = () => {
    if (!pdfPreviewUrl) return;
    const link = document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = `${savedInvoice?.invoice_number || "invoice"}.pdf`;
    link.click();
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast("Share link copied", "success");
  };

  if (pdfBlob && savedInvoice) {
    return (
      <main className="min-h-screen bg-background px-4 pb-12 pt-8 xl:px-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/20 text-accent">
          <FileOutput className="h-10 w-10" />
        </div>
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-bold">Invoice Generated!</h2>
          <p className="mt-2 text-xl font-mono tracking-tight text-muted-foreground">{formatCurrency(total)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{savedInvoice.invoice_number}</p>
        </div>
        <div className="mx-auto mt-8 grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-[0_20px_80px_-50px_rgba(0,0,0,0.4)]">
            {pdfPreviewUrl ? (
              <iframe
                title="Invoice PDF Preview"
                src={pdfPreviewUrl}
                className="h-[70vh] w-full bg-white"
              />
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent/80">Preview</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Review the generated invoice before sending it to your client.
              </p>
            </div>
          <Button onClick={handleWhatsAppShare} className="h-14 bg-[#25D366] text-white hover:bg-[#20bd5a]">
            <MessageCircle className="mr-2 h-5 w-5" /> Share via WhatsApp
          </Button>
          <Button onClick={handleDownload} variant="outline" className="h-14 border-border text-foreground">
            <Download className="mr-2 h-5 w-5" /> Download PDF
          </Button>
          <Button onClick={copyShareLink} variant="outline" className="h-14 border-border text-foreground">
            <Link2 className="mr-2 h-5 w-5" /> Copy View Link
          </Button>
          <Button onClick={() => window.open(shareUrl, "_blank")} variant="ghost" className="h-12">
            <Copy className="mr-2 h-4 w-4" /> Open Shared View
          </Button>
            {pdfPreviewUrl ? (
              <Button onClick={() => window.open(pdfPreviewUrl, "_blank")} variant="ghost" className="h-12 w-full">
                <ExternalLink className="mr-2 h-4 w-4" /> Open PDF in New Tab
              </Button>
            ) : null}
            <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <PageHeader title="New Bill" subtitle="Create, preview, and share" backHref="/invoices" />

      <form onSubmit={handleSubmit((data) => createInvoice.mutate(data))} className="space-y-6 p-4">
        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <h2 className="text-base font-semibold text-foreground">Create a bill in a few steps</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Choose the client, add line items, review the total, and generate a bill you can download, preview, or share.
          </p>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client Details</label>
          <select
            {...register("contactId")}
            className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">Select client</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
          <Input placeholder="Client PO or your reference (optional)" {...register("clientReference")} />
          <Input type="date" {...register("dueDate")} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bill Items</label>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="relative space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <span className="mb-1 text-xs font-mono text-muted-foreground">Item {index + 1}</span>
                {index > 0 ? (
                  <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <Input placeholder="What are you billing for?" {...register(`items.${index}.particulars` as const, { required: true })} />
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" placeholder="Qty" {...register(`items.${index}.qty` as const, { valueAsNumber: true, required: true })} />
                <Input type="number" placeholder="Rate" {...register(`items.${index}.rate` as const, { valueAsNumber: true, required: true })} />
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={() => append({ particulars: "", qty: 1, rate: 0 })} className="w-full border-dashed">
            <Plus className="mr-2 h-4 w-4" /> Add line item
          </Button>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="font-medium">Apply GST (18%)</span>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" {...register("gstApplicable")} className="peer sr-only" />
              <div className="relative h-6 w-11 rounded-full bg-border peer-checked:bg-accent peer-checked:after:translate-x-full after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']" />
            </label>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            {formValues.gstApplicable ? (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>GST (18%)</span>
                <span className="font-mono">{formatCurrency(gstAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between pt-2 text-lg font-bold text-foreground">
              <span>Total</span>
              <span className="font-mono text-accent">{formatCurrency(total)}</span>
            </div>
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full text-base" disabled={createInvoice.isPending || !selectedContact}>
          {createInvoice.isPending ? "Generating..." : "Generate bill"}
        </Button>
      </form>

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        title="Scaling Up?"
        message={limitMessage}
      />
    </main>
  );
}
