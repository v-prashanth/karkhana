import * as XLSX from "xlsx";
import type { Invoice, Expense, Payment } from "@/types/database";

/**
 * Generates and triggers a download for a Business Summary Excel report.
 */
export function downloadBusinessSummaryExcel(
  invoices: Invoice[],
  payments: Payment[],
  expenses: Expense[],
  monthLabel: string
) {
  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Invoice Summary ---
  const invoiceRows = invoices.map((inv) => ({
    "Invoice #": inv.invoice_number,
    "Date": new Date(inv.date).toLocaleDateString("en-IN"),
    "Client": inv.contact?.name || "-",
    "GSTIN": inv.contact?.gstin || "-",
    "Taxable Amount": Number(inv.taxable_amount || 0),
    "CGST": Number(inv.cgst_amount || 0),
    "SGST": Number(inv.sgst_amount || 0),
    "IGST": Number(inv.igst_amount || 0),
    "Total": Number(inv.total || 0),
    "Amount Paid": Number(inv.amount_paid || 0),
    "Outstanding": Number(inv.amount_due || 0),
    "Status": inv.status,
    "Due Date": inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-IN") : "-",
  }));
  const invSheet = XLSX.utils.json_to_sheet(invoiceRows);
  XLSX.utils.book_append_sheet(wb, invSheet, "Invoices");

  // --- Sheet 2: Payments Received ---
  const paymentRows = payments.map((pay) => ({
    "Date": new Date(pay.date).toLocaleDateString("en-IN"),
    "Client": pay.contact?.name || "-",
    "Amount": Number(pay.amount || 0),
    "Method": pay.method,
    "Reference": pay.reference_number || "-",
    "Invoice #": pay.invoice?.invoice_number || "-",
    "Notes": pay.notes || "-",
  }));
  const paySheet = XLSX.utils.json_to_sheet(paymentRows);
  XLSX.utils.book_append_sheet(wb, paySheet, "Payments");

  // --- Sheet 3: Expenses ---
  const expenseRows = expenses.map((exp) => ({
    "Date": new Date(exp.date).toLocaleDateString("en-IN"),
    "Description": exp.description,
    "Amount": Number(exp.amount || 0),
    "Category": exp.category?.name || "Uncategorized",
    "Method": exp.method || "-",
    "Reference": exp.reference_number || "-",
    "Notes": exp.notes || "-",
  }));
  const expSheet = XLSX.utils.json_to_sheet(expenseRows);
  XLSX.utils.book_append_sheet(wb, expSheet, "Expenses");

  // --- Sheet 4: Summary ---
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalReceived = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + Number(i.amount_due || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const summaryData = [
    { "Metric": "Total Invoiced", "Value": totalInvoiced },
    { "Metric": "Total Received", "Value": totalReceived },
    { "Metric": "Total Outstanding", "Value": totalOutstanding },
    { "Metric": "Total Expenses", "Value": totalExpenses },
    { "Metric": "Net Cash Flow", "Value": totalReceived - totalExpenses },
    { "Metric": "Invoices Created", "Value": invoices.length },
    { "Metric": "Payments Recorded", "Value": payments.length },
    { "Metric": "Expenses Logged", "Value": expenses.length },
  ];
  const sumSheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, sumSheet, "Summary");

  // Trigger download
  XLSX.writeFile(wb, `Karkhana_Report_${monthLabel.replace(/ /g, "_")}.xlsx`);
}

/**
 * Generates and triggers download for GSTR-1 formatted data.
 * Covers B2B invoices (with GSTIN) and B2C invoices (without GSTIN).
 */
