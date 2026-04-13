import type { InsertPayment, Payment } from "@/types/database";

async function parseResponse<T>(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

export const paymentsApi = {
  async list() {
    const response = await fetch("/api/payments");
    return parseResponse<Payment[]>(response);
  },

  async create(payment: Omit<InsertPayment, "organization_id">) {
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payment),
    });

    return parseResponse<Payment>(response);
  },
};

