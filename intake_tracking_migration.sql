CREATE TYPE intake_entry_type_t AS ENUM ('FOOD', 'WATER');

CREATE TABLE daily_intake_logs (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date            DATE NOT NULL,
    entry_type          intake_entry_type_t NOT NULL,
    product_id          BIGINT REFERENCES products(id) ON DELETE SET NULL,
    description         TEXT NOT NULL,
    calories            NUMERIC(8,2),
    protein_g           NUMERIC(6,2),
    water_ml            NUMERIC(8,2),
    logged_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_intake_logs_user_date ON daily_intake_logs(user_id, log_date);