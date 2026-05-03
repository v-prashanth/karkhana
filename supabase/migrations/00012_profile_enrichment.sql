-- Migration 00012: Organization Profile Enrichment
-- Adds fields needed for a complete, network-ready business profile.

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS year_established INTEGER,
ADD COLUMN IF NOT EXISTS employee_count TEXT, -- e.g. '1-10', '11-50', '51-200'
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Index on public_slug for fast public profile lookups
CREATE INDEX IF NOT EXISTS idx_organizations_public_slug 
ON organizations(public_slug) WHERE public_slug IS NOT NULL;
