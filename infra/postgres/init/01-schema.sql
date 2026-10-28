-- ============================================================================
-- Nouriq — PostgreSQL Schema (Phase 1)
-- ============================================================================
-- Conventions:
--   * Surrogate keys: BIGSERIAL. Confirmed over UUID — simpler, faster joins,
--     fine for a project at this scale. Revisit only if you later expose IDs
--     in public URLs or need multi-region writes.
--   * Postgres-only. MongoDB was dropped from the Phase 1 draft — the
--     document-shaped data (OCR extractions, chat context, nutrition-twin
--     detail) now lives inline as JSONB instead of a second database. One
--     less container, one less client library, same query flexibility for
--     data this size.
--   * All timestamps are TIMESTAMPTZ, defaulting to now() in UTC.
--   * Soft deletes are NOT used by default (is_active flags where relevant).
--   * Lookup/reference tables (roles, medical_conditions, health_goals) are
--     seeded tables, not user-editable, so they stay small and cacheable.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- for gen_random_uuid(), hashing helpers
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy/fast product name search
CREATE EXTENSION IF NOT EXISTS vector;     -- pgvector, for RAG embeddings

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE auth_provider_t        AS ENUM ('LOCAL', 'GOOGLE', 'APPLE');
CREATE TYPE activity_level_t       AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');
CREATE TYPE dietary_preference_t   AS ENUM ('VEGETARIAN', 'VEGAN', 'NON_VEGETARIAN', 'EGGETARIAN', 'PESCATARIAN');
CREATE TYPE gender_t               AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');
CREATE TYPE report_type_t          AS ENUM ('BLOOD', 'CBC', 'LIPID_PROFILE', 'HBA1C', 'THYROID', 'VITAMIN', 'OTHER');
CREATE TYPE processing_status_t    AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE value_status_t         AS ENUM ('NORMAL', 'LOW', 'HIGH', 'DEFICIENT', 'CRITICAL');
CREATE TYPE product_source_t       AS ENUM ('USER_SCANNED', 'CATALOG', 'MANUAL');
CREATE TYPE plan_type_t            AS ENUM ('ONE_DAY', 'SEVEN_DAY', 'THIRTY_DAY');
CREATE TYPE plan_status_t          AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');
CREATE TYPE meal_type_t            AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
CREATE TYPE recommendation_type_t  AS ENUM ('PRODUCT', 'ALTERNATIVE', 'PEOPLE_LIKE_YOU', 'DIET_PLAN');
CREATE TYPE chat_role_t            AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE wearable_provider_t    AS ENUM ('FITBIT', 'APPLE_WATCH', 'GARMIN');
CREATE TYPE wearable_status_t      AS ENUM ('CONNECTED', 'DISCONNECTED', 'TOKEN_EXPIRED', 'ERROR');
CREATE TYPE notification_type_t    AS ENUM ('REPORT_READY', 'DEFICIENCY_ALERT', 'NEW_RECOMMENDATION', 'PLAN_REMINDER', 'SYSTEM');

-- ============================================================================
-- IDENTITY & ACCESS
-- ============================================================================

CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255),                 -- nullable: OAuth-only users
    full_name           VARCHAR(255) NOT NULL,
    phone               VARCHAR(20),
    auth_provider       auth_provider_t NOT NULL DEFAULT 'LOCAL',
    provider_id         VARCHAR(255),                  -- external OAuth subject id
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_provider ON users(auth_provider, provider_id);

CREATE TABLE roles (
    id      SMALLSERIAL PRIMARY KEY,
    name    VARCHAR(30) NOT NULL UNIQUE   -- USER, ADMIN, MODERATOR
);

CREATE TABLE user_roles (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     SMALLINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE refresh_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    device_info     VARCHAR(255),
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE password_reset_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- HEALTH PROFILE SYSTEM
-- ============================================================================

CREATE TABLE health_profiles (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    age                 SMALLINT CHECK (age BETWEEN 1 AND 130),
    gender              gender_t,
    weight_kg           NUMERIC(5,2),
    height_cm           NUMERIC(5,2),
    activity_level      activity_level_t,
    dietary_preference  dietary_preference_t,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE medical_conditions (
    id      SMALLSERIAL PRIMARY KEY,
    code    VARCHAR(50) NOT NULL UNIQUE,   -- DIABETES, HYPERTENSION, HEART_DISEASE, ...
    name    VARCHAR(100) NOT NULL
);

CREATE TABLE user_medical_conditions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    condition_id    SMALLINT NOT NULL REFERENCES medical_conditions(id),
    severity        VARCHAR(20),           -- MILD, MODERATE, SEVERE (free-ish, kept simple)
    notes           TEXT,
    diagnosed_at    DATE,
    UNIQUE (user_id, condition_id)
);
CREATE INDEX idx_umc_user ON user_medical_conditions(user_id);

CREATE TABLE health_goals (
    id      SMALLSERIAL PRIMARY KEY,
    code    VARCHAR(50) NOT NULL UNIQUE,   -- WEIGHT_LOSS, MUSCLE_GAIN, ...
    name    VARCHAR(100) NOT NULL
);

CREATE TABLE user_health_goals (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id         SMALLINT NOT NULL REFERENCES health_goals(id),
    target_value    NUMERIC(8,2),
    target_date     DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, goal_id)
);
CREATE INDEX idx_uhg_user ON user_health_goals(user_id);

