export function formatCurrency(value: number) {
  return `₹ ${Math.round(value || 0).toLocaleString("en-IN")}`;
}
