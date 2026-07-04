# Handoff: Profile Indexer Backend

## Goal
Move profile purchase history off browser-side historical log scans and onto a backend indexer backed by PostgreSQL, without changing the escrow write flows.

## Status
This work is partially implemented and in a usable local-development state.

Completed:
1. A backend service now exists under `backend/`.
2. PostgreSQL schema, checkpointing, backfill, live polling, and reorg rewind logic are implemented.
3. API endpoints for profile purchases, purchase details, and health checks are implemented.
4. `pages/profile.tsx` now does backend-first reads behind env flags and falls back to the existing on-chain loader.
5. Frontend lint and backend TypeScript build were validated successfully.

Not completed yet:
1. Production deployment.
2. Dockerization.
3. Real RPC keys / production database setup.
4. Production smoke testing against a live Postgres instance.

## Why This Was Built
The original profile page scanned chain history directly from the browser. That approach is unreliable on BSC and Polygon because wide `eth_getLogs` queries hit public RPC range limits, rate limits, and CORS constraints. The backend indexer is the durable fix.

## Current Architecture

### Backend
The backend is a small Node + TypeScript service compiled with `tsc`.

Core behavior:
1. Seed enabled chains into `chains`.
2. Maintain per-chain `sync_checkpoints`.
3. Backfill from each chain deployment block.
4. Poll live blocks up to `head - finality_buffer_blocks`.
5. Persist raw events into `purchase_events` using `(chain_id, tx_hash, log_index)` as the idempotency key.
6. Rebuild affected rows in `purchases` from ordered events.
7. Expose HTTP endpoints for the frontend and operational health.

Tracked lifecycle events are normalized into four stages:
1. `created`
2. `confirmed`
3. `completed`
4. `aborted`

Those stages derive the user-facing purchase states:
1. `awaiting-confirmation`
2. `in-escrow`
3. `completed`
4. `aborted`

### Frontend
The profile page now behaves as follows:
1. If `NEXT_PUBLIC_PROFILE_BACKEND_ENABLED=true` and `NEXT_PUBLIC_PROFILE_BACKEND_URL` is set, it calls the backend first.
2. If that request fails or is disabled, it falls back to `getUserPurchases()` from `lib/functions.ts`.
3. Results are still written into the existing client cache via `setCachedUserPurchases()`.

Escrow transaction flows were intentionally left unchanged.

## Key Files

Backend:
1. `backend/src/main.ts`
   - CLI entrypoint.
   - Supports `migrate`, `backfill`, and `serve`.
2. `backend/src/indexer.ts`
   - Main sync engine.
   - Handles event fetch, normalization, persistence, checkpoint updates, and reorg rewind.
3. `backend/src/purchaseState.ts`
   - Deterministic reducer from ordered lifecycle events to a purchase snapshot.
4. `backend/src/schema.ts`
   - Postgres DDL for `chains`, `purchases`, `purchase_events`, and `sync_checkpoints`.
5. `backend/src/server.ts`
   - HTTP API for profile data, purchase details, and health.
6. `backend/README.md`
   - Current local runbook.

Frontend:
1. `pages/profile.tsx`
   - Backend-first purchase loading with fallback.
2. `lib/functions.ts`
   - Existing on-chain profile loader remains the fallback path.
   - Exposes `setCachedUserPurchases()` for cache hydration.
3. `.env.example`
   - Frontend backend flags.

## Database Model
Tables implemented:
1. `chains`
2. `purchases`
3. `purchase_events`
4. `sync_checkpoints`

Important constraints:
1. Addresses are normalized to lowercase before persistence.
2. `purchase_events` is deduped by `(chain_id, tx_hash, log_index)`.
3. `purchases` is keyed by `(chain_id, purchase_address)`.

## API Surface

### `GET /profile/:wallet/purchases`
Returns purchases for a wallet where it is either buyer or seller.

Supported query params:
1. `category`
2. `status`
3. `chainId`
4. `limit`
5. `cursor`

Notes:
1. Sorting is keyset-based on `updated_at desc, chain_id asc, purchase_address asc`.
2. `role`, `counterparty`, and `action` are derived per requesting wallet.

### `GET /purchases/:purchaseAddress`
Returns a single purchase and its ordered raw event timeline.

Required query param:
1. `chainId`

### `GET /healthz`
Returns per-chain sync status, including lag and consecutive failures.

## Runtime and Commands

### Backend env
Required backend variables are defined in `backend/.env.example`.

