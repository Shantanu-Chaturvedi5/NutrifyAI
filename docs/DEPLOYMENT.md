# NutrifyAI — Deployment Guide

This walks through deploying the stack to a single VPS with Docker
Compose. It's sized for a portfolio/demo deployment, not for handling
real production traffic at scale — see "Known gaps" at the end for what
that would additionally need.

## 1. Pick hosting

A small VPS is enough — nothing here needs a GPU:

- **If `LLM_PROVIDER=groq`** (recommended for a public deployment — see
  the reasoning in `ai-service/.env.production.example` and the earlier
  architecture discussion): any small VPS works. 2 vCPU / 4GB RAM
  (e.g. Hetzner CX22, DigitalOcean's basic droplet) is comfortable —
  PaddleOCR's model loading is the main memory user, not the LLM calls.
- **If `LLM_PROVIDER=ollama`**: you're running the model on the VPS
  itself now (not your laptop), so budget accordingly — an 8B model
  wants at least 8GB RAM and responses will be slow on CPU-only
  hardware. This is the honest tradeoff from the earlier discussion:
  free-and-self-hosted gets more expensive as soon as "self" means "a
  server," not your own machine.

You'll also need a domain name pointed at the server (an A record to its
IP) — Let's Encrypt won't issue a cert for a bare IP address.

## 2. Server prep

```bash
# Docker + Compose plugin (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in for the group change to take effect

sudo apt-get install -y docker-compose-plugin
```

Open ports 80 and 443 in whatever firewall/security-group sits in front
of the server. Nothing else needs to be open — see the nginx config's
comment on why only it is published.

## 3. Get the code and secrets onto the server

```bash
git clone <your-repo-url> nutrifyai
cd nutrifyai

cp .env.production.example .env.production
cp backend-core/.env.production.example backend-core/.env.production
cp ai-service/.env.production.example ai-service/.env.production
cp frontend/.env.production.example frontend/.env.production
```

Fill in every blank value. Generate strong secrets with:

```bash
openssl rand -base64 48
```

`JWT_SECRET` and `AI_SERVICE_INTERNAL_TOKEN` each need one — the latter
must be **identical** in `backend-core/.env.production` and
`ai-service/.env.production`, since it's how they authenticate to each
other.

Replace `YOUR_DOMAIN` in both `infra/nginx/nginx.conf` and
`infra/nginx/nginx.bootstrap.conf` with your real domain.

## 4. First-time TLS certificate

One thing to flag up front: Docker Compose only auto-loads a file named
exactly `.env` for variable substitution — since production secrets live
in `.env.production` instead (kept deliberately separate from dev), every
command below needs `--env-file .env.production` explicitly. Save
yourself the repetition:

```bash
alias dc='docker compose -f docker-compose.prod.yml --env-file .env.production'
```

(add that to `.bashrc` on the server if you'll be running these commands
more than once.)

Chicken-and-egg problem: the real nginx config references a certificate
that doesn't exist yet, so nginx won't start with it on a fresh server.
Bootstrap with the HTTP-only config first:

```bash
# Boot everything except nginx/certbot, plus nginx with the bootstrap config
dc up -d postgres redis backend-core ai-service frontend

docker run --rm \
  -v nutrifyai_certbot_www:/var/www/certbot \
  -v "$(pwd)/infra/nginx/nginx.bootstrap.conf:/etc/nginx/nginx.conf:ro" \
  -p 80:80 --name bootstrap-nginx --network nutrifyai_default \
  nginx:1.27-alpine

# In another shell, issue the cert (webroot mode, matches the bootstrap config)
docker run --rm \
  -v nutrifyai_certbot_www:/var/www/certbot \
  -v nutrifyai_certbot_certs:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d YOUR_DOMAIN --email you@example.com --agree-tos --no-eff-email

# Stop the bootstrap container, then start the real stack
docker stop bootstrap-nginx
dc up -d
```

From here, the `certbot` service in `docker-compose.prod.yml` handles
renewal automatically — it's a no-op until the cert is actually close to
expiring.

## 5. Seed the knowledge base

One-time, same as local dev:

```bash
dc exec ai-service python -m app.rag.seed_kb
```

## 6. Verify

- `https://YOUR_DOMAIN` should load the landing page.
- `dc logs -f` to watch all services.
- Register an account, fill in a health profile, and check a product page —
  that exercises the frontend → backend-core → ai-service chain end to end.

## 7. Backups

Postgres holds everything except uploaded files (those are in S3
already). A daily dump is enough for a project this size:

```bash
# Add to crontab -e — note the full --env-file path since cron doesn't
# read your shell aliases
0 3 * * * cd /path/to/nutrifyai && docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  pg_dump -U nutrifyai nutrifyai | gzip > /path/to/backups/nutrifyai-$(date +\%F).sql.gz
```

Prune old backups however you're comfortable with (a simple `find
... -mtime +30 -delete` is enough to start).

## 8. Updating / redeploying

```bash
cd nutrifyai
git pull
dc build
dc up -d
```

Compose only recreates containers whose image actually changed, so this
is safe to run even when only one service was touched.

**Rollback**: `git checkout <previous-commit>` and repeat the build/up
steps. There's no blue-green or zero-downtime story here — a rebuild
causes a few seconds of downtime per service. Fine for this project's
scale; see "Known gaps" for what real zero-downtime deploys would need.

## 9. Monitoring, the honest version

There's no metrics/alerting stack here. What you actually get:
`docker compose logs -f <service>` for live logs, and `docker stats` for
a quick resource check. That's adequate for knowing whether the thing is
up, not for diagnosing subtle production issues — see below.

## Known gaps (what real production scale would additionally need)

Named directly rather than left implicit:

- **No automated tests.** CI (`.github/workflows/ci.yml`) only verifies
  the code builds/imports — there's no test suite behind that. Adding
  one (JUnit + Testcontainers for backend-core, pytest for ai-service,
  Playwright for the frontend) is the single highest-value next step if
  this goes anywhere beyond a portfolio piece.
- **Single VPS, single point of failure.** No load balancing, no
  multi-instance failover. A managed Postgres (RDS, Cloud SQL) and a
  container orchestrator (ECS, k8s) would be the natural next step for
  real traffic.
- **No structured logging/metrics/alerting.** Adding something like
  Prometheus + Grafana, or a hosted option (Better Stack, Grafana Cloud),
  is what turns "docker compose logs" into an actual observability story.
- **No CDN.** Static assets and images currently go straight through
  nginx; fine at low traffic, a CDN (Cloudflare in front of the domain is
  the easiest option) helps once traffic grows.
- **No rate limiting.** Redis is already in the stack and unused for
  this — a simple token-bucket limiter in front of auth and chat
  endpoints would be a reasonable addition before opening this up
  publicly at any scale.
- **Zero-downtime deploys.** Would need either a blue-green setup (two
  nginx upstreams, swap traffic after health-checking the new one) or
  moving to an orchestrator that does rolling updates natively.
