import type { OrderCost, JobMarginSummary } from "@/types/database";

async function parseResponse<T>(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

export const costsApi = {
  async list(orderId?: string) {
    const url = orderId ? `/api/jobs/costs?order_id=${orderId}` : "/api/jobs/costs";
    const response = await fetch(url);
    return parseResponse<OrderCost[]>(response);
  },

  async create(data: {
    order_id: string;
    cost_category: 'material' | 'labor' | 'outsourcing' | 'other';
    description: string;
    amount: number;
    staff_id?: string | null;
    supplier_id?: string | null;
  }) {
    const response = await fetch("/api/jobs/costs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseResponse<OrderCost>(response);
  },

  async update(data: {
    id: string;
    cost_category?: 'material' | 'labor' | 'outsourcing' | 'other';
    description?: string;
    amount?: number;
    staff_id?: string | null;
    supplier_id?: string | null;
  }) {
    const response = await fetch("/api/jobs/costs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseResponse<OrderCost>(response);
  },

  async delete(id: string) {
    const response = await fetch(`/api/jobs/costs?id=${id}`, {
      method: "DELETE",
    });
    return parseResponse<{ success: boolean }>(response);
  },

  async getMargins() {
    const response = await fetch("/api/jobs/margins");
    return parseResponse<{
      summaries: JobMarginSummary[];
      metrics: {
        totalRevenue: number;
        totalCosts: number;
        totalProfit: number;
        averageMarginPercentage: number;
        materialTotal: number;
        laborTotal: number;
        outsourcingTotal: number;
        otherTotal: number;
      };
    }>(response);
  }
};
