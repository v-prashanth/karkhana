import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/utils/currency";

type PdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

interface BrandingOptions {
  shopName: string;
  shopAddress: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  footerText?: string | null;
  signatureName?: string | null;
  bankDetails?: string | null;
  upiId?: string | null;
}

interface DCOptions extends BrandingOptions {
  dcNumber: string;
  date: string;
  clientName: string;
  clientReference: string;
  items: { particulars: string; qty: string }[];
}

interface InvoiceOptions extends BrandingOptions {
  billNumber: string;
  date: string;
  clientName: string;
  clientReference: string;
  items: { particulars: string; qty: number; rate: number; amount: number }[];
  subtotal: number;
  gstApplicable: boolean;
  gstRate?: number;
  gstAmount?: number;
  total: number;
  totalWords: string;
}

function hexToRgb(hex?: string | null, fallback: [number, number, number] = [255, 122, 26]) {
  if (!hex) return fallback;
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return fallback;
  const value = parseInt(normalized, 16);
  if (Number.isNaN(value)) return fallback;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as [number, number, number];
}

async function loadImageDataUrl(url: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function drawMinimalHeader(
  doc: jsPDF,
  options: BrandingOptions,
  meta: { title: string; number: string; date: string }
) {
  const accent = hexToRgb(options.primaryColor, [255, 122, 26]);
  const logoData = options.logoUrl ? await loadImageDataUrl(options.logoUrl) : null;

  doc.setFillColor(...accent);
  doc.rect(40, 38, 515, 4, "F");

  if (logoData) {
    doc.addImage(logoData, "PNG", 40, 56, 42, 42, undefined, "FAST");
  }

  const textX = logoData ? 94 : 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text(options.shopName, textX, 72);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  const addressLines = doc.splitTextToSize(options.shopAddress || "", 260);
  doc.text(addressLines, textX, 90);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(meta.title, 555, 72, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`No. ${meta.number}`, 555, 90, { align: "right" });
  doc.text(`Date ${meta.date}`, 555, 106, { align: "right" });
}

function drawLabelValueBlock(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  values: string[]
) {
  doc.setDrawColor(228, 228, 228);
  doc.rect(x, y, width, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(label.toUpperCase(), x + 12, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  let cursor = y + 38;
  values.filter(Boolean).slice(0, 3).forEach((value) => {
    doc.text(value, x + 12, cursor);
    cursor += 14;
  });
}

function drawFooter(doc: jsPDF, footerText?: string | null) {
  doc.setDrawColor(230, 230, 230);
  doc.line(40, 798, 555, 798);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(135, 135, 135);
  doc.text(footerText || "Managed with Karkhana | karkhana.app", 297.5, 812, { align: "center" });
}

export const generateOutwardDCPdf = async (data: DCOptions) => {
  const doc = new jsPDF("p", "pt", "a4") as PdfWithAutoTable;
  const accent = hexToRgb(data.primaryColor, [255, 122, 26]);

  await drawMinimalHeader(doc, data, {
    title: "Delivery Challan",
    number: data.dcNumber,
    date: data.date,
  });

  drawLabelValueBlock(doc, 40, 136, 248, "Deliver To", [data.clientName]);
  drawLabelValueBlock(doc, 307, 136, 248, "Reference", [data.clientReference || "-"]);

  autoTable(doc, {
    startY: 238,
    margin: { left: 40, right: 40 },
    head: [["#", "Particulars", "Quantity"]],
    body: data.items.map((item, index) => [index + 1, item.particulars, item.qty]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 10,
      textColor: [20, 20, 20],
      lineColor: [228, 228, 228],
      lineWidth: 0.6,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [35, 35, 35],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 360 },
      2: { cellWidth: 115 },
    },
    didDrawCell: (hookData) => {
      if (hookData.section === "head" && hookData.column.index === 0) {
        doc.setFillColor(...accent);
        doc.rect(40, 238, 515, 2, "F");
      }
    },
  });

  const finalY = (doc.lastAutoTable?.finalY || 340) + 40;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Receiver Signature", 40, finalY);
  doc.line(40, finalY + 40, 220, finalY + 40);

  doc.text(data.signatureName || "Authorized Signatory", 375, finalY);
  doc.line(375, finalY + 40, 555, finalY + 40);

  drawFooter(doc, data.footerText);
  return doc;
};

export const generateInvoicePdf = async (data: InvoiceOptions) => {
  const doc = new jsPDF("p", "pt", "a4") as PdfWithAutoTable;
  const accent = hexToRgb(data.primaryColor, [255, 122, 26]);

  await drawMinimalHeader(doc, data, {
    title: "Tax Invoice",
    number: data.billNumber,
    date: data.date,
  });

  drawLabelValueBlock(doc, 40, 136, 330, "Bill To", [data.clientName, `Reference: ${data.clientReference || "-"}`]);
  drawLabelValueBlock(doc, 389, 136, 166, "Invoice Total", [formatCurrency(data.total)]);

  autoTable(doc, {
    startY: 238,
    margin: { left: 40, right: 40 },
    head: [["#", "Description", "Qty", "Rate", "Amount"]],
    body: data.items.map((item, index) => [
      index + 1,
      item.particulars,
      item.qty,
      formatCurrency(item.rate),
      formatCurrency(item.amount),
    ]),
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 10,
      textColor: [20, 20, 20],
      lineColor: [228, 228, 228],
      lineWidth: 0.6,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [35, 35, 35],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 270 },
      2: { cellWidth: 56 },
      3: { cellWidth: 90 },
      4: { cellWidth: 105 },
    },
    didDrawCell: (hookData) => {
      if (hookData.section === "head" && hookData.column.index === 0) {
        doc.setFillColor(...accent);
        doc.rect(40, 238, 515, 2, "F");
      }
    },
  });

  let finalY = (doc.lastAutoTable?.finalY || 360) + 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Amount in Words", 40, finalY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text(doc.splitTextToSize(`Rupees ${data.totalWords} Only`, 300), 40, finalY + 20);

  if (data.bankDetails || data.upiId) {
    finalY += 54;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text("Payment Details", 40, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    let paymentY = finalY + 18;
    if (data.bankDetails) {
      doc.text(doc.splitTextToSize(data.bankDetails, 300), 40, paymentY);
      paymentY += 30;
    }
    if (data.upiId) {
      doc.text(`UPI: ${data.upiId}`, 40, paymentY);
    }
  }

  const summaryX = 365;
  const summaryY = (doc.lastAutoTable?.finalY || 360) + 18;
  doc.setDrawColor(228, 228, 228);
  doc.rect(summaryX, summaryY, 190, 96);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Subtotal", summaryX + 14, summaryY + 22);
  doc.text(formatCurrency(data.subtotal), summaryX + 176, summaryY + 22, { align: "right" });

  if (data.gstApplicable) {
    doc.text(`GST (${data.gstRate}%)`, summaryX + 14, summaryY + 42);
    doc.text(formatCurrency(data.gstAmount || 0), summaryX + 176, summaryY + 42, { align: "right" });
  }

  doc.setDrawColor(...accent);
  doc.line(summaryX + 14, summaryY + 58, summaryX + 176, summaryY + 58);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("Total", summaryX + 14, summaryY + 80);
  doc.text(formatCurrency(data.total), summaryX + 176, summaryY + 80, { align: "right" });

  const signY = Math.max(finalY + 84, summaryY + 132);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(data.signatureName || "Authorized Signatory", 375, signY);
  doc.line(375, signY + 34, 555, signY + 34);

  drawFooter(doc, data.footerText);
  return doc;
};
