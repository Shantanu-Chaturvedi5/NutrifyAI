# Nouriq — Deployment Guide

This walks through deploying the stack to a single VPS with Docker
Compose. It's sized for a portfolio/demo deployment, not for handling
real production traffic at scale — see "Known gaps" at the end for what
that would additionally need.

## 1. Pick hosting

A small VPS is enough — nothing here needs a GPU:

- **If `LLM_PROVIDER=groq`** (recommended for a public deployment — see
  the reasoning in `ai-service/.env.production.example` and the earlier
  architecture discussion): budget for at least 2 vCPU / 8GB RAM plus
  4GB of host swap. The AI container can use up to 6GB RAM and 2GB swap
  during PaddleOCR analysis; the database, backend, frontend, and host
  also need memory. A 4GB server is not sufficient for the full stack.
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

For an 8GB demo server, a 4GB swap file provides a slower memory-pressure
buffer for OCR without adding another cloud volume:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
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

For `POSTGRES_PASSWORD`, use a URL-safe hex value instead:

```bash
openssl rand -hex 32
```

The password is embedded in the AI service's PostgreSQL connection URL,
so base64 characters such as `+`, `/`, and `=` must not be used there.
`JWT_SECRET` and `AI_SERVICE_INTERNAL_TOKEN` each need a strong random
value — the latter must be **identical** in
`backend-core/.env.production` and `ai-service/.env.production`, since
it's how they authenticate to each other.

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

### Temporary HTTPS demo without a domain

For a no-domain demo, use the Cloudflare Quick Tunnel override instead of
the nginx/certbot steps above. It routes HTTPS traffic to the frontend
over an outbound tunnel, so no inbound ports or DNS records are needed:

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.tunnel.yml \
  --env-file .env.production up -d --build

docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.tunnel.yml \
  --env-file .env.production logs -f cloudflared
```

Open the `trycloudflare.com` URL printed in the tunnel logs. This URL is
temporary and can change when the tunnel restarts; Quick Tunnels have no
availability guarantee and are for demos, not production. Do not enter
real or sensitive health information on a public demo.

### Stable free hostname with daily EC2 start/stop

To keep one URL without buying a domain, register a free hostname at
[DuckDNS](https://www.duckdns.org/). A small updater container keeps its
IPv4 record pointed at the instance's current public IP; Caddy provides
HTTPS certificates automatically and reverse-proxies to the frontend.
The hostname stays the same when EC2 stops and starts, although the site
is unavailable while the instance is stopped and DNS may take a few
minutes to catch up after startup.

1. Register a DuckDNS account and create a subdomain, for example
   `nutrifyai-demo.duckdns.org`. Keep the account token private.
2. In the EC2 security group, allow inbound TCP ports 80 and 443 from
   `0.0.0.0/0`. Keep SSH restricted to your own IP.
3. Add these values to the root `.env.production` on EC2. Do not commit
   or share the token:

   ```dotenv
   APP_DOMAIN=nutrifyai-demo.duckdns.org
   DUCKDNS_SUBDOMAIN=nutrifyai-demo
   DUCKDNS_TOKEN=your-private-duckdns-token
   ```

4. Stop and remove the old Quick Tunnel container, then start the
   stable-hostname stack:

   ```bash
   cd ~/nutrifyai
   sudo docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml \
     --env-file .env.production stop cloudflared
   sudo docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml \
     --env-file .env.production rm -f cloudflared
   sudo docker compose -f docker-compose.prod.yml -f docker-compose.ddns.yml \
     --env-file .env.production up -d --build
   ```

   Removing the tunnel container does not delete database data or volumes.
   Do not use `down -v`.
5. After Caddy has obtained its first certificate, open
   `https://nutrifyai-demo.duckdns.org`. Check
   `sudo docker compose -f docker-compose.prod.yml -f docker-compose.ddns.yml \
   --env-file .env.production logs --tail=80 caddy duckdns` if DNS or
   certificate issuance is not ready yet.

The hostname and TLS certificate persist across EC2 stop/start cycles.
The instance's public IPv4 can change, so the updater refreshes DuckDNS
while the instance is running. No Elastic IP is required. AWS hosting,
storage, and public IPv4 usage are not guaranteed to remain free after
credits are exhausted.

### Daily 10:00–19:00 IST EC2 schedule

After confirming the stable hostname works, create two daily schedules in
**Amazon EventBridge → Scheduler** in `us-east-1`. Select `Asia/Kolkata`,
disable the flexible time window, target the EC2 SDK actions below, and
provide your instance ID in each target input. Let the wizard create the
execution role if offered:

| Schedule | Cron expression | EC2 action |
|---|---|---|
| Start daily | `cron(0 10 * * ? *)` | `StartInstances` |
| Stop daily | `cron(0 19 * * ? *)` | `StopInstances` |

Use input `{"InstanceIds":["i-your-instance-id"]}` for both schedules.
The first start runs at the next scheduled 10:00 occurrence. The site
usually needs a few minutes after EC2 starts before it is reachable.
The EC2 compute portion is stopped outside this nine-hour window, but
persistent disk and other AWS resources may continue to incur charges.

## 5. Seed the product catalog and knowledge base

The schema starts empty. Seed the product catalog once so the products
page has items and category filters:

```bash
dc exec -T ai-service python -m app.catalog.seed_products
dc exec -T ai-service python -m app.catalog.seed_fresh_produce
```

The catalog seeder fetches a curated set from Open Food Facts, so it needs
outbound internet access. It is safe to rerun: barcode duplicates are
skipped, and fresh produce is deduplicated by name. Then seed the knowledge
base once, as in local development:

```bash
dc exec -T ai-service python -m app.rag.seed_kb
```

## 6. Verify

- `https://YOUR_DOMAIN` or your stable DuckDNS hostname should load the landing page, or use the
  `trycloudflare.com` URL from `cloudflared` logs for a temporary demo.
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

For the temporary tunnel setup, include `-f docker-compose.tunnel.yml`
in both Compose commands.

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
