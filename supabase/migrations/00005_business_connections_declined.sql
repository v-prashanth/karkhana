ALTER TABLE business_connections
  DROP CONSTRAINT IF EXISTS business_connections_status_check;

ALTER TABLE business_connections
  ADD CONSTRAINT business_connections_status_check
  CHECK (status IN ('pending', 'connected', 'declined', 'blocked'));
