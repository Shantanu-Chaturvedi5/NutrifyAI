ALTER TABLE restaurant_menus ADD COLUMN IF NOT EXISTS processing_status processing_status_t NOT NULL DEFAULT 'PENDING';
ALTER TABLE restaurant_menus ADD COLUMN IF NOT EXISTS failure_reason TEXT;