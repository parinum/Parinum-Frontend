# Profile Indexer Backend

This service backs the profile purchase history page by indexing Parinum escrow events into PostgreSQL.

## Environment

Copy [backend/.env.example](./.env.example) to a local `.env` and set:

- `PROFILE_INDEXER_DATABASE_URL`
- `PROFILE_INDEXER_CHAINS`
- `PROFILE_INDEXER_RPC_URL_*` for each enabled chain

The frontend can optionally point at the backend with:

- `NEXT_PUBLIC_PROFILE_BACKEND_ENABLED=true`
- `NEXT_PUBLIC_PROFILE_BACKEND_URL=http://localhost:4100`

## Cheapest Practical Setup

The cheapest reliable production shape is:

1. One small VPS for the backend process.
2. One low-cost managed Postgres instance.
3. Paid RPC URLs only for the chains you actually enable.

Recommended cost-first layout:

1. Backend on a single small VM or container host.
2. Postgres on Neon, Supabase, or another low-cost managed Postgres provider.
3. Start with `PROFILE_INDEXER_CHAINS=1,56,137` only if you need all three; otherwise enable the fewest chains possible to reduce RPC cost.

This is usually cheaper and simpler than a larger all-in-one host once you account for disk persistence, backups, and restarts.

## Commands

- `npm run backend:build` - compile the backend service.
- `npm run backend:migrate` - create or update the schema.
- `npm run backend:backfill` - run one backfill pass and exit.
- `npm run backend:serve` - migrate, start the API server, and continue live indexing.

## Docker

Local container setup is provided with:

- [backend/Dockerfile](./Dockerfile)
- [docker-compose.yml](../docker-compose.yml)
- [/.dockerignore](../.dockerignore)

Note: the compose file has two modes:

1. Production mode: backend only, reading PROFILE_INDEXER_DATABASE_URL from backend/.env.
2. Local mode: include the bundled postgres service by enabling profile local-db.

Important: the repo depends on the private `@parinum/contracts` package, so Docker builds require SSH forwarding.

Example:

```bash
export DOCKER_BUILDKIT=1
docker compose build --ssh default backend
docker compose run --rm backend node backend/dist/main.js migrate
docker compose run --rm backend node backend/dist/main.js backfill
docker compose up -d backend
```

If you want local Postgres via compose instead of managed Postgres:

```bash
docker compose --profile local-db up -d postgres
```

The compose file mounts no source code and runs the compiled backend image directly.

## Startup Flow

1. Set the environment variables.
2. Run `npm run backend:migrate`.
3. Run `npm run backend:backfill` until the database catches up.
4. Run `npm run backend:serve` for continuous live sync.

Container startup flow:

1. Copy [backend/.env.example](./.env.example) to `backend/.env`.
2. Fill in database URL, RPC URLs, and chain list.
3. Run `docker compose build --ssh default backend`.
4. Run `docker compose run --rm backend node backend/dist/main.js migrate`.
5. Run `docker compose run --rm backend node backend/dist/main.js backfill` until initial history is loaded.
6. Run `docker compose up -d backend`.

Optional local-db path:

1. Set `PROFILE_INDEXER_DATABASE_URL=postgres://postgres:postgres@postgres:5432/parinum_profile`.
2. Run `docker compose --profile local-db up -d postgres`.

## Recovery Flow

If a chain checkpoint becomes inconsistent, the indexer rewinds automatically on the next run using the finality buffer. If you need a manual recovery:

1. Stop the service.
2. Delete the affected chain rows from `purchase_events` and `purchases`, or reset `sync_checkpoints` for that chain.
3. Run `npm run backend:backfill`.
4. Restart `npm run backend:serve`.

## Health Check

`GET /healthz` returns per-chain lag information:

- `lastScannedBlock`
- `lastFinalizedBlock`
- `headBlock`
- `lagBlocks`
- `consecutiveFailures`

Use it to confirm the indexer is catching up and to spot a chain that is failing repeatedly.

## Low-Cost Production Notes

1. Put the backend behind a reverse proxy only if you need TLS on the same machine; otherwise expose it privately and let your frontend call a public HTTPS origin from your hosting platform.
2. Use managed Postgres instead of self-hosting Postgres on the same small VM unless you are optimizing strictly for the absolute lowest monthly cost and are willing to own backups.
3. Prefer one solid paid RPC per enabled chain over many free endpoints; this backend is much cheaper to run than debugging missed historical logs.
4. Keep frontend fallback enabled until production `/healthz` stays healthy for a while.

## DigitalOcean VPS (Cost-First Runbook)

This is a practical low-cost setup for DigitalOcean:

1. Droplet: Basic shared CPU, Ubuntu 24.04, smallest size that handles your chain count.
2. Database: managed Postgres (recommended) or a separate small DB droplet only if you must minimize monthly cost.
3. Keep chain scope narrow at first (enable only the chains you need now).

Suggested starting point:

1. Start with one small backend droplet and managed Postgres.
2. Enable only one chain initially (for example Ethereum) to validate indexing behavior.
3. Add BSC/Polygon once health is stable.

### 1) Provision Infra

1. Create a Droplet in the same region as your Postgres instance.
2. Reserve a static IP for the backend.
3. Add a domain like `profile-api.yourdomain.com` pointing to the static IP.

### 2) Prepare the Droplet

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
	"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
	$(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Re-login once after adding your user to the docker group.

### 3) Deploy the Service

```bash
git clone git@github.com:parinum/parinum-frontend.git
cd parinum-frontend
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

1. Set `PROFILE_INDEXER_DATABASE_URL` to your DigitalOcean managed Postgres URL.
2. Set `PROFILE_INDEXER_DATABASE_SSL=true`.
3. Set `PROFILE_INDEXER_CHAINS` to the smallest needed set first.
4. Set `PROFILE_INDEXER_RPC_URL_*` for each enabled chain.

Then build and start:

```bash
export DOCKER_BUILDKIT=1
docker compose build --ssh default backend
docker compose run --rm backend node backend/dist/main.js migrate
docker compose run --rm backend node backend/dist/main.js backfill
docker compose up -d backend
```

### 4) Put HTTPS In Front (Optional but Recommended)

You can use Caddy or Nginx on the droplet to terminate TLS and proxy to `localhost:4100`.

If you skip reverse proxy, expose port 4100 carefully with firewall rules and use HTTPS elsewhere.

### 5) Wire Frontend

In frontend environment config:

1. `NEXT_PUBLIC_PROFILE_BACKEND_ENABLED=true`
2. `NEXT_PUBLIC_PROFILE_BACKEND_URL=https://profile-api.yourdomain.com`

### 6) Verify and Operate

1. Check `GET /healthz` until lag decreases and failures remain 0.
2. Keep fallback enabled in frontend initially.
3. Set up a daily Postgres backup policy.

### Cost Tips for DigitalOcean

1. Backend compute is usually cheap; RPC and DB are what grow first.
2. Start with one chain and expand only when needed.
3. Keep `PROFILE_INDEXER_BATCH_SIZE` modest to avoid RPC bursts.
4. Use managed Postgres early if uptime matters more than squeezing every dollar.