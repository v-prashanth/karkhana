CREATE TABLE IF NOT EXISTS email_auth_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_auth_codes_email ON email_auth_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_auth_codes_expires_at ON email_auth_codes(expires_at);

ALTER TABLE email_auth_codes ENABLE ROW LEVEL SECURITY;
