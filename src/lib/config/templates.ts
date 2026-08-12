import type { BusinessType } from "@/types/database";

export interface BusinessTemplate {
  id: BusinessType;
  label: string;
  shortLabel: string;
  description: string;
  orderLabel: string;
  receiveLabel?: string;
  dispatchLabel?: string;
  hasPhysicalMovement: boolean;
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
    receiveLabel: "Receive Material",
    dispatchLabel: "Return Material",
    hasPhysicalMovement: true,
    modules: ["Contacts", "Jobs", "Invoices", "Payments", "Expenses", "Documents", "Reports"],
    documents: ["Rule 55 Challan", "Outward DC", "Invoice"],
    defaultExpenseCategories: ["Raw Material", "Tools", "Electricity", "Transport"],
  },
  {
    id: "auto_repair",
    label: "Auto Repair / Service",
    shortLabel: "Auto Repair",
    description: "Garages, service centers, maintenance teams, and repair businesses.",
    orderLabel: "Ticket",
    receiveLabel: "Receive Device",
    dispatchLabel: "Return Device",
    hasPhysicalMovement: true,
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
    receiveLabel: "Goods Received",
    dispatchLabel: "Goods Dispatched",
    hasPhysicalMovement: true,
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
    receiveLabel: "Receive Media",
    dispatchLabel: "Dispatch Print",
    hasPhysicalMovement: true,
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
    hasPhysicalMovement: false,
    modules: ["Contacts", "Tasks", "Invoices", "Payments", "Expenses", "Reports"],
    documents: ["Quotation", "Invoice"],
    defaultExpenseCategories: ["Travel", "Software", "Subscriptions", "Salary"],
  },
  {
    id: "custom",
    label: "Custom Setup",
    shortLabel: "Custom",
    description: "Flexible operational workspace built to adapt to your business.",
    orderLabel: "Work",
    hasPhysicalMovement: false,
    modules: ["Contacts", "Work", "Invoices", "Payments", "Expenses", "Reports"],
    documents: ["Quotation", "Invoice"],
    defaultExpenseCategories: ["Rent", "Utilities", "Misc"],
  },
];

export function getBusinessTemplate(type?: BusinessType | null) {
  return businessTemplates.find((template) => template.id === type) ?? businessTemplates[0];
}
