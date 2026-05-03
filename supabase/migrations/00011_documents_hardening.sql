-- Migration 00011: Ensure documents table has order_id and reference_number columns
-- These are used by the Inward/Outward DC APIs for Job linking

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reference_number TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Also ensure document_items table exists for line items
CREATE TABLE IF NOT EXISTS document_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(15,2) DEFAULT 1,
  unit TEXT DEFAULT 'Nos',
  rate DECIMAL(15,2) DEFAULT 0,
  amount DECIMAL(15,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document items follow parent policy" ON document_items
  FOR ALL USING (
    document_id IN (
      SELECT id FROM documents WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );

-- Phone normalization helper for the Shadow Network
CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Strip everything except digits
  phone := regexp_replace(phone, '[^0-9]', '', 'g');
  -- If starts with 91 and is 12 digits, strip the 91
  IF length(phone) = 12 AND phone LIKE '91%' THEN
    phone := substring(phone FROM 3);
  END IF;
  -- If starts with 0 and is 11 digits, strip the 0
  IF length(phone) = 11 AND phone LIKE '0%' THEN
    phone := substring(phone FROM 2);
  END IF;
  RETURN phone;
END;
$$;