CREATE TABLE allergies (
    id      SMALLSERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE   -- PEANUT, GLUTEN, LACTOSE, SHELLFISH, ...
);

CREATE TABLE user_allergies (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    allergy_id  SMALLINT NOT NULL REFERENCES allergies(id),
    PRIMARY KEY (user_id, allergy_id)
);

-- ============================================================================
-- HEALTH REPORT ANALYZER
-- ============================================================================

CREATE TABLE medical_reports (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type         report_type_t NOT NULL,
    original_filename   VARCHAR(255) NOT NULL,
    file_url            TEXT NOT NULL,            -- S3 object URL/key
    processing_status   processing_status_t NOT NULL DEFAULT 'PENDING',
    raw_extraction      JSONB DEFAULT '{}'::jsonb, -- full OCR text, bounding boxes, LLM summary
    failure_reason      TEXT,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at        TIMESTAMPTZ
);
CREATE INDEX idx_reports_user ON medical_reports(user_id, uploaded_at DESC);
CREATE INDEX idx_reports_status ON medical_reports(processing_status);
CREATE INDEX idx_reports_raw_extraction_gin ON medical_reports USING gin (raw_extraction);

CREATE TABLE report_extracted_values (
    id                      BIGSERIAL PRIMARY KEY,
    report_id               BIGINT NOT NULL REFERENCES medical_reports(id) ON DELETE CASCADE,
    parameter_name          VARCHAR(100) NOT NULL,     -- "Vitamin D", "LDL Cholesterol"
    value                   NUMERIC(10,3),
    unit                    VARCHAR(20),
    reference_range_low     NUMERIC(10,3),
    reference_range_high    NUMERIC(10,3),
    status                  value_status_t NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rev_report ON report_extracted_values(report_id);
CREATE INDEX idx_rev_param_status ON report_extracted_values(parameter_name, status);

-- ============================================================================
-- PRODUCT CATALOG & NUTRITION
-- ============================================================================

CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    barcode         VARCHAR(64) UNIQUE,
    name            VARCHAR(255) NOT NULL,
    brand           VARCHAR(255),
    category        VARCHAR(100),
    image_url       TEXT,
    description     TEXT,
    source          product_source_t NOT NULL DEFAULT 'USER_SCANNED',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

CREATE TABLE product_nutrition (
    id                  BIGSERIAL PRIMARY KEY,
    product_id          BIGINT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    serving_size        VARCHAR(50),
    calories            NUMERIC(8,2),
    protein_g           NUMERIC(6,2),
    fat_g               NUMERIC(6,2),
    saturated_fat_g     NUMERIC(6,2),
    carbs_g             NUMERIC(6,2),
    sugar_g             NUMERIC(6,2),
    fiber_g             NUMERIC(6,2),
    sodium_mg           NUMERIC(8,2),
    cholesterol_mg      NUMERIC(8,2),
    extra_nutrients     JSONB DEFAULT '{}'::jsonb    -- e.g. vitamins/minerals not modeled explicitly
);
CREATE INDEX idx_nutrition_extra_gin ON product_nutrition USING gin (extra_nutrients);

CREATE TABLE product_ingredients (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(150) NOT NULL,
    position        SMALLINT NOT NULL,       -- order as printed on label
    is_allergen     BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_ingredients_product ON product_ingredients(product_id, position);

-- A user's uploaded photo of a nutrition/ingredients label, working
-- through OCR + LLM extraction the same way medical_reports does —
-- product_id is populated once analysis succeeds and creates the actual
-- product row; reuses processing_status_t rather than a new enum.
CREATE TABLE product_scans (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url           TEXT NOT NULL,
    processing_status   processing_status_t NOT NULL DEFAULT 'PENDING',
    failure_reason      TEXT,
    product_id          BIGINT REFERENCES products(id) ON DELETE SET NULL,
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at        TIMESTAMPTZ
);
CREATE INDEX idx_product_scans_user ON product_scans(user_id, uploaded_at DESC);

-- Personalized scoring: nullable user_id = generic/community score,
-- populated user_id = this user's personalized score for this product.
CREATE TABLE product_scores (
    id                          BIGSERIAL PRIMARY KEY,
    product_id                  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id                     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    suitability_score           SMALLINT CHECK (suitability_score BETWEEN 0 AND 100),
    health_score                SMALLINT CHECK (health_score BETWEEN 0 AND 100),
    nutrition_score             SMALLINT CHECK (nutrition_score BETWEEN 0 AND 100),
    risk_score                  SMALLINT CHECK (risk_score BETWEEN 0 AND 100),
    reasoning                   TEXT,
    recommended_daily_quantity  VARCHAR(50),
    max_daily_quantity          VARCHAR(50),
    computed_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_scores_product_user ON product_scores(product_id, COALESCE(user_id, 0));
CREATE INDEX idx_scores_user ON product_scores(user_id);

CREATE TABLE product_alternatives (
    id                      BIGSERIAL PRIMARY KEY,
    product_id              BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alternative_product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    nutrition_similarity_pct SMALLINT CHECK (nutrition_similarity_pct BETWEEN 0 AND 100),
    taste_similarity_pct     SMALLINT CHECK (taste_similarity_pct BETWEEN 0 AND 100),
    health_score             SMALLINT CHECK (health_score BETWEEN 0 AND 100),
    rank                     SMALLINT NOT NULL DEFAULT 1,
    CHECK (product_id <> alternative_product_id)
);
CREATE INDEX idx_alt_product ON product_alternatives(product_id, rank);

-- ============================================================================
-- COMMUNITY: REVIEWS & RATINGS
-- ============================================================================

CREATE TABLE reviews (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_text     TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_product ON reviews(product_id, created_at DESC);

CREATE TABLE ratings (
    id                      BIGSERIAL PRIMARY KEY,
    product_id              BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    taste_rating            SMALLINT CHECK (taste_rating BETWEEN 1 AND 5),
    healthiness_rating      SMALLINT CHECK (healthiness_rating BETWEEN 1 AND 5),
    digestibility_rating    SMALLINT CHECK (digestibility_rating BETWEEN 1 AND 5),
    satisfaction_rating     SMALLINT CHECK (satisfaction_rating BETWEEN 1 AND 5),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, user_id)
);
CREATE INDEX idx_ratings_product ON ratings(product_id);

-- ============================================================================
-- DIET PLANNER
-- ============================================================================

CREATE TABLE diet_plans (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type       plan_type_t NOT NULL,
    calorie_target  NUMERIC(7,2),
    protein_target  NUMERIC(6,2),
    budget          NUMERIC(10,2),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    status          plan_status_t NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date >= start_date)
);
CREATE INDEX idx_diet_plans_user ON diet_plans(user_id, status);

CREATE TABLE diet_plan_days (
    id              BIGSERIAL PRIMARY KEY,
    diet_plan_id    BIGINT NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    day_number      SMALLINT NOT NULL,
    plan_date       DATE NOT NULL,
    UNIQUE (diet_plan_id, day_number)
);

CREATE TABLE diet_plan_meals (
    id                  BIGSERIAL PRIMARY KEY,
    diet_plan_day_id    BIGINT NOT NULL REFERENCES diet_plan_days(id) ON DELETE CASCADE,
    meal_type           meal_type_t NOT NULL,
    name                VARCHAR(255) NOT NULL,
    calories            NUMERIC(7,2),
    protein_g           NUMERIC(6,2),
    description         TEXT,
    recipe_json         JSONB DEFAULT '{}'::jsonb
);
CREATE INDEX idx_meals_day ON diet_plan_meals(diet_plan_day_id, meal_type);

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================

CREATE TABLE recommendations (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type     recommendation_type_t NOT NULL,
    reference_id            BIGINT NOT NULL,     -- points to products.id, diet_plans.id, etc.
    score                   NUMERIC(5,2),
    reasoning               TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recs_user ON recommendations(user_id, recommendation_type, created_at DESC);

-- Nutrition Twin: Postgres holds the queryable summary AND the full detail
-- (trend series, model outputs) inline as JSONB — no separate document store.
CREATE TABLE nutrition_twin_snapshots (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date               DATE NOT NULL,
    health_trend_summary        TEXT,
    deficiency_trend_summary    TEXT,
    risk_prediction_summary     TEXT,
    detail_json                 JSONB DEFAULT '{}'::jsonb,  -- trendSeries, riskPredictions arrays
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, snapshot_date)
);
CREATE INDEX idx_twin_user ON nutrition_twin_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_twin_detail_gin ON nutrition_twin_snapshots USING gin (detail_json);

-- ============================================================================
-- CHAT / RAG ASSISTANT
-- ============================================================================

CREATE TABLE chat_sessions (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at        TIMESTAMPTZ
);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, started_at DESC);

-- Message body + retrieved RAG context stored inline as JSONB — no separate
-- document store. content is kept as TEXT (queried rarely, never joined on);
-- retrieved_context is JSONB so you can inspect which chunks backed a reply.
CREATE TABLE chat_messages (
    id                  BIGSERIAL PRIMARY KEY,
    session_id          BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role                chat_role_t NOT NULL,
    content             TEXT NOT NULL,
    retrieved_context   JSONB DEFAULT '[]'::jsonb,   -- [{ "source": "...", "score": 0.87 }, ...]
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);

-- RAG knowledge base embeddings (nutrition science corpus, not user data).
-- Dimension is set for the default local embedding model (Ollama
-- nomic-embed-text = 768 dims). If you switch the embedding provider to
-- OpenAI (text-embedding-3-small = 1536 dims), you must ALTER this column
-- and re-embed the corpus — dimensions can't be mixed in one column/index.
CREATE TABLE knowledge_base_chunks (
    id              BIGSERIAL PRIMARY KEY,
    source           VARCHAR(255) NOT NULL,
    content          TEXT NOT NULL,
    embedding        vector(768),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_kb_embedding ON knowledge_base_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- WEARABLE INTEGRATION
-- ============================================================================

CREATE TABLE wearable_connections (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider                wearable_provider_t NOT NULL,
    access_token_encrypted  TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    status                  wearable_status_t NOT NULL DEFAULT 'CONNECTED',
    connected_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider)
);

CREATE TABLE wearable_data (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider                wearable_provider_t NOT NULL,
    data_date               DATE NOT NULL,
    steps                   INTEGER,
    calories_burned         NUMERIC(7,2),
    sleep_minutes           INTEGER,
    resting_heart_rate      SMALLINT,
    synced_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider, data_date)
);
CREATE INDEX idx_wearable_user_date ON wearable_data(user_id, data_date DESC);