Important ones:
1. `PROFILE_INDEXER_DATABASE_URL`
2. `PROFILE_INDEXER_CHAINS`
3. `PROFILE_INDEXER_RPC_URL_ETHEREUM`
4. `PROFILE_INDEXER_RPC_URL_BSC`
5. `PROFILE_INDEXER_RPC_URL_POLYGON`

### Frontend env
Optional frontend flags are in `.env.example`.

Important ones:
1. `NEXT_PUBLIC_PROFILE_BACKEND_ENABLED`
2. `NEXT_PUBLIC_PROFILE_BACKEND_URL`

### Scripts
1. `npm run backend:build`
2. `npm run backend:migrate`
3. `npm run backend:backfill`
4. `npm run backend:serve`
5. `npm run lint`

### Local startup sequence
1. Configure backend `.env` values.
2. Run `npm run backend:migrate`.
3. Run `npm run backend:backfill` until initial data is populated.
4. Run `npm run backend:serve` for continuous sync and API serving.
5. Enable the frontend flags if you want the profile page to read from the backend.

## Validation Already Performed
The latest verified checks were:
1. `npm run backend:build`
2. `npm run lint`

Both passed at the end of the implementation pass.

## Known Gaps and Risks
1. No Docker setup exists yet, even though that is the next expected deployment path.
2. There is no production hosting or Postgres provisioning yet.
3. The backend uses configured RPC URLs directly; real production reliability depends on decent paid RPC endpoints.
4. There is no automated test suite for the new backend logic.
5. Frontend fallback is still present by design, so profile behavior can differ depending on env flags and backend availability.

## Recommended Next Step
The next concrete task should be Dockerizing the backend for a real deployment.

Minimum follow-up scope:
1. Add a backend `Dockerfile`.
2. Add `.dockerignore`.
3. Add `docker-compose.yml` for Postgres + backend.
4. Document container env wiring and persistent volume usage.
5. Validate the container path with `backend:migrate`, `backend:backfill`, and `backend:serve` inside Docker.

## Notes for the Next Engineer
1. Do not remove the frontend fallback until the backend is stable in production.
2. Do not re-open the browser-side historical scan approach for BSC/Polygon as the primary solution.
3. Keep escrow write flows unchanged unless explicitly working on transaction UX or contract integration.
4. If profile data looks wrong, inspect raw rows in `purchase_events` first, then confirm the reducer behavior in `backend/src/purchaseState.ts`, then check checkpoint state.
		}
	]
}
```

#### `GET /healthz`
Purpose: operational visibility for lag and failure state.

Response:

```json
{
	"ok": true,
	"chains": [
		{
			"chainId": 56,
			"lastScannedBlock": 12345678,
			"lastFinalizedBlock": 12345660,
			"headBlock": 12345710,
			"lagBlocks": 32,
			"syncMode": "live",
			"consecutiveFailures": 0,
			"lastError": null,
			"updatedAt": "2026-06-29T12:00:00.000Z"
		}
	]
}
```

### Frontend integration contract
1. Add `NEXT_PUBLIC_PROFILE_BACKEND_ENABLED=true|false`.
2. Add `NEXT_PUBLIC_PROFILE_BACKEND_URL=https://...`.
3. In `pages/profile.tsx`, load cached purchases immediately as today.
4. If backend reads are enabled, request `GET /profile/:wallet/purchases?chainId=<currentChainId>` first.
5. If the backend request fails, times out, or returns non-200, fall back to `getUserPurchases(address, forceRefresh)`.
6. Keep the current local cache writer so backend results also hydrate fast on reload.

### Runbook minimum
1. How to bootstrap the database schema.
2. How to run a one-time backfill per chain.
3. How to start the live poller.
4. How to inspect lag via `/healthz`.
5. How to recover from a bad checkpoint by rewinding a chain and replaying safely.

## Acceptance criteria
1. Profile page loads purchase history without full chain scans in the browser.
2. BSC wallet with known historical purchases returns data consistently.
3. Indexer can restart and resume from checkpoint without duplicates.
4. Lint still passes in frontend.
5. Basic runbook exists describing backfill, live sync, and recovery.

## Suggested session prompt
Please implement a backend indexer and API for profile purchase history, then integrate frontend profile to backend-first reads. Keep escrow write flows untouched. Start by scaffolding backend, defining DB schema, ingesting historical + live events with idempotent checkpoints, and wiring GET /profile/:wallet/purchases into profile page behind a feature flag.
