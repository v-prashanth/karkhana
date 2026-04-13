import { useStore } from "@/store/useStore";
import type { Organization } from "@/types/database";

async function parseResponse<T>(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

export const organizationApi = {
  async update(updates: Partial<Organization>) {
    const organization = useStore.getState().organization;
    if (!organization?.id) throw new Error("Organization not found");

    const response = await fetch("/api/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: organization.id,
        ...updates,
      }),
    });

    return parseResponse<Organization>(response);
  },
};
