CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id uuid PRIMARY KEY,
  sale_id varchar(66) NOT NULL REFERENCES sales_index(sale_id),
  url text NOT NULL,
  secret varchar(64) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'PENDING',
  attempts int NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS webhook_endpoints_due_idx ON webhook_endpoints(status, next_retry_at);
