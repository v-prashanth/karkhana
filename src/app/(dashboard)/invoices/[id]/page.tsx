"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Download, Edit3, ExternalLink, Link2, MessageCircle, Save, Share2, X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { invoicesApi } from "@/lib/api/invoices";
import { contactsApi } from "@/lib/api/contacts";
import { generateInvoicePdf } from "@/lib/utils/pdf";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils/currency";
import { generateInvoiceWhatsAppMessage, generatePaymentReminderWhatsAppMessage, generateWhatsAppLink } from "@/lib/utils/whatsapp";
import type { Contact, Invoice } from "@/types/database";

type InvoiceForm = {
  contactId: string;
  clientReference: string;
  dueDate: string;
  gstApplicable: boolean;
  items: { particulars: string; qty: number; rate: number }[];
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization, user } = useStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const { data: invoice } = useQuery<Invoice>({
    queryKey: ["invoice-detail", organization?.id, params.id],
    enabled: Boolean(organization?.id && params.id),
    queryFn: () => invoicesApi.getById(params.id),
  });

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["invoice-contacts", organization?.id],
    enabled: Boolean(organization?.id),
    queryFn: () => contactsApi.list("client"),
  });

  const { register, control, handleSubmit, reset, watch } = useForm<InvoiceForm>({
    defaultValues: {
      contactId: "",
      clientReference: "",
      dueDate: "",
      gstApplicable: false,
      items: [{ particulars: "", qty: 1, rate: 0 }],
    },
  });

  const { fields } = useFieldArray({ control, name: "items" });
  const values = watch();
  const selectedContact = contacts.find((contact) => contact.id === values.contactId);
  const canEdit = Number(invoice?.amount_paid || 0) === 0;

  useEffect(() => {
    if (!invoice) return;
    reset({
      contactId: invoice.contact_id || "",
      clientReference: invoice.reference_number || "",
      dueDate: invoice.due_date || invoice.date,
      gstApplicable: Number(invoice.cgst_rate || 0) + Number(invoice.sgst_rate || 0) + Number(invoice.igst_rate || 0) > 0,
      items:
        invoice.items?.map((item) => ({
          particulars: item.description,
          qty: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
        })) || [{ particulars: "", qty: 1, rate: 0 }],
    });
  }, [invoice, reset]);

  const subtotal = values.items?.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0) || 0;
  const gstAmount = values.gstApplicable ? subtotal * 0.18 : 0;
  const total = subtotal + gstAmount;
  const pdfPreviewUrl = useMemo(() => (pdfBlob ? URL.createObjectURL(pdfBlob) : null), [pdfBlob]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  useEffect(() => {
    const buildPreview = async () => {
      if (!invoice || !organization) return;
      const doc = await generateInvoicePdf({
        shopName: organization.name || "Karkhana Workspace",
        shopAddress: organization.address || "India",
        logoUrl: organization.logo_url,
        primaryColor: organization.brand_primary_color,
        secondaryColor: organization.brand_secondary_color,
        footerText: organization.footer_text,
        signatureName: organization.signature_name,
        bankDetails: organization.bank_details,
        upiId: organization.upi_id,
        billNumber: invoice.invoice_number,
        date: new Date(invoice.date).toLocaleDateString("en-GB"),
        clientName: selectedContact?.name || invoice.contact?.name || "Client",
        clientReference: values.clientReference || invoice.reference_number || "-",
        items: values.items.map((item) => ({
          particulars: item.particulars,
          qty: Number(item.qty || 0),
          rate: Number(item.rate || 0),
          amount: Number(item.qty || 0) * Number(item.rate || 0),
        })),
        subtotal,
        gstApplicable: values.gstApplicable,
        gstRate: 18,
        gstAmount,
        total,
        totalWords: "Amount as per invoice",
      });
      setPdfBlob(doc.output("blob"));
    };

    buildPreview();
  }, [invoice, organization, selectedContact?.name, subtotal, gstAmount, total, values.clientReference, values.gstApplicable, values.items]);

  const createShareLink = useMutation({
    mutationFn: async () => {
      const link = await invoicesApi.createShareLink(params.id, `Invoice ${invoice?.invoice_number || ""}`);
      return `${window.location.origin}/share/${link.token}`;
    },
    onSuccess: async (url) => {
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      toast("Invoice link copied", "success");
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const approveInvoice = useMutation({
    mutationFn: () => invoicesApi.approve(params.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice-detail", organization?.id, params.id] });
      toast("Invoice approved successfully", "success");
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const updateInvoice = useMutation({
    mutationFn: (data: InvoiceForm) =>
      invoicesApi.update(
        params.id,
        {
          contact_id: data.contactId || null,
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
          amount_due: total,
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
      ),
    onSuccess: async () => {
      setIsEditing(false);
      toast("Invoice updated", "success");
      await queryClient.invalidateQueries({ queryKey: ["invoice-detail", organization?.id, params.id] });
      await queryClient.invalidateQueries({ queryKey: ["finance-invoices", organization?.id] });
      await queryClient.invalidateQueries({ queryKey: ["reports-invoices", organization?.id] });
    },
    onError: (error: Error) => toast(error.message, "error"),
  });

  const handleDownload = () => {
    if (!pdfPreviewUrl || !invoice) return;
    const link = document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = `${invoice.invoice_number}.pdf`;
    link.click();
  };

  const handleWhatsAppShare = async () => {
    if (!invoice) return;
    
    let currentShareUrl = shareUrl;
    if (!currentShareUrl) {
      try {
        const link = await invoicesApi.createShareLink(params.id, `Invoice ${invoice.invoice_number}`);
        currentShareUrl = `${window.location.origin}/share/${link.token}`;
        setShareUrl(currentShareUrl);
      } catch (err) {
        toast("Failed to generate link for WhatsApp", "error");
        return;
      }
    }

    const upiLink = organization?.upi_id 
      ? `\n\nPay directly via UPI:\nupi://pay?pa=${organization.upi_id}&pn=${organization.name.replace(/ /g, '%20')}&am=${total}&cu=INR` 
      : "";
    
    const message = generateInvoiceWhatsAppMessage(
      selectedContact?.name || invoice.contact?.name || "Client",
      invoice.invoice_number,
      formatCurrency(total),
      currentShareUrl,
      upiLink
    );
    
    const whatsappUrl = generateWhatsAppLink(selectedContact?.phone || invoice.contact?.phone, message);
    window.open(whatsappUrl, "_blank");
  };

  const handleWhatsAppReminder = async () => {
    if (!invoice || invoice.amount_due <= 0) return;

    let currentShareUrl = shareUrl;
    if (!currentShareUrl) {
      try {
        const link = await invoicesApi.createShareLink(params.id, `Invoice ${invoice.invoice_number}`);
        currentShareUrl = `${window.location.origin}/share/${link.token}`;
        setShareUrl(currentShareUrl);
      } catch (err) {
        toast("Failed to generate link for WhatsApp", "error");
        return;
      }
    }

    const upiLink = organization?.upi_id 
      ? `\n\nPay directly via UPI:\nupi://pay?pa=${organization.upi_id}&pn=${organization.name.replace(/ /g, '%20')}&am=${invoice.amount_due}&cu=INR` 
      : "";

    const message = generatePaymentReminderWhatsAppMessage(
      selectedContact?.name || invoice.contact?.name || "Client",
      invoice.invoice_number,
      formatCurrency(invoice.amount_due),
      currentShareUrl,
      upiLink
    );

    const whatsappUrl = generateWhatsAppLink(selectedContact?.phone || invoice.contact?.phone, message);
    window.open(whatsappUrl, "_blank");
  };

  if (!invoice) {
    return (
      <main className="min-h-screen bg-background p-5">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-white/5" />
        <div className="mt-6 h-[60vh] animate-pulse rounded-3xl bg-white/5" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="-ml-2 p-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="ml-2">
            <h1 className="text-lg font-semibold text-foreground">{invoice.invoice_number}</h1>
            <p className="text-xs text-muted-foreground">{invoice.status} • Due {formatCurrency(Number(invoice.amount_due || 0))}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <button
              onClick={() => setIsEditing((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground"
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              {isEditing ? "Close" : "Edit"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:px-8">
        <div className="space-y-4">
          <Card className="glass-panel">
            <CardContent className="space-y-4 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Bill Actions</p>
                <p className="mt-2 text-sm text-muted-foreground">You can open, download, share, and copy the bill link any time. Editing stays available until payment starts.</p>
              </div>
              
              {invoice.status === "pending_approval" && user?.role === "owner" && (
                <Button 
                  onClick={() => approveInvoice.mutate()} 
                  disabled={approveInvoice.isPending}
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold tracking-wide shadow-lg shadow-accent/20"
                >
                  {approveInvoice.isPending ? "Approving..." : "Approve Document"}
                </Button>
              )}

              <Button onClick={handleWhatsAppShare} className="w-full h-12 text-sm font-black uppercase tracking-widest italic bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20">
                <MessageCircle className="mr-2 h-4 w-4" /> Send via WhatsApp
              </Button>
              {invoice.amount_due > 0 && (
                <Button onClick={handleWhatsAppReminder} variant="outline" className="w-full h-12 text-sm border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5">
                  <Bell className="mr-2 h-4 w-4" /> Payment Reminder
                </Button>
              )}
              <Button onClick={handleDownload} variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button onClick={() => createShareLink.mutate()} variant="outline" className="w-full">
                <Link2 className="mr-2 h-4 w-4" /> {shareUrl ? "Copy bill link again" : "Create bill link"}
              </Button>
              {pdfPreviewUrl ? (
                <Button onClick={() => window.open(pdfPreviewUrl, "_blank")} variant="ghost" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open PDF in New Tab
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Bill Details</p>
                {!canEdit ? <span className="text-xs font-semibold text-amber-400">Locked after payment</span> : null}
              </div>

              <form onSubmit={handleSubmit((data) => updateInvoice.mutate(data))} className="space-y-4">
                <select
                  {...register("contactId")}
                  disabled={!isEditing || !canEdit}
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-foreground disabled:opacity-60"
                >
                  <option value="">Select client</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
                <Input {...register("clientReference")} placeholder="Reference" disabled={!isEditing || !canEdit} />
                <Input type="date" {...register("dueDate")} disabled={!isEditing || !canEdit} />
                <label className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-3 text-sm text-foreground">
                  Apply GST (18%)
                  <input type="checkbox" {...register("gstApplicable")} disabled={!isEditing || !canEdit} />
                </label>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_80px_100px] gap-2">
                      <Input {...register(`items.${index}.particulars` as const)} disabled={!isEditing || !canEdit} />
                      <Input type="number" {...register(`items.${index}.qty` as const, { valueAsNumber: true })} disabled={!isEditing || !canEdit} />
                      <Input type="number" {...register(`items.${index}.rate` as const, { valueAsNumber: true })} disabled={!isEditing || !canEdit} />
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/55 p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">GST</span>
                    <span className="font-medium text-foreground">{formatCurrency(gstAmount)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-base">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                  </div>
                </div>

                {isEditing && canEdit ? (
                  <Button type="submit" className="w-full" disabled={updateInvoice.isPending}>
                    <Save className="mr-2 h-4 w-4" /> {updateInvoice.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-border/70 bg-white shadow-[0_20px_80px_-50px_rgba(0,0,0,0.4)]">
          {pdfPreviewUrl ? <iframe title="Invoice PDF Preview" src={pdfPreviewUrl} className="h-[82vh] w-full bg-white" /> : null}
        </div>
      </div>
    </main>
  );
}
