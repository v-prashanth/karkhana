-- Add business type to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS
  business_type TEXT DEFAULT 'generic_service';
