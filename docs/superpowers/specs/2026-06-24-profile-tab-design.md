# Profile Tab — Design Spec

**Date:** 2026-06-24
**Status:** Approved for planning
**Author:** brainstorming session

## Goal

Add a **Profile** tab that shows the connected wallet's escrow purchases, split
into **Ongoing** and **History**, with a contextual action (Confirm / Release /
Abort) available directly from each ongoing purchase.

Scope is **purchases only** — no PRM / staking / governance / wallet-summary
content. The "Coming Soon" product surfaces are explicitly out of scope.

## Background / constraints

- The escrow flow uses a factory + per-deal clone pattern. Every deal emits
  `CreatedPurchase(buyer, seller, price, collateral, tokenAddress, purchaseId)`
  from the factory, with `buyer`, `seller`, and `purchaseId` **indexed**.
- Lifecycle events (all carry `purchaseId` and an indexed party address):
  - `BuyerUnresolvedPurchase(buyer, purchaseId, ethValue)` — fires when the
    seller confirms (clone enters state `2 confirmed`).
  - `SellerUnresolvedPurchase(seller, purchaseId, ethValue)` — same moment.
  - `BuyerCompletedPurchase(buyer, purchaseId, ethValue)` — fires on release.
  - `SellerCompletedPurchase(seller, purchaseId, ethValue)` — same moment.
- **Abort emits no event.** A purchase created then aborted moves the clone to
  state `3 failed` with no log, so abort can only be detected by reading the
  clone's `state()`.
- The factory exposes **no view function** enumerating a user's purchases
  (only `getPurchaseClone`, `getVolumeTransacted`, etc.). Event scanning is the
  only practical data source.
- Reads use the existing resilient JSON-RPC layer in `lib/functions.ts`
  (`initProvider`, chunked `queryFilter`). Writes go through the wallet signer.
- Clone state machine: `0 inactive → 1 created → 2 confirmed → 3 failed`.
- Action preconditions (already enforced in `lib/functions.ts`):
  - `confirmPurchase` — seller only, state must be `1`.
  - `releasePurchase` — buyer only, state must be `2`.
  - `abortPurchase` — buyer only, state must be `1`.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Content | Purchases only |
| Per-purchase capability | Act directly (contextual button) + view on explorer |
| Ongoing vs History layout | Segmented toggle (`Ongoing | History`), default Ongoing, with counts |
| Chain scope | **Currently connected chain only** (a chain switch re-scans) |

## Architecture

Three units, each independently understandable and testable:

### 1. Shared scan helper (`lib/functions.ts`)

Extract the chunked event-scan logic currently inlined in `getPurchaseLogs`
into a reusable helper so both functions share one implementation:

```
scanFactoryEvents(factory, filter, fromBlock, toBlock): Promise<EventLog[]>
```

