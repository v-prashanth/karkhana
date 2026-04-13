import type { Attendance, Staff } from "@/types/database";

async function parseResponse<T>(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

export const staffApi = {
  async list() {
    const response = await fetch("/api/staff");
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

