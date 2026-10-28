# NutrifyAI

AI-powered health & nutrition intelligence platform. See
[`docs/PHASE1_ARCHITECTURE.md`](docs/PHASE1_ARCHITECTURE.md) for the full
architecture and database design.

## Services

| Service | Path | Stack | Port |
|---|---|---|---|
| Frontend | `frontend/` | Next.js, TypeScript, Tailwind | 3000 |
| Core backend | `backend-core/` | Spring Boot, Java 21, PostgreSQL | 8080 |
| AI/ML service | `ai-service/` | Python, FastAPI, LangChain | 8000 |
| Database | — | PostgreSQL (+ pgvector) | 5432 |
| Cache | — | Redis | 6379 |

## Prerequisites

- Docker + Docker Compose
- An LLM provider for the AI service — pick one:
  - **Ollama** (free, self-hosted, default): [install it](https://ollama.com), then pull:
    ```
    ollama pull llama3.1:8b
    ollama pull nomic-embed-text
    ```
  - **Groq** (free hosted tier, faster + better quality than a small local model): grab a free key at
    [console.groq.com/keys](https://console.groq.com/keys), set `LLM_PROVIDER=groq` and `GROQ_API_KEY` in
    `ai-service/.env`. Embeddings still use Ollama's `nomic-embed-text` either way (Groq has no embeddings
    endpoint), so pull that model regardless of which chat provider you pick.
  - **OpenAI** (paid, optional): set `LLM_PROVIDER=openai` and `OPENAI_API_KEY`.

## First-time setup

```bash
cp .env.example .env
cp backend-core/.env.example backend-core/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env

docker compose up --build
```

- Postgres schema is applied automatically on first boot from
  `infra/postgres/init/01-schema.sql`.
- Seed a small starter knowledge base for the RAG chatbot (one-time, run after the stack is up):
  ```
  docker compose exec ai-service python -m app.rag.seed_kb
  ```
- Backend Swagger UI: http://localhost:8080/swagger-ui.html
- AI service health check: http://localhost:8000/health
- Frontend: http://localhost:3000

## Current status

- **Phase 1** (architecture + database design) — done.
- **Phase 2** (Spring Boot backend) — done: auth, health profile, medical
  report upload/status, products/reviews/ratings, chat sessions/messages.
- **Phase 3** (Next.js frontend) — done for everything Phase 2 covers,
  plus the chat UI: login/register, dashboard, profile, report
  upload+status polling, product browse/search/detail with reviews and
  ratings, and the nutrition assistant chat.
- **Phase 4** (AI services) — done: OCR pipeline (PaddleOCR), LLM-structured
  report analysis, and the RAG chatbot, all behind the Ollama/Groq/OpenAI
  provider switch.
- **Phase 5** (recommendation engine) — done:
  - Content-based alternative products (nutrition similarity via cosine
    similarity, taste similarity as an ingredient-overlap proxy).
  - **Personalized product scoring** — suitability/health/nutrition/risk
    scores computed per (user, product) by an explicit, inspectable rules
    engine that reasons over the user's actual conditions, goals,
    allergies, and dietary preference (e.g. high sodium + hypertension,
    allergen conflicts, protein density vs. a muscle-gain goal). Shown on
    every product page once you have a health profile.
  - **People Like You** — collaborative filtering based on shared health
    profile attributes (conditions, goals, age, activity level) rather
    than sparse rating overlap, since that's the stronger signal at this
    data scale. Shown on the dashboard.
  - Nutrition Twin — deterministic linear-trend projection from report
    history (not LLM-narrated, on purpose).
  - Honest scope note: none of the scoring above is a validated clinical
    tool — it's a transparent heuristic, and every screen that shows it
    says so.
- **Phase 6** (deployment) — done: production Docker Compose (only nginx
  publishes ports — everything else stays internal, since the frontend's
  BFF layer is the only thing that needs to reach backend-core/ai-service),
  nginx + Let's Encrypt, hardened non-root Dockerfiles, a basic CI build
  check, and a full deployment walkthrough at
  [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — including the gaps a real
  production deployment would still need (no test suite, no
  multi-instance failover, no metrics/alerting), named explicitly rather
  than glossed over.
