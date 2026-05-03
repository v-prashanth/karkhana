// ONE place for all date handling

export const formatDate = (
  date: string | Date,
  format: "display" | "input" | "short" = "display"
): string => {
  const d = new Date(date);

  switch (format) {
    case "display":
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    case "short":
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    case "input":
      return d.toISOString().split("T")[0];
  }
};

export const daysBetween = (
  date1: string | Date,
  date2: string | Date = new Date()
): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = d2.getTime() - d1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getOverdueStatus = (
  dueDate: string,
  status: string
): "paid" | "upcoming" | "warning" | "alert" | "critical" => {
  if (status === "paid") return "paid";

  const days = daysBetween(dueDate);

  if (days < 0) return "upcoming";
  if (days < 7) return "warning";
  if (days < 30) return "alert";
  return "critical";
};

export const getCurrentFinancialYear = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`;
  }
  return `${year - 1}-${String(year).slice(-2)}`;
};
