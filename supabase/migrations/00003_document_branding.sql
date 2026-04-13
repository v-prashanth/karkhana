ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS brand_primary_color TEXT DEFAULT '#ff7a1a',
  ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT DEFAULT '#171717',
  ADD COLUMN IF NOT EXISTS document_template TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT 'Managed with Karkhana | karkhana.app',
  ADD COLUMN IF NOT EXISTS signature_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_details TEXT,
  ADD COLUMN IF NOT EXISTS upi_id TEXT;
