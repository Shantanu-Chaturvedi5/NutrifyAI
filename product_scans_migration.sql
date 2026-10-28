-- Run this once against your existing database:
--   docker compose exec postgres psql -U nutrifyai -d nutrifyai -f /dev/stdin < product_scans_migration.sql
-- or paste it directly into:
--   docker compose exec postgres psql -U nutrifyai -d nutrifyai

CREATE TABLE IF NOT EXISTS product_scans (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url           TEXT NOT NULL,
    processing_status   processing_status_t NOT NULL DEFAULT 'PENDING',
    failure_reason      TEXT,
    product_id          BIGINT REFERENCES products(id) ON DELETE SET NULL,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at        TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_product_scans_user ON product_scans(user_id, uploaded_at DESC);