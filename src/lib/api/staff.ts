import type { Attendance, Staff } from "@/types/database";

async function parseResponse<T>(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

export const staffApi = {
  async list(showAll = false) {
    const params = showAll ? "?all=true" : "";
    const response = await fetch(`/api/staff${params}`);
    return parseResponse<Staff[]>(response);
  },

  async create(staff: Omit<Staff, "id" | "organization_id" | "created_at">) {
    const response = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staff),
    });
    return parseResponse<Staff>(response);
  },

  async update(id: string, data: Partial<Pick<Staff, "name" | "phone" | "role" | "pay_type" | "pay_rate" | "is_active" | "joined_at">>) {
    const response = await fetch(`/api/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return parseResponse<Staff>(response);
  },

  async remove(id: string) {
    const response = await fetch(`/api/staff/${id}`, {
      method: "DELETE",
    });
    return parseResponse<{ deleted?: boolean; deactivated?: boolean; message?: string }>(response);
  },

  async listAttendance(staffId?: string) {
    const params = new URLSearchParams();
    if (staffId) params.set("staffId", staffId);
    const response = await fetch(`/api/attendance?${params.toString()}`);
    return parseResponse<Attendance[]>(response);
  },

  async markAttendance(payload: {
    staff_id: string;
    date?: string;
    status: Attendance["status"];
    overtime_hours?: number;
    notes?: string | null;
  }) {
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseResponse<Attendance>(response);
  },
};
