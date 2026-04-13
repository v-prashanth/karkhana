import type { BusinessType } from "@/types/database";

export interface BusinessTemplate {
  id: BusinessType;
  label: string;
  shortLabel: string;
  description: string;
  orderLabel: string;
  modules: string[];
  documents: string[];
  defaultExpenseCategories: string[];
}

export const businessTemplates: BusinessTemplate[] = [
  {
    id: "manufacturing",
    label: "Manufacturing / Job Shop",
    shortLabel: "Manufacturing",
    description: "CNC workshops, fabrication units, machining, and production batches.",
    orderLabel: "Job",
    modules: ["Contacts", "Jobs", "Invoices", "Payments", "Expenses", "Documents", "Reports"],
    documents: ["Inward DC", "Outward DC", "Invoice"],
    defaultExpenseCategories: ["Raw Material", "Tools", "Electricity", "Transport"],
  },
  {
    id: "auto_repair",
    label: "Auto Repair / Service",
    shortLabel: "Auto Repair",
    description: "Garages, service centers, maintenance teams, and repair businesses.",
    orderLabel: "Ticket",
    modules: ["Contacts", "Tickets", "Invoices", "Payments", "Expenses", "Reports"],
    documents: ["Estimate", "Invoice"],
    defaultExpenseCategories: ["Spare Parts", "Consumables", "Rent", "Salary"],
  },
  {
    id: "trading",
    label: "Trading / Wholesale",
    shortLabel: "Trading",
    description: "Distributors, wholesalers, retailers, and stock-led businesses.",
    orderLabel: "Order",
    modules: ["Contacts", "Orders", "Inventory", "Invoices", "Payments", "Expenses", "Reports"],
    documents: ["PO", "DC", "Invoice"],
    defaultExpenseCategories: ["Purchase", "Transport", "Packaging", "Rent"],
  },
  {
    id: "printing",
    label: "Printing / Creative",
    shortLabel: "Printing",
    description: "Print shops, signage teams, and creative studios.",
    orderLabel: "Project",
    modules: ["Contacts", "Projects", "Invoices", "Payments", "Reports"],
    documents: ["Quotation", "Invoice"],
    defaultExpenseCategories: ["Material", "Design", "Machine Time", "Delivery"],
  },
  {
    id: "services",
    label: "General Services",
    shortLabel: "Services",
    description: "Freelancers, agencies, consultants, and local service providers.",
    orderLabel: "Task",
    modules: ["Contacts", "Tasks", "Invoices", "Payments", "Expenses", "Reports"],
    documents: ["Quotation", "Invoice"],
    defaultExpenseCategories: ["Travel", "Software", "Subscriptions", "Salary"],
  },
  {
    id: "custom",
    label: "Custom Setup",
    shortLabel: "Custom",
    description: "Pick your own workflow and configure the business OS your way.",
    orderLabel: "Work",
    modules: ["Contacts", "Work", "Invoices", "Payments", "Expenses", "Reports"],
    documents: ["Quotation", "Invoice"],
    defaultExpenseCategories: ["Rent", "Utilities", "Misc"],
  },
];

export function getBusinessTemplate(type?: BusinessType | null) {
  return businessTemplates.find((template) => template.id === type) ?? businessTemplates[0];
}
