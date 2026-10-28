# NutrifyAI — Phase 1: Architecture & Database Design

## 1. System overview

NutrifyAI is split into two backend services rather than one monolith, because
the two halves of the problem have genuinely different shapes:

| Concern | Service | Why |
|---|---|---|
| Auth, users, health profiles, products, reviews, diet plans, orchestration | **Core backend** (Spring Boot, Java 21) | Transactional, relational, security-heavy. Java/Spring's ecosystem (Spring Security, JPA, Bean Validation) is the strongest fit. |
| OCR, health report analysis, RAG chatbot, recommendation engine, nutrition twin predictions | **AI/ML service** (Python, FastAPI) | Every AI/ML library that matters (LangChain, scikit-learn, PaddleOCR, OpenAI SDK) is Python-first. Fighting that in Java costs more than it saves. |

The core backend is the system of record and the only service the frontend
talks to directly for CRUD-style operations. It calls the AI service
internally (server-to-server) for anything AI-shaped, and the AI service never
talks to the browser directly. This keeps one JWT/session boundary, one rate
limiter, and one place responsible for authorization — the AI service trusts
requests from the core backend and doesn't re-implement auth.

**One database, not two.** The original spec called for Postgres + MongoDB.
Decision: **Postgres only.** The data that was going to live in Mongo — raw
OCR extractions, chat message context, nutrition-twin detail — is genuinely
document-shaped, but not so unstructured that JSONB columns can't hold it
cleanly (see `schema.sql`: `medical_reports.raw_extraction`,
`chat_messages.retrieved_context`, `nutrition_twin_snapshots.detail_json`).
One database means one connection pool, one backup strategy, one thing to
run locally, and you can still index and query into those JSONB columns with
GIN indexes when you need to. Add Mongo later only if a specific feature's
data actually outgrows this — don't pay the operational cost up front for a
possibility.

**LLM provider: Ollama (local) as the default, OpenAI as a swappable
alternative.** Since you already have Ollama running, the AI service is
built behind a provider abstraction (`app/core/llm_provider.py`) so the chat
model and embedding model are picked by one environment variable, not
hardcoded:

