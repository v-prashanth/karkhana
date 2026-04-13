// ============================================
// Karkhana v2 — Database Types
// ============================================

export type BusinessType =
  | 'manufacturing'
  | 'auto_repair'
  | 'trading'
  | 'printing'
  | 'services'
  | 'custom';

export type UserRole = 'owner' | 'manager' | 'worker' | 'accountant' | 'viewer';

export type ContactType = 'client' | 'supplier' | 'both';

export type OrderStatus =
  | 'received'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'invoiced'
  | 'cancelled';

export type OrderPriority = 'normal' | 'urgent';

export type DocumentType =
  | 'inward_dc'
  | 'outward_dc'
  | 'quotation'
  | 'purchase_order'
  | 'gate_pass';

export type InvoiceType = 'tax_invoice' | 'proforma' | 'credit_note';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled';

export type PaymentMethod =
  | 'cash'
  | 'upi'
  | 'bank_transfer'
  | 'cheque'
  | 'other';

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'overtime';
export type ShareResourceType = 'invoice' | 'document' | 'ledger';

// ============================================
// Table Row Types
// ============================================

export interface Organization {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  logo_url: string | null;
  brand_primary_color: string | null;
  brand_secondary_color: string | null;
  document_template: string | null;
  footer_text: string | null;
  signature_name: string | null;
  bank_details: string | null;
  upi_id: string | null;
  business_type: BusinessType;
  public_slug: string | null;
  is_verified: boolean;
  order_label: string;
  invoice_prefix: string;
  invoice_counter: number;
  dc_prefix: string;
  dc_counter: number;
  quotation_prefix: string;
  quotation_counter: number;
  financial_year: string;
  plan: string;
  plan_expires_at: string | null;
  total_revenue: number;
  total_outstanding: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  type: ContactType;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  total_outstanding: number;
  tags: string[];
  notes: string | null;
  is_active: boolean;
  on_karkhana_org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  organization_id: string;
  contact_id: string | null;
  order_number: string | null;
  reference_number: string | null;
  description: string;
  status: OrderStatus;
  priority: OrderPriority;
  quantity: number | null;
  quantity_unit: string;
  quantity_completed: number;
  material: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact?: Contact;
}

export interface Document {
  id: string;
  organization_id: string;
  contact_id: string | null;
  order_id: string | null;
  type: DocumentType;
  document_number: string;
  date: string;
  reference_number: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  contact?: Contact;
  items?: DocumentItem[];
}

export interface DocumentItem {
  id: string;
  document_id: string;
  description: string;
  quantity: number | null;
  unit: string;
  rate: number | null;
  amount: number | null;
  sort_order: number;
}

export interface Invoice {
  id: string;
  organization_id: string;
  contact_id: string | null;
  order_id: string | null;
  document_id: string | null;
  type: InvoiceType;
  invoice_number: string;
  date: string;
  due_date: string | null;
  reference_number: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total: number;
  total_in_words: string | null;
  status: InvoiceStatus;
  amount_paid: number;
  amount_due: number;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  contact?: Contact;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  hsn_sac: string | null;
  quantity: number;
  unit: string;
  rate: number;
  discount_percent: number;
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;
  amount: number;
  sort_order: number;
}

export interface Payment {
  id: string;
  organization_id: string;
  contact_id: string | null;
  invoice_id: string | null;
  amount: number;
  method: PaymentMethod;
  reference_number: string | null;
  date: string;
  notes: string | null;
  created_at: string;
  // Joined
  contact?: Contact;
  invoice?: Invoice;
}

export interface ExpenseCategory {
  id: string;
  organization_id: string;
  name: string;
  icon: string | null;
  is_default: boolean;
  sort_order: number;
}

export interface Expense {
  id: string;
  organization_id: string;
  category_id: string | null;
  contact_id: string | null;
  amount: number;
  description: string;
  date: string;
  method: string;
  reference_number: string | null;
  receipt_url: string | null;
  is_recurring: boolean;
  recurring_period: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  category?: ExpenseCategory;
  contact?: Contact;
}

export interface Staff {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  role: string | null;
  pay_type: 'daily' | 'monthly';
  pay_rate: number;
  is_active: boolean;
  joined_at: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  organization_id: string;
  staff_id: string;
  date: string;
  status: AttendanceStatus;
  overtime_hours: number;
  notes: string | null;
  created_at: string;
  // Joined
  staff?: Staff;
}

export interface ShareLink {
  id: string;
  organization_id: string;
  resource_type: ShareResourceType;
  resource_id: string;
  token: string;
  title: string | null;
  description: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessConnection {
  id: string;
  requester_org_id: string;
  receiver_org_id: string;
  status: 'pending' | 'connected' | 'declined' | 'blocked';
  initiated_at: string;
  connected_at: string | null;
}

export interface SharedDocument {
  id: string;
  organization_id: string;
  document_type: string;
  document_id: string;
  token: string;
  expires_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ReceivedDocument {
  id: string;
  organization_id: string;
  from_organization_id: string;
  document_type: string;
  shared_document_id: string | null;
  status: 'new' | 'viewed' | 'paid';
  notes: string | null;
  received_at: string;
}

export interface PurchaseOrderReceived {
  id: string;
  organization_id: string;
  from_organization_id: string;
  po_number: string;
  description: string | null;
  line_items: Record<string, unknown>[];
  total: number;
  status: 'new' | 'acknowledged' | 'in_progress' | 'complete';
  due_date: string | null;
  received_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================
// Insert Types (for creating new records)
// ============================================

export type InsertOrganization = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
export interface InsertContact {
  organization_id: string;
  type: ContactType;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  total_outstanding?: number;
  tags?: string[];
  notes?: string | null;
  is_active?: boolean;
  on_karkhana_org_id?: string | null;
}
export type InsertOrder = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'contact'>;
export type InsertInvoice = Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'contact' | 'items'>;
export type InsertPayment = Omit<Payment, 'id' | 'created_at' | 'contact' | 'invoice'>;
export type InsertExpense = Omit<Expense, 'id' | 'created_at' | 'category' | 'contact'>;

// ============================================
// Dashboard / Aggregated Types
// ============================================

export interface DashboardMetrics {
  activeOrders: number;
  totalOutstanding: number;
  revenueThisMonth: number;
  paymentsThisMonth: number;
  expensesThisMonth: number;
  overdueInvoices: number;
  invoiceCount: number;
  expenseCount: number;
  orderCount: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'invoice' | 'payment' | 'order' | 'expense';
  title: string;
  subtitle: string;
  amount?: number;
  timestamp: string;
}

export interface ContactLedger {
  contact: Contact;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  invoices: Invoice[];
  payments: Payment[];
}
