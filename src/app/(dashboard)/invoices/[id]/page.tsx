"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, Download, Edit3, ExternalLink, Link2, MessageCircle, Save, Share2, X, CreditCard, CheckCircle2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { invoicesApi } from "@/lib/api/invoices";
import { contactsApi } from "@/lib/api/contacts";
import { paymentsApi } from "@/lib/api/payments";
import { generateInvoicePdf } from "@/lib/utils/pdf";
import { useStore } from "@/store/useStore";
import { useToast } from "@/components/ui/Toaster";
import { formatCurrency } from "@/lib/utils/currency";
import { generateInvoiceWhatsAppMessage, generatePaymentReminderWhatsAppMessage, generateWhatsAppLink } from "@/lib/utils/whatsapp";
import type { Contact, Invoice } from "@/types/database";
import { cn } from "@/lib/utils";

type InvoiceForm = {
  contactId: string;
  clientReference: string;
  dueDate: string;
  gstApplicable: boolean;
  items: { particulars: string; qty: number; rate: number }[];
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  sent: { label: "Sent", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  draft: { label: "Draft", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  partial: { label: "Part Paid", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  paid: { label: "Paid", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  overdue: { label: "Overdue", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  pending_approval: { label: "Pending", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", bg: "bg-white/5 border-white/10" },
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
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");

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
  const canEdit = Number(invoice?.amount_paid || 0) === 0 && invoice?.status !== 'paid' && invoice?.status !== 'cancelled';

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
    setPaymentAmount(String(invoice.amount_due || invoice.total));
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

  const recordPayment = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error("Invoice not loaded");
      return paymentsApi.create({
        contact_id: invoice.contact_id,
        invoice_id: invoice.id,
        amount: Number(paymentAmount),
        method: paymentMethod as "upi" | "bank_transfer" | "cash" | "cheque" | "other",
        reference_number: null,
        date: new Date().toISOString().split("T")[0],
        notes: null,
      });
    },
    onSuccess: () => {
      setShowPaymentForm(false);
      toast("Payment recorded successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["invoice-detail", organization?.id, params.id] });
      queryClient.invalidateQueries({ queryKey: ["finance-invoices", organization?.id] });
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

  const status = statusConfig[invoice.status] || statusConfig.sent;

  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
        <div className="flex items-center">
          <button onClick={() => router.back()} className="-ml-2 p-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="ml-2 flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">{invoice.invoice_number}</h1>
              <p className="text-xs text-muted-foreground font-medium">Due {formatCurrency(Number(invoice.amount_due || 0))}</p>
            </div>
            <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border", status.bg, status.color)}>
              {status.label}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit ? (
            <button
              onClick={() => setIsEditing((value) => !value)}
              className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                isEditing ? "bg-white text-black border-white" : "border-border text-foreground hover:bg-white/5"
              )}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              {isEditing ? "Cancel Edit" : "Edit Bill"}
            </button>
          ) : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 xl:grid-cols-[360px_minmax(0,1fr)] xl:px-8 pt-6">
        <div className="space-y-4">
          
          {/* Quick Actions */}
          <Card className="border-white/5 bg-white/[0.01]">
            <CardContent className="p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#888] mb-2">Actions</p>
              
              {invoice.status === "pending_approval" && user?.role === "owner" && (
                <Button 
                  onClick={() => approveInvoice.mutate()} 
                  disabled={approveInvoice.isPending}
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold tracking-wide shadow-lg shadow-accent/20"
                >
                  {approveInvoice.isPending ? "Approving..." : "Approve Document"}
                </Button>
              )}

              {invoice.amount_due > 0 && !showPaymentForm && (
                <Button onClick={() => setShowPaymentForm(true)} className="w-full h-12 text-sm font-bold bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10">
                  <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                </Button>
              )}

              {showPaymentForm && (
                <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-foreground">Record Collection</p>
                    <button onClick={() => setShowPaymentForm(false)} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
                  </div>
                  <Input 
                    type="number" 
                    placeholder="Amount" 
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)} 
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-background/80 px-4 py-3 text-sm text-white outline-none focus:border-accent"
                  >
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                  </select>
                  <Button 
                    onClick={() => recordPayment.mutate()} 
                    disabled={recordPayment.isPending || !paymentAmount}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
                  >
                    {recordPayment.isPending ? "Saving..." : "Save Payment"} <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              <Button onClick={handleWhatsAppShare} className="w-full h-12 text-sm font-black uppercase tracking-widest italic bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20">
                <MessageCircle className="mr-2 h-4 w-4" /> Send via WhatsApp
              </Button>
              {invoice.amount_due > 0 && (
                <Button onClick={handleWhatsAppReminder} variant="outline" className="w-full h-12 text-sm border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10">
                  <Bell className="mr-2 h-4 w-4" /> Payment Reminder
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button onClick={handleDownload} variant="outline" className="w-full text-xs h-10 border-white/10">
                  <Download className="mr-2 h-3.5 w-3.5" /> Download
                </Button>
                <Button onClick={() => createShareLink.mutate()} variant="outline" className="w-full text-xs h-10 border-white/10">
                  <Link2 className="mr-2 h-3.5 w-3.5" /> Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details / Edit Form */}
          <Card className="border-white/5 bg-white/[0.01]">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Bill Details</p>
                {!canEdit && <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Locked</span>}
              </div>

              <form onSubmit={handleSubmit((data) => updateInvoice.mutate(data))} className="space-y-4">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">Client</label>
                  <select
                    {...register("contactId")}
                    disabled={!isEditing || !canEdit}
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-foreground disabled:opacity-50"
                  >
                    <option value="">Select client</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                     <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">Reference</label>
                     <Input {...register("clientReference")} placeholder="PO / Ref" disabled={!isEditing || !canEdit} className="h-11 bg-black/40" />
                  </div>
                  <div>
                     <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block">Due Date</label>
                     <Input type="date" {...register("dueDate")} disabled={!isEditing || !canEdit} className="h-11 bg-black/40" />
                  </div>
                </div>

                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-foreground cursor-pointer hover:bg-white/5 transition-colors">
                  <span className="font-medium">Apply GST (18%)</span>
                  <input type="checkbox" {...register("gstApplicable")} disabled={!isEditing || !canEdit} className="w-4 h-4 accent-accent" />
                </label>

                {isEditing ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#888]">Items</p>
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_80px_100px] gap-2">
                        <Input {...register(`items.${index}.particulars` as const)} disabled={!canEdit} className="h-10 text-xs" placeholder="Description" />
                        <Input type="number" {...register(`items.${index}.qty` as const, { valueAsNumber: true })} disabled={!canEdit} className="h-10 text-xs text-center" placeholder="Qty" />
                        <Input type="number" {...register(`items.${index}.rate` as const, { valueAsNumber: true })} disabled={!canEdit} className="h-10 text-xs text-right" placeholder="Rate" />
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm mt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-muted-foreground">GST</span>
                    <span className="font-medium text-foreground">{formatCurrency(gstAmount)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-base">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-bold text-accent">{formatCurrency(total)}</span>
                  </div>
                </div>

                {isEditing && canEdit ? (
                  <Button type="submit" className="w-full h-12 text-sm font-bold bg-white text-black hover:bg-white/90" disabled={updateInvoice.isPending}>
                    <Save className="mr-2 h-4 w-4" /> {updateInvoice.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* PDF Preview */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {pdfPreviewUrl ? <iframe title="Invoice PDF Preview" src={pdfPreviewUrl} className="h-[82vh] w-full bg-white" /> : null}
        </div>
      </div>
    </main>
  );
}
