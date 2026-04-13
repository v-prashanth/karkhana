-- Migration 00007: Audit Logging and Security Hardening

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_read" ON audit_logs FOR SELECT 
USING (auth.uid() IN (SELECT id FROM users WHERE organization_id = audit_logs.organization_id));

-- Triggers for deletion logging
CREATE OR REPLACE FUNCTION log_entity_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO audit_logs (organization_id, entity_type, entity_id, action_type, metadata)
    VALUES (
        OLD.organization_id, 
        TG_TABLE_NAME, 
        OLD.id, 
        'DELETE',
        row_to_json(OLD)::jsonb
    );
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_invoice_deletion ON invoices;
CREATE TRIGGER trigger_log_invoice_deletion
AFTER DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION log_entity_deletion();

DROP TRIGGER IF EXISTS trigger_log_payment_deletion ON payments;
CREATE TRIGGER trigger_log_payment_deletion
AFTER DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION log_entity_deletion();

DROP TRIGGER IF EXISTS trigger_log_contact_deletion ON contacts;
CREATE TRIGGER trigger_log_contact_deletion
AFTER DELETE ON contacts
FOR EACH ROW EXECUTE FUNCTION log_entity_deletion();

DROP TRIGGER IF EXISTS trigger_log_order_deletion ON orders;
CREATE TRIGGER trigger_log_order_deletion
AFTER DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION log_entity_deletion();
