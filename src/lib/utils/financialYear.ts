export function getCurrentFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYear}`;
}
