import type { BusinessTarget, TargetProgress } from "@/types/database";

async function parseResponse<T>(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

export const targetsApi = {
  async getActive() {
    const response = await fetch("/api/targets");
    return parseResponse<BusinessTarget[]>(response);
  },

  async create(data: { target_type: 'revenue' | 'collections' | 'production'; annual_amount: number; financial_year?: string }) {
    const response = await fetch("/api/targets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseResponse<BusinessTarget>(response);
  },

  async update(data: { id?: string; target_type?: 'revenue' | 'collections' | 'production'; annual_amount?: number; is_active?: boolean }) {
    const response = await fetch("/api/targets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseResponse<BusinessTarget>(response);
  },

  async getProgress(targetType: 'revenue' | 'collections' | 'production' = 'revenue') {
    const response = await fetch(`/api/targets/progress?target_type=${targetType}`);
    return parseResponse<TargetProgress & { hasTarget: boolean }>(response);
  },

  async delete(id?: string, targetType?: 'revenue' | 'collections' | 'production') {
    let url = "/api/targets?";
    if (id) url += `id=${id}`;
    if (targetType) url += `${id ? '&' : ''}target_type=${targetType}`;
    
    const response = await fetch(url, {
      method: "DELETE",
    });
    return parseResponse<{ success: boolean }>(response);
  }
};
