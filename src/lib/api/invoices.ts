import type { Invoice, InvoiceItem, InsertInvoice, ShareLink } from "@/types/database";

async function parseResponse<T>(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

export const invoicesApi = {
  async list(status?: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);

    const response = await fetch(`/api/invoices?${params.toString()}`);
    return parseResponse<Invoice[]>(response);
  },

  async create(invoice: Omit<InsertInvoice, "organization_id">, items: Omit<InvoiceItem, "id" | "invoice_id">[]) {
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...invoice, items }),
    });

    return parseResponse<Invoice>(response);
  },

  async getById(invoiceId: string) {
    const response = await fetch(`/api/invoices/${invoiceId}`);
    return parseResponse<Invoice>(response);
  },

  async update(invoiceId: string, invoice: Partial<Omit<InsertInvoice, "organization_id">>, items: Omit<InvoiceItem, "id" | "invoice_id">[]) {
    const response = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...invoice, items }),
    });
    return parseResponse<Invoice>(response);
  },

  async getOutstanding() {
    const params = new URLSearchParams({ outstandingOnly: "true" });
    const response = await fetch(`/api/invoices?${params.toString()}`);
    return parseResponse<Invoice[]>(response);
  },

  async getTotalOutstanding() {
    const invoices = await invoicesApi.getOutstanding();
    return invoices.reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0);
  },

  async createShareLink(invoiceId: string, title?: string) {
    const response = await fetch("/api/share-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource_type: "invoice",
        resource_id: invoiceId,
        title: title || "Invoice",
      }),
    });

    return parseResponse<ShareLink>(response);
  },
};