- 800-block chunks, batched 5 at a time, per-chunk try/catch (identical
  behavior to today's `getPurchaseLogs` scan).
- `getPurchaseLogs` is refactored to call this helper. **No change to its
  return shape or to the `/logs-purchase` page** — purely an internal extract
  to avoid duplicating the batching logic.

### 2. Data function (`lib/functions.ts`)

New public function:

```ts
export interface UserPurchase {
  purchaseId: string            // clone contract address
  role: 'buyer' | 'seller'      // viewer's role in this deal
  counterparty: string          // the other party's address
  price: string                 // formatted, in `symbol`
  collateral: string            // formatted, in `symbol`
  tokenAddress: string
  symbol: string                // native symbol or ERC-20 ticker
  status: 'awaiting-confirmation' | 'in-escrow' | 'completed' | 'aborted'
  category: 'ongoing' | 'history'
  action: 'confirm' | 'release' | 'abort' | null  // contextual next action for viewer
  createdAt: Date
  updatedAt: Date               // timestamp of latest known event
  txHash: string                // most relevant tx (creation or completion)
}

export const getUserPurchases = async (wallet: string): Promise<UserPurchase[]>
```

Algorithm:

1. Resolve chain context (current connected chain). If no factory config, return `[]`.
2. Scan from `config.deploymentBlock` to head:
   - `CreatedPurchase(wallet)` (buyer side) and `CreatedPurchase(null, wallet)`
     (seller side) → seed one record per `purchaseId` with role, counterparty,
     price, collateral, token, `createdAt`, creation `txHash`.
   - The 4 lifecycle events filtered by `wallet` → mark which `purchaseId`s
     reached confirmed and/or completed, capturing `updatedAt` / completion tx.
3. Classify each grouped purchase:
   - has a Completed event → `status: 'completed'`, `category: 'history'`.
   - has Unresolved but no Completed → `status: 'in-escrow'`, `category: 'ongoing'`.
   - Created only (no Unresolved/Completed) → read the clone's `state()`:
     - `1` → `awaiting-confirmation` / `ongoing`
     - `3` → `aborted` / `history`
     - `0`/other → treat as `aborted` / `history` (defensive; shouldn't occur).
     This per-clone read happens **only** for Created-only purchases (few).
4. Compute `action` from role + status:
   - seller + `awaiting-confirmation` → `confirm`
   - buyer + `awaiting-confirmation` → `abort`
   - buyer + `in-escrow` → `release`
   - otherwise → `null` (seller waiting on buyer, or terminal).
5. Token metadata: collect distinct `tokenAddress`es; for native use
   `config.nativeSymbol` + 18 decimals; for ERC-20 fetch `decimals`/`symbol`
   once each (mirrors `getPurchaseDetails`), then format amounts.
6. Sort by `updatedAt` desc. Return.

Errors follow the existing pattern: log and return `[]` (the page renders an
empty/error state) rather than throwing.

In-session cache keyed by `chainId + wallet` so re-opening the tab is instant;
the manual Refresh button bypasses it.

### 3. Profile page (`pages/profile.tsx`) + nav

- Uses `useAccount()` for the address and `useChainId()` for chain; calls
  `getUserPurchases(address)` in an effect when both are present.
- **Disconnected** → centered prompt + wallet connect button.
- **Connected, loading** → spinner + explanatory copy (scan can take a while on
  mainnet, same constraint as `/logs-purchase`).
- **Connected, loaded** →
  - Header: truncated address + chain name + Refresh button.
  - Segmented `Ongoing | History` toggle with counts; default Ongoing.
  - List of `ProfilePurchaseCard`s for the active category.
  - Empty state per category ("No ongoing purchases", etc.).
- `components/ProfilePurchaseCard.tsx` (new): role badge, status badge,
  counterparty (truncated), price/collateral + symbol, date, contextual action
  button (links to the matching action page with the clone prefilled), and
  "View on {explorer}" link. Styling reuses existing CSS-variable + slate
  gradient + framer-motion conventions from `purchases.tsx` / `logs-purchase.tsx`.
- `NavBar.tsx`: add `{ name: 'Profile', href: '/profile' }` to **both** the
  desktop `navigation` array and the mobile menu (same array drives both).

### 4. Deep-link prefill (confirm / release / abort pages)

Each of `pages/confirm-purchase.tsx`, `release-purchase.tsx`,
`abort-purchase.tsx` currently initializes `purchaseId` as `useState('')`. Add:

```ts
const router = useRouter()
useEffect(() => {
  const id = router.query.id
  if (typeof id === 'string' && id) setPurchaseId(id)
}, [router.query.id])
```

Profile action buttons link to `/confirm-purchase?id=0x…` etc. (Auto-running the
details lookup on prefill is optional polish; default is prefill-only so the user
clicks the existing button — keeps the change minimal and the action pages'
flow unchanged.)

## Data flow

```
profile.tsx
  └─ getUserPurchases(wallet)            [current chain]
       ├─ scanFactoryEvents(CreatedPurchase by buyer / by seller)
       ├─ scanFactoryEvents(4 lifecycle events by wallet)
       ├─ clone.state() reads (Created-only purchases)
       └─ token metadata (distinct ERC-20s)
  └─ render: toggle → ProfilePurchaseCard[]
       └─ action button → /{confirm|release|abort}-purchase?id=<purchaseId>
            └─ useEffect prefills purchaseId from router.query.id
```

## Error handling

- No wallet / no factory config → empty/disconnected UI, no throw.
- Per-chunk scan failures are swallowed per range (existing behavior); partial
  results still render.
- `state()` read failure for a Created-only purchase → treat as `aborted`
  (history) defensively and continue.
- Token metadata failure → fall back to 18 decimals and a generic symbol
  (mirrors `getPurchaseDetails`).

## Testing

No test framework is configured in this repo (per CLAUDE.md), so verification is
manual:

- `npm run lint` and `npm run build` (static export) must pass.
- Manual: connect a wallet on a chain with known deals; confirm Ongoing vs
  History split, role/counterparty/amount correctness, and that each action
  button lands on the right page with the clone prefilled.
- Disconnected and empty-wallet states render correctly.
- Chain switch re-scans.

## Out of scope / non-goals

- Multi-chain aggregation (current chain only).
- PRM / staking / governance / wallet-summary content.
- Any new test framework.
- Changing the existing `/logs-purchase` UI or `getPurchaseLogs` return shape.
- Auto-submitting actions from Profile (Profile prefills; the user confirms on
  the action page).

## Known limitations

- Initial scan can be slow on chains with a low `deploymentBlock` / many blocks
  (inherent to event scanning; mitigated by in-session cache + Refresh). Same
  limitation the logs page already has.
- Purchases on other chains are not shown until the user switches to that chain.
