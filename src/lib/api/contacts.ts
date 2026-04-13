import { createClient } from '@/lib/supabase/client';
import type { Contact, InsertContact } from '@/types/database';
import { sharingApi } from './sharing';

const supabase = createClient();

export const contactsApi = {
  async list(type?: 'client' | 'supplier') {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    const response = await fetch(`/api/contacts?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Failed to load contacts");
    return payload as Contact[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Contact;
  },

  async create(contact: Omit<InsertContact, 'organization_id'>) {
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Failed to create contact");
    return payload as Contact;
  },

  async update(id: string, updates: Partial<Contact>) {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Contact;
  },

  async archive(id: string) {
    return contactsApi.update(id, { is_active: false });
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);
    if (error) throw error;
    return data as Contact[];
  },

  async getLedger(contactId: string) {
    const [contactRes, invoicesRes, paymentsRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).single(),
      supabase.from('invoices').select('*').eq('contact_id', contactId).order('date', { ascending: false }),
      supabase.from('payments').select('*').eq('contact_id', contactId).order('date', { ascending: false }),
    ]);

    if (contactRes.error) throw contactRes.error;
    const contact = contactRes.data as Contact;

    // Fetch received documents if this contact is on Karkhana
    let receivedDocs: any[] = [];
    if (contact.on_karkhana_org_id) {
       receivedDocs = await sharingApi.getReceivedDocs();
       // Filter to only docs from this specific partner
       receivedDocs = receivedDocs.filter(d => 
         d.sender_id === contact.on_karkhana_org_id || 
         d.sender?.id === contact.on_karkhana_org_id
       );
    }

    const invoices = invoicesRes.data || [];
    const payments = paymentsRes.data || [];
    const totalInvoiced = invoices.reduce((sum: number, inv: { total?: number | null }) => sum + (inv.total || 0), 0);
    const totalPaid = payments.reduce((sum: number, pay: { amount?: number | null }) => sum + (pay.amount || 0), 0);

    return {
      contact,
      totalInvoiced,
      totalPaid,
      outstanding: totalInvoiced - totalPaid,
      invoices,
      payments,
      receivedDocs
    };
  },
};
