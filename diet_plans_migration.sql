ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS generation_status processing_status_t NOT NULL DEFAULT 'PENDING';
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS failure_reason TEXT;