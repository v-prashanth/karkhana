import { createClient } from '@/lib/supabase/client';
import type { Order, InsertOrder } from '@/types/database';

const supabase = createClient();

export const ordersApi = {
  async list(status?: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const response = await fetch(`/api/orders?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Failed to load orders");
    return payload as Order[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, contact:contacts(id, name, phone)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Order;
  },

  async create(order: Omit<InsertOrder, 'organization_id'>) {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Failed to create order");
    return payload as Order;
  },

  async update(id: string, updates: Partial<Order>) {
    const updateData: Record<string, unknown> = { ...updates };
    // Remove joined fields
    delete updateData.contact;

    if (updates.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select('*, contact:contacts(id, name, phone)')
      .single();
    if (error) throw error;
    return data as Order;
  },

  async updateStatus(id: string, status: string) {
    return ordersApi.update(id, { status } as Partial<Order>);
  },

  async updateProgress(id: string, quantityCompleted: number) {
    return ordersApi.update(id, { quantity_completed: quantityCompleted } as Partial<Order>);
  },

  async getByContact(contactId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Order[];
  },

  async getStatusCounts() {
    const { data, error } = await supabase
      .from('orders')
      .select('status');
    if (error) throw error;

    const counts: Record<string, number> = {};
    (data || []).forEach((row: { status: string }) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    return counts;
  },
};
