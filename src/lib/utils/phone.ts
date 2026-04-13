/**
 * Normalizes an Indian phone number to universally matching E.164-like (+91) format.
 * This is critical for the "Shadow Network" to correctly join invoices to contacts statelessly.
 */
export function normalizePhone(rawPhone: string | null | undefined): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null;

  // Strip all non-numeric characters
  const digits = rawPhone.replace(/\D/g, "");

  if (digits.length === 10) {
    // Standard 10 digit Indian number
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  // If it's already properly formatted or doesn't match standard Indian lengths,
  // we just prepend + if it doesn't have it, but for our specific strict constraints:
  if (rawPhone.startsWith("+") && digits.length >= 10) {
     return `+${digits}`;
  }

  // Fallback: If it's 10 digits inside some weird formatting
  if (digits.length > 10) {
     const last10 = digits.slice(-10);
     return `+91${last10}`;
  }

  return rawPhone; // Malformed or partial, return as is (better than throwing in most cases)
}
