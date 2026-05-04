"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { generateInvoicePdf } from "@/lib/utils/pdf";

import { Organization, Contact, Invoice, InvoiceItem } from "@/types/database";

interface SharedInvoiceProps {
  invoice: Invoice & {
    organization: Organization;
    contact: Contact;
    items: (InvoiceItem | any)[]; // Keeping any for items temporarily as they might be different in shared view
  };
}

export function DownloadSharedInvoiceButton({ invoice }: SharedInvoiceProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const organization = invoice.organization;
      const contact = invoice.contact;
      const items = invoice.items || [];

      // Calculate totals
      const subtotal = items.reduce((acc: number, item) => acc + (Number(item.quantity || 0) * Number(item.rate || 0)), 0);
      const gstAmount = (invoice.cgst_amount || 0) + (invoice.sgst_amount || 0) + (invoice.igst_amount || 0);
      const isGstApplicable = gstAmount > 0;
      const total = invoice.total || (subtotal + gstAmount);

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
        date: new Date(invoice.date).toLocaleDateString("en-GB"),
        clientName: contact?.name || "Client",
        clientReference: invoice.reference_number || "-",
        items: items.map((item) => ({
          particulars: item.description || "Item",
          qty: Number(item.quantity || 0),
          rate: Number(item.rate || 0),
          amount: Number(item.amount || (Number(item.quantity || 0) * Number(item.rate || 0))),
        })),
        subtotal,
        gstApplicable: isGstApplicable,
        gstRate: invoice.cgst_rate ? invoice.cgst_rate * 2 : 18,
        gstAmount,
        total,
        totalWords: invoice.total_in_words || "Amount as per invoice",
      });

      doc.save(`Invoice_${invoice.invoice_number}.pdf`);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-full bg-[#e06b2f] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[#c9591f] disabled:opacity-50"
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      {loading ? "Preparing PDF..." : "Download as PDF"}
    </button>
  );
}