export function downloadGSTR1Excel(invoices: Invoice[], monthLabel: string) {
  const wb = XLSX.utils.book_new();

  // --- B2B Sheet (Invoices where client has GSTIN) ---
  const b2bInvoices = invoices.filter((inv) => inv.contact?.gstin);
  const b2bRows = b2bInvoices.map((inv) => ({
    "GSTIN of Recipient": inv.contact?.gstin || "",
    "Receiver Name": inv.contact?.name || "",
    "Invoice Number": inv.invoice_number,
    "Invoice Date": new Date(inv.date).toLocaleDateString("en-IN"),
    "Invoice Value": Number(inv.total || 0),
    "Place of Supply": "", // Would need state code
    "Reverse Charge": "N",
    "Invoice Type": "Regular",
    "Rate (%)": Number(inv.cgst_rate || 0) + Number(inv.sgst_rate || 0) + Number(inv.igst_rate || 0),
    "Taxable Value": Number(inv.taxable_amount || 0),
    "CGST Amount": Number(inv.cgst_amount || 0),
    "SGST Amount": Number(inv.sgst_amount || 0),
    "IGST Amount": Number(inv.igst_amount || 0),
    "Cess Amount": 0,
  }));
  const b2bSheet = XLSX.utils.json_to_sheet(b2bRows);
  XLSX.utils.book_append_sheet(wb, b2bSheet, "B2B");

  // --- B2C Sheet (Invoices where client has NO GSTIN) ---
  const b2cInvoices = invoices.filter((inv) => !inv.contact?.gstin);
  const b2cRows = b2cInvoices.map((inv) => ({
    "Invoice Number": inv.invoice_number,
    "Invoice Date": new Date(inv.date).toLocaleDateString("en-IN"),
    "Buyer Name": inv.contact?.name || "Walk-in",
    "Invoice Value": Number(inv.total || 0),
    "Place of Supply": "",
    "Rate (%)": Number(inv.cgst_rate || 0) + Number(inv.sgst_rate || 0) + Number(inv.igst_rate || 0),
    "Taxable Value": Number(inv.taxable_amount || 0),
    "CGST Amount": Number(inv.cgst_amount || 0),
    "SGST Amount": Number(inv.sgst_amount || 0),
    "IGST Amount": Number(inv.igst_amount || 0),
    "Cess Amount": 0,
  }));
  const b2cSheet = XLSX.utils.json_to_sheet(b2cRows);
  XLSX.utils.book_append_sheet(wb, b2cSheet, "B2C");

  // --- HSN Summary Sheet ---
  const hsnMap = new Map<string, { taxableValue: number; cgst: number; sgst: number; igst: number; total: number }>();
  invoices.forEach((inv) => {
    inv.items?.forEach((item) => {
      const hsn = item.hsn_sac || "N/A";
      const existing = hsnMap.get(hsn) || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
      existing.taxableValue += Number(item.taxable_amount || 0);
      existing.cgst += Number(inv.cgst_amount || 0) * (Number(item.amount || 0) / Number(inv.total || 1));
      existing.sgst += Number(inv.sgst_amount || 0) * (Number(item.amount || 0) / Number(inv.total || 1));
      existing.igst += Number(inv.igst_amount || 0) * (Number(item.amount || 0) / Number(inv.total || 1));
      existing.total += Number(item.amount || 0);
      hsnMap.set(hsn, existing);
    });
  });
  const hsnRows = Array.from(hsnMap.entries()).map(([hsn, data]) => ({
    "HSN/SAC": hsn,
    "Taxable Value": Math.round(data.taxableValue * 100) / 100,
    "CGST": Math.round(data.cgst * 100) / 100,
    "SGST": Math.round(data.sgst * 100) / 100,
    "IGST": Math.round(data.igst * 100) / 100,
    "Total Tax": Math.round((data.cgst + data.sgst + data.igst) * 100) / 100,
  }));
  const hsnSheet = XLSX.utils.json_to_sheet(hsnRows);
  XLSX.utils.book_append_sheet(wb, hsnSheet, "HSN Summary");

  XLSX.writeFile(wb, `GSTR1_${monthLabel.replace(/ /g, "_")}.xlsx`);
}