| | Ollama (local, default) | OpenAI (optional) |
|---|---|---|
| Chat model | `llama3.1:8b` (or `qwen2.5:7b`, `mistral` — whatever fits your laptop's RAM) | `gpt-4o` / `gpt-4o-mini` |
| Embeddings | `nomic-embed-text` (768 dims) | `text-embedding-3-small` (1536 dims) |
| Cost | Free, unlimited | Per-token |
| Data | Never leaves your machine | Sent to OpenAI |
| Quality | Good enough for most chat/RAG; noticeably weaker on nuanced multi-condition reasoning ("I have diabetes AND kidney disease, can I eat this?") | Stronger reasoning, worth it specifically for health report analysis and complex nutrition trade-offs |

Honest trade-off, not just a feature list: for a portfolio/learning project,
running fully local is a genuine selling point — health data (reports, chat
history) never leaves the laptop, which is exactly the kind of thing a
"Healthcare Technology Expert" reviewer would want to see you think about.
The real weakness is reasoning quality on compound medical constraints. A
sensible middle ground once Phase 4 is built: default to Ollama everywhere,
but make the health-report-analyzer and diet-planner services able to switch
to OpenAI per-request if you want stronger reasoning for those two specific
features while the general chatbot stays local. That's a config flag, not a
redesign — the abstraction supports it from day one.

**`knowledge_base_chunks.embedding` is `vector(768)`** to match
`nomic-embed-text`, not the `1536` you'd use for OpenAI. If you later switch
the *embedding* provider (not just the chat model), you'll need to `ALTER`
that column and re-embed the corpus — vector dimensions can't be mixed in one
index. Chat model and embedding model can be switched independently.

**Other simplifications from the original spec, already reflected in the
design:**

1. **No separate vector database.** Embeddings live in Postgres via
   `pgvector`. One less moving part; graduate to Qdrant/Pinecone later only
   if the corpus outgrows it.
2. **No message broker yet.** Report/OCR processing runs as an async
   background task (FastAPI `BackgroundTasks`, or Celery+Redis if you want
   retries/observability) rather than Kafka/RabbitMQ.
3. **No API gateway service.** The frontend calls the core backend directly;
   the core backend calls the AI service over the internal Docker network.

## 2. Low-level design

### 2.1 Core backend (Spring Boot) — layering

```
Controller  →  Service  →  Repository  →  Entity
    ↓              ↓
   DTO      (business logic,
 (request/   validation,
 response)   orchestration)
```

- **Controllers**: thin. Bind request DTOs, call one service method, return
  response DTOs. No business logic.
- **Services**: own transactions (`@Transactional`), orchestrate repository
  calls, call the AI service client for AI-shaped work.
- **Repositories**: Spring Data JPA interfaces. No custom SQL unless a query
  genuinely needs it (then `@Query` with JPQL, or a native query for
  Postgres-specific features like `pg_trgm` search).
- **DTOs**: separate request/response DTOs per endpoint, never expose JPA
  entities directly. Validation annotations (`@NotNull`, `@Size`, custom
  validators for things like `weight_kg > 0`) live on request DTOs.
- **Exception handling**: one `@RestControllerAdvice` mapping domain
  exceptions (`ResourceNotFoundException`, `ValidationException`,
  `UnauthorizedException`) to consistent `{ "error": { "code", "message",
  "details" } }` JSON — never leak stack traces.
- **API versioning**: all routes under `/api/v1/...`.
- **Docs**: springdoc-openapi generates Swagger UI at `/swagger-ui.html` from
  the same DTOs/annotations — no separate spec to maintain by hand.

### 2.2 Security design

- **JWT access token** (short-lived, ~15 min) carries `sub` (user id) and
  `roles`. Validated on every request via a `OncePerRequestFilter`.
- **Refresh token** (long-lived, ~30 days), opaque random value, stored
  hashed in `refresh_tokens`, rotated on use, revocable (logout, "log out all
  devices").
- **OAuth2 login** (Google/Apple) via Spring Security's OAuth2 client;
  on first login, upsert a `users` row with `auth_provider` +
  `provider_id`, no password.
- **Password reset**: single-use hashed token in `password_reset_tokens`,
  short expiry (~1 hour), invalidated after use.
- **Authorization**: role-based (`USER`, `ADMIN`, `MODERATOR`) via
  `@PreAuthorize`. Moderators can moderate reviews; admins manage the product
  catalog and lookup tables.
- **Secrets**: DB credentials, JWT signing key, OpenAI key, S3 credentials —
  environment variables injected via Docker Compose secrets / `.env`, never
  committed. Rotate the JWT signing key by supporting two active keys during
  rotation windows (`kid` header).

### 2.3 AI/ML service (FastAPI) — internal structure

```
app/
  api/v1/routers/     # ocr.py, chatbot.py, recommend.py, report_analyzer.py, nutrition_twin.py
  core/               # settings, security (verifies internal service token)
  schemas/            # Pydantic request/response models
  services/           # business logic per feature
  ml/                 # recommendation engine (content-based + collaborative)
  ocr/                # PaddleOCR pipeline wrapper
  rag/                # LangChain chains, retriever, prompt templates
  db/                 # Postgres client (SQLAlchemy/asyncpg)
```

- Every router validates a shared-secret internal token (not the user's JWT)
  so the AI service only ever accepts calls from the core backend, never
  directly from the browser.
- Long-running work (OCR on a multi-page PDF, embedding a large chat corpus)
  runs via `BackgroundTasks`, writing status to `medical_reports
  .processing_status` in Postgres so the frontend can poll or receive a
  webhook/websocket push from the core backend.

### 2.4 Async report-processing flow

1. Frontend uploads report file → core backend streams it to **AWS S3**,
   creates a `medical_reports` row with `status = PENDING`.
2. Core backend calls the AI service (`POST /ocr/analyze-report`) with the S3
   key, gets back a `202 Accepted` immediately, sets `status = PROCESSING`.
3. AI service: downloads from S3 → PaddleOCR extraction → parses parameter
   values → writes the raw OCR output into `medical_reports.raw_extraction`
   (JSONB) → writes structured values into Postgres
   `report_extracted_values` → generates the health summary via the
   configured LLM (Ollama or OpenAI) → calls back the core backend (webhook)
   with `status = COMPLETED` (or `FAILED` + reason).
4. Core backend updates `medical_reports.status`, creates a `notifications`
   row, and the frontend either polls or receives a push.

## 3. Database schema

Full DDL — all tables, enums, constraints, and indexes — is in
**`schema.sql`**. Summary of the design:

### 3.1 PostgreSQL — table groups

| Group | Tables |
|---|---|
| Identity & access | `users`, `roles`, `user_roles`, `refresh_tokens`, `password_reset_tokens` |
| Health profile | `health_profiles`, `medical_conditions`, `user_medical_conditions`, `health_goals`, `user_health_goals`, `allergies`, `user_allergies` |
| Health reports | `medical_reports`, `report_extracted_values` |
| Product catalog | `products`, `product_nutrition`, `product_ingredients`, `product_scores`, `product_alternatives` |
| Community | `reviews`, `ratings` |
| Diet planning | `diet_plans`, `diet_plan_days`, `diet_plan_meals` |
| Recommendations & twin | `recommendations`, `nutrition_twin_snapshots` |
| Chat / RAG | `chat_sessions`, `chat_messages`, `knowledge_base_chunks` |
| Wearables | `wearable_connections`, `wearable_data` |
| Grocery cart | `grocery_carts`, `grocery_cart_items` |
| Restaurant mode | `restaurant_menus`, `restaurant_menu_items` |
| Ops | `notifications`, `audit_log` |

### 3.2 Design notes

- **Lookup tables over free-text enums where the list is user-facing and
  growable** (`medical_conditions`, `health_goals`, `allergies`) — lets you
  add a new condition without a migration, and gives admins a place to manage
  them. **Native Postgres `ENUM` types where the set is fixed and internal**
  (statuses, report types) — cheaper and self-documenting.
- **`product_scores` is per-(product, user)`, nullable user_id`** for a
  generic/community score row, populated `user_id` for a personalized one.
  The partial-unique index (`COALESCE(user_id, 0)`) keeps one row per pair
  without a sentinel table.
- **JSONB used sparingly**: `product_nutrition.extra_nutrients` for the long
  tail of vitamins/minerals you won't always model as columns, and
  `diet_plan_meals.recipe_json` for variable recipe structure — both indexed
  with GIN where they'll be queried, not just stored.
- **`pgvector`** (`knowledge_base_chunks.embedding`) stores embeddings for the
  nutrition-science RAG corpus (this is *not* user data — it's your curated
  knowledge base: dietary guidelines, condition-specific nutrition facts,
  ingredient science). An `ivfflat` cosine-similarity index keeps retrieval
  fast as the corpus grows.
- **Every user-owned table cascades on `users` delete** (`ON DELETE CASCADE`)
  except `audit_log`, which sets `user_id` to `NULL` instead — you want the
  audit trail to survive account deletion.
- **Composite/partial indexes are added where the access pattern is known
  up front** (e.g. `medical_reports(user_id, uploaded_at DESC)` for "show my
  reports, newest first"; `report_extracted_values(parameter_name, status)`
  for "everyone currently vitamin-D deficient").

### 3.3 JSONB shapes (formerly the Mongo collections)

These are the same three documents the Phase 1 draft would have put in
Mongo — now they're JSONB columns on their owning Postgres row instead of
documents in a second database with a pointer between them.

```jsonc
// medical_reports.raw_extraction
{
  "rawText": "...",              // full PaddleOCR output
  "boundingBoxes": [ ... ],      // per-field coordinates, for re-review UI
  "llmSummary": "Vitamin D deficient; LDL cholesterol elevated."
}

// chat_messages.retrieved_context (the RAG context behind an assistant reply)
[
  { "source": "ADA dietary guidelines", "score": 0.87 }
]

// nutrition_twin_snapshots.detail_json
{
  "trendSeries": {
    "ldlCholesterol": [ { "date": "2026-05-01", "value": 142 } ],
    "vitaminD": [ ]
  },
  "riskPredictions": [
    { "metric": "LDL cholesterol", "projectedChangePct": 8.5, "horizonDays": 90,
      "basis": "current dietary pattern, last 30 days of logged meals" }
  ]
}
```

## 4. Folder structure

This is now scaffolded on disk (see the files shared alongside this
document) as:

```
nutrifyai/
├── docker-compose.yml                 # postgres, redis, backend-core, ai-service, frontend
├── .env.example
├── README.md
├── docs/
│   ├── PHASE1_ARCHITECTURE.md
│   └── schema.sql
│
├── frontend/                          # Next.js
│   ├── package.json, tsconfig.json, next.config.mjs, tailwind.config.ts
│   ├── Dockerfile, .env.example
│   └── app/
│       ├── layout.tsx, page.tsx, globals.css   # placeholder shell
│       └── (dashboard/profile/scanner/... added in Phase 3)
│
├── backend-core/                      # Spring Boot
│   ├── pom.xml, Dockerfile, .env.example
│   └── src/main/
│       ├── java/com/nutrifyai/core/
│       │   ├── CoreApplication.java             # real entry point
│       │   └── config/ controller/ service/ repository/ entity/
│       │       dto/{request,response}/ security/ exception/ client/ util/
│       │                                        # empty packages, filled in Phase 2
│       └── resources/application.yml
│
├── ai-service/                         # FastAPI
│   ├── requirements.txt, Dockerfile, .env.example
│   └── app/
│       ├── main.py                              # real entry point, health check
│       ├── core/config.py, llm_provider.py       # real: Ollama/OpenAI abstraction
│       └── api/ schemas/ services/ ml/ ocr/ rag/  # empty packages, filled in Phase 4
│
└── infra/
    └── postgres/init/01-schema.sql     # runs automatically on first `docker compose up`
```

Packages under `backend-core` and `ai-service` are real, empty directories —
no placeholder controllers or fake endpoints. Phase 2 and Phase 4 fill those
in as complete, working vertical slices, per your usual pattern.

## 5. What Phase 2 builds on top of this

Phase 2 (Spring Boot backend) will implement, against this exact schema:
auth (`/api/v1/auth/*`), health profile CRUD, medical report upload +
status polling, and the product/review/rating endpoints — with full
controller → service → repository → DTO code, validation, exception
handling, and Swagger annotations, delivered as complete files.

**Decisions locked in for Phase 1, reflected in the scaffold:**

1. **Postgres only** — Mongo dropped, JSONB columns instead (section 3.3).
2. **BIGSERIAL ids** — simpler joins, adequate for this project's scale.
3. **Ollama as the default LLM/embedding provider**, OpenAI available as a
   drop-in swap via `LLM_PROVIDER` in `ai-service/.env`.
