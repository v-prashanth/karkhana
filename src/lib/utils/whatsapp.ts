/**
 * Formats a phone number for the WhatsApp API payload.
 * Strips all non-numeric characters and ensures the default 91 (India) prefix if none exists.
 */
export function formatWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Strip all non-numeric characters (like +, (, ), -, spaces)
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 0) return null;

  // If it's a standard Indian 10-digit number without a country code, prepend 91
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }

  return cleaned;
}

/**
 * Generates the deep link to directly open a WhatsApp chat.
 * Opens wa.me/<phone>?text=<message>
 * If phone is not provided, it falls back to the manual contact picker.
 */
export function generateWhatsAppLink(phone: string | null | undefined, message: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  
  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }
  
  // Fallback to manual selection if no phone is found
  return `https://wa.me/?text=${encodedMessage}`;
}

export function generateInvoiceWhatsAppMessage(
  clientName: string,
  invoiceNumber: string,
  totalAmountText: string,
  shareUrl: string,
  upiLink: string
): string {
  return `Hello ${clientName},\n\nYour invoice ${invoiceNumber} for ${totalAmountText} is ready.\n\nYou can view and download it securely here: ${shareUrl}${upiLink}\n\nThank you for your business.`;
}

export function generatePaymentReminderWhatsAppMessage(
  clientName: string,
  invoiceNumber: string,
  amountDueText: string,
  shareUrl: string,
  upiLink: string
): string {
  return `Hello ${clientName},\n\nThis is a gentle reminder regarding invoice ${invoiceNumber}. An amount of ${amountDueText} is currently due.\n\nYou can view the invoice and make the payment using this securely shared link: ${shareUrl}${upiLink}\n\nThank you!`;
}
