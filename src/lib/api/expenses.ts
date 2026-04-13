import type { Expense, ExpenseCategory, InsertExpense } from "@/types/database";

async function parseResponse<T>(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

export const expensesApi = {
  async list(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month && year) {
      params.set("month", String(month));
      params.set("year", String(year));
    }

    const response = await fetch(`/api/expenses?${params.toString()}`);
    return parseResponse<Expense[]>(response);
  },

  async create(expense: Omit<InsertExpense, "organization_id">) {
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });

    return parseResponse<Expense>(response);
  },

  async getCategories() {
    const params = new URLSearchParams({ includeCategories: "true" });
    const response = await fetch(`/api/expenses?${params.toString()}`);
    return parseResponse<ExpenseCategory[]>(response);
  },
};

