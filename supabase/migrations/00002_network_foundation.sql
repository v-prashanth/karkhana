-- ============================================
-- KARKHANA v2 - Network + Sharing Foundation
-- ============================================

CREATE TABLE organization_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  related_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'client_supplier',
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, related_organization_id)
);

CREATE TABLE relationship_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  invited_name TEXT,
  invited_phone TEXT,
  invited_email TEXT,
  relationship_type TEXT NOT NULL DEFAULT 'client_supplier',
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE share_link_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  viewer_name TEXT,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_org_relationships_org ON organization_relationships(organization_id);
CREATE INDEX idx_relationship_invites_org ON relationship_invites(organization_id);
CREATE INDEX idx_share_links_org ON share_links(organization_id);
CREATE INDEX idx_share_links_token ON share_links(token);
CREATE INDEX idx_share_link_views_link ON share_link_views(share_link_id);

ALTER TABLE organization_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_link_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org relationship isolation" ON organization_relationships
  FOR ALL USING (
    organization_id = get_user_org_id()
    OR related_organization_id = get_user_org_id()
  );

CREATE POLICY "Relationship invite isolation" ON relationship_invites
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Share link isolation" ON share_links
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "Share link view isolation" ON share_link_views
  FOR ALL USING (
    share_link_id IN (
      SELECT id FROM share_links WHERE organization_id = get_user_org_id()
    )
  );

CREATE TRIGGER update_organization_relationships_updated_at BEFORE UPDATE ON organization_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_share_links_updated_at BEFORE UPDATE ON share_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
