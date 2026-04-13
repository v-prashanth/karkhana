import type { BusinessType, UserRole } from "@/types/database";

export type SeededTestAccount = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone: string | null;
};

export const seededTestOrganization = {
  id: "3f4a2d71-0f98-4d7f-9ad6-7c1eb7d2a501",
  name: "Karkhana Test Manufacturing Co.",
  owner_name: "Test Owner",
  phone: "+91 90000 00001",
  email: "owner@karkhana.test",
  address: "Hyderabad, Telangana",
  gstin: "36ABCDE1234F1Z5",
  logo_url: null,
  business_type: "manufacturing" as BusinessType,
  order_label: "Job",
  invoice_prefix: "KAR",
  invoice_counter: 101,
  dc_prefix: "DC",
  dc_counter: 31,
  quotation_prefix: "QT",
  quotation_counter: 11,
  financial_year: "2026-27",
  plan: "pro",
  plan_expires_at: null as string | null,
};

export const seededTestAccounts: SeededTestAccount[] = [
  {
    email: "owner@karkhana.test",
    password: "KarkhanaOwner@123",
    name: "Test Owner",
    role: "owner",
    phone: "+91 90000 00001",
  },
  {
    email: "accounts@karkhana.test",
    password: "KarkhanaAccounts@123",
    name: "Test Accountant",
    role: "accountant",
    phone: "+91 90000 00002",
  },
  {
    email: "worker@karkhana.test",
    password: "KarkhanaWorker@123",
    name: "Test Worker",
    role: "worker",
    phone: "+91 90000 00003",
  },
];