-- ============================================================================
-- GROCERY CART ANALYZER
-- ============================================================================

CREATE TABLE grocery_carts (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cart_health_score   SMALLINT CHECK (cart_health_score BETWEEN 0 AND 100),
    uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_carts_user ON grocery_carts(user_id, uploaded_at DESC);

CREATE TABLE grocery_cart_items (
    id              BIGSERIAL PRIMARY KEY,
    cart_id         BIGINT NOT NULL REFERENCES grocery_carts(id) ON DELETE CASCADE,
    product_id      BIGINT REFERENCES products(id),   -- nullable: unmatched/unrecognized item
    raw_item_name   VARCHAR(255) NOT NULL,
    quantity        SMALLINT NOT NULL DEFAULT 1
);
CREATE INDEX idx_cart_items_cart ON grocery_cart_items(cart_id);

-- ============================================================================
-- RESTAURANT MODE
-- ============================================================================

CREATE TABLE restaurant_menus (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_name VARCHAR(255),
    image_url       TEXT,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE restaurant_menu_items (
    id                      BIGSERIAL PRIMARY KEY,
    menu_id                 BIGINT NOT NULL REFERENCES restaurant_menus(id) ON DELETE CASCADE,
    item_name               VARCHAR(255) NOT NULL,
    estimated_calories      NUMERIC(7,2),
    estimated_protein_g     NUMERIC(6,2),
    is_recommended          BOOLEAN NOT NULL DEFAULT FALSE,
    recommendation_reason   TEXT
);
CREATE INDEX idx_menu_items_menu ON restaurant_menu_items(menu_id);

-- ============================================================================
-- NOTIFICATIONS & AUDIT
-- ============================================================================

CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type_t NOT NULL,
    message         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       BIGINT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);

-- ============================================================================
-- SEED DATA (lookup tables)
-- ============================================================================

INSERT INTO roles (name) VALUES ('USER'), ('ADMIN'), ('MODERATOR');

INSERT INTO medical_conditions (code, name) VALUES
    ('DIABETES', 'Diabetes'),
    ('HYPERTENSION', 'Hypertension'),
    ('HEART_DISEASE', 'Heart Disease'),
    ('THYROID_DISORDER', 'Thyroid Disorder'),
    ('PCOS', 'PCOS'),
    ('OBESITY', 'Obesity'),
    ('KIDNEY_DISEASE', 'Kidney Disease'),
    ('FOOD_ALLERGY', 'Food Allergy');

INSERT INTO health_goals (code, name) VALUES
    ('WEIGHT_LOSS', 'Weight Loss'),
    ('FAT_LOSS', 'Fat Loss'),
    ('MUSCLE_GAIN', 'Muscle Gain'),
    ('WEIGHT_GAIN', 'Weight Gain'),
    ('MAINTENANCE', 'Maintenance'),
    ('HEART_HEALTH', 'Better Heart Health'),
    ('BLOOD_SUGAR_CONTROL', 'Better Blood Sugar Control');