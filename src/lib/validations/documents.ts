import { z } from 'zod';

const itemSchema = z.object({
  id: z.string().optional(),
  particulars: z.string().min(1, 'Particulars is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  rate: z.number().min(0, 'Rate cannot be negative'),
  amount: z.number().min(0, 'Amount cannot be negative'),
});

export const invoiceSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID'),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional().nullable(),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  cgst_amount: z.number().min(0).default(0),
  sgst_amount: z.number().min(0).default(0),
  igst_amount: z.number().min(0).default(0),
  total_amount: z.number().min(0, 'Total amount cannot be negative'),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
});

export const dcSchema = z.object({
  type: z.enum(['inward', 'outward']),
  contact_id: z.string().uuid('Invalid contact ID'),
  dc_number: z.string().min(1, 'DC number is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  vehicle_number: z.string().optional().nullable(),
  items: z.array(z.object({
    id: z.string().optional(),
    particulars: z.string().min(1, 'Particulars is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional().nullable(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type DcInput = z.infer<typeof dcSchema>;
