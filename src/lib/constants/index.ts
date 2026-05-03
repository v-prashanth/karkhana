// Every magic number and string
// in one place

export const PAYMENT_METHODS = [
  "cash",
  "upi",
  "bank_transfer",
  "cheque",
  "other",
] as const;

// GST
export const GST_RATE = 18;
export const GST_RATES = [0, 5, 12, 18, 28];

// Document numbering
export const DC_PREFIX = "DC";
export const BILL_PREFIX = "INV";

// Financial year
export const FINANCIAL_YEAR_START_MONTH = 4;

// Overdue thresholds (days)
export const OVERDUE_WARN_DAYS = 7;
export const OVERDUE_ALERT_DAYS = 30;
export const OVERDUE_CRITICAL_DAYS = 45;

// File size limits
export const MAX_PHOTO_SIZE_MB = 5;
export const MAX_PDF_SIZE_MB = 10;

// Rate limiting
export const MAX_OTP_REQUESTS_PER_HOUR = 5;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;

// Signed URL expiry
export const SIGNED_URL_EXPIRY_SECONDS = 3600;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cache
export const DASHBOARD_CACHE_SECONDS = 300;
export const INVOICE_LIST_CACHE_SECONDS = 60;
