-- Add is_active and on_karkhana_org_id to contacts table

ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS on_karkhana_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
