# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`parinum-frontend` is the web3 dApp UI for **Parinum**, a multi-chain protocol with three product surfaces:

1. **Escrow ("purchase") flow** — the core live feature. A buyer locks funds + collateral in a per-deal clone contract; a seller confirms with their own collateral; the buyer then releases or aborts. Works on every supported chain.
2. **PRM token ICO ("PRM funding")** — live, but **hardcoded to Ethereum mainnet** (`FUNDING_CHAIN_ID = 1` in `pages/prm-funding.tsx`) regardless of the connected wallet chain.
3. **Staking / Governance / Dividends** — **fully implemented in `lib/functions.ts` but the UI pages are intentionally "Coming Soon" placeholders** (`pages/stake-dashboard.tsx`, `pages/governance.tsx`, `pages/withdraw-dividend.tsx`). They are gated off until the ICO ends. Don't assume these pages are wired up just because the contract functions exist.

It is a **Next.js Pages Router app exported as a static site** (`output: 'export'`) and deployed to GitHub Pages at `app.parinum.com` (`CNAME`) via `.github/workflows/deploy.yml` on push to `main`.

## Commands

```bash
npm run dev      # local dev server (next dev)
npm run build    # production build -> static export into ./out
npm run start    # serve a built app
npm run lint     # next lint (eslint: next/core-web-vitals)
```

- **No test framework is configured** — there are no tests, no `test` script, and no test runner. Don't invent one unless asked.
- **`npm install` requires SSH access to a private GitHub repo.** The contracts package `@parinum/contracts` is a git dependency (`github:parinum/Parinum-Upgradeable#main`); CI pulls it with `secrets.PARINUM_SSH_KEY`. Installs fail without that access.
- `inspect_abi.ts` (repo root) is a standalone dev script (run with `tsx`/`ts-node`) that dumps event topic hashes from the contracts package. It is **not** part of the app bundle.
- Required public env var: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (see `.env.example`). Without it, WalletConnect/Rainbow/Trust/Ledger/OKX wallets are hidden but injected wallets (MetaMask/Coinbase/Brave/Phantom/Argent) still work.

## Architecture

### Two separate web3 stacks — reads and writes use different mechanisms

This is the most important thing to understand before touching contract logic:

- **wagmi v2 + viem + RainbowKit** (`lib/wagmiConfig.ts`, providers in `pages/_app.tsx`) handle **wallet connection and chain awareness only**. Pages use `useChainId`, `useAccount`, `useSwitchChain` from wagmi. The connector config only declares `mainnet`, `bsc`, `polygon` as chains.
- **ethers v6** (`lib/functions.ts`) performs **all actual contract reads and writes.** It bridges from wagmi inside `initProvider()`: it pulls the connected wallet client via `getConnectorClient(config)` and wraps it in an `ethers.BrowserProvider` + `JsonRpcSigner`; if no wallet is connected it falls back to `getPublicClient(config)` for read-only access.
- **Reads do not use ethers' provider at all in the hot paths.** `lib/functions.ts` has its own raw JSON-RPC layer: `rpcRequestWithFallback()` races several RPC endpoints, caches the winning URL per chain (`preferredRpcUrlByChain`), with a 2.5s per-request timeout. `readCache` is an in-memory TTL cache (~45s) for ICO/account/voting reads. Mainnet RPC URLs are a hardcoded public list plus env overrides (`NEXT_PUBLIC_ETHEREUM_RPC_URL`, `NEXT_PUBLIC_MAINNET_RPC_URL`, `NEXT_PUBLIC_RPC_URL`).

So: **writes go through the wallet (ethers signer); reads go through a custom resilient fetch-based RPC layer.** Don't assume one shared provider.

### `lib/parinum.ts` — the multi-chain registry

`parinumNetworks` maps `chainId -> { factoryAbi, cloneAbi, factoryAddress, cloneAddress, nativeSymbol, deploymentBlock, envKey }`. ABIs are **per-chain TypeChain factories** from `@parinum/contracts` (e.g. `ParinumCloneEthereum__factory`, `ParinumFactoryBSC__factory`). Supports 8 mainnets (Ethereum, BSC, Arbitrum, Base, Polygon, Linea, Optimism, Unichain) **plus matching local Hardhat fork chain IDs (31337–31346)** that reuse mainnet ABIs/addresses for local testing.

Address resolution is **three-layered** (see `getParinumNetworkConfig` / `getEnvAddressOverride` / `getCoreAddresses`):
1. `NEXT_PUBLIC_PARINUM_*` env override (by chainId, by `envKey`, or generic), then
2. `lib/deploymentAddresses.json`, then
3. fallback to Ethereum (chain 1).

`getCoreContractAddresses` pulls the singleton contracts (`PRMICO`, `PRM`, `RewardsPool`, `Governor`, `Timelock`) from the same JSON.

### Escrow flow (`lib/functions.ts` + purchase pages)

Factory/clone pattern: `createPurchase()` calls `factory.createContract()` to deploy a minimal clone, parses the `CreatedContract`/`CreatedPurchase` event for the clone address, then calls `createPurchase(seller, price, collateral, token)` on the clone — sending native value, or doing an ERC-20 `approve` first for token deals.

Clone state machine: `0 inactive -> 1 created -> 2 confirmed -> 3 failed`. The lib functions enforce role + state preconditions **client-side before sending**:
- `confirmPurchase` — seller only, state must be `1`
- `releasePurchase` — buyer only, state must be `2`
- `abortPurchase` — buyer only, state must be `1`

`getPurchaseLogs()` scans factory events from the chain's `deploymentBlock` to head in **800-block chunks, batched 5 at a time** (RPC block-range limits). UI lives in `components/PurchaseFlowViews.tsx` (multi-step views) and `components/PurchaseGuideDeck.tsx` (walkthrough); pages are `create/confirm/release/abort/logs-purchase.tsx`, `purchases.tsx`, `dashboard.tsx`.

### Theming

Custom `components/ThemeProvider.tsx` (light/dark/system, persisted to `localStorage['parinum-theme']`) sets `data-theme` on `<html>`/`<body>`. Tailwind is wired to this with `darkMode: ['selector', '[data-theme="dark"]']`. Many components style via **CSS variables** defined in `styles/globals.css` (e.g. `var(--bg-1)`, `var(--navbar-bg)`) rather than only Tailwind color classes. RainbowKit and react-hot-toast themes are derived from `resolvedTheme` in `_app.tsx`.

### Static-export constraints (`output: 'export'`)

No SSR / API routes / middleware / server image optimization. Consequences already handled in the codebase, keep them in mind:
- Client-only components are loaded with `next/dynamic` + `ssr: false` (e.g. `BackgroundParinumIcons` in `Layout.tsx`).
- `next.config.js` sets webpack `resolve.fallback` to disable `fs/net/tls` and stubs `@react-native-async-storage/async-storage`; `transpilePackages` includes `@rainbow-me/rainbowkit` and `@parinum/contracts`.
- SVGs are imported as modules (declared in `types/global.d.ts`); `images.unoptimized: true`.
- Path alias `@/*` -> `./*` (note: code lives at repo root — `pages/`, `components/`, `lib/` — there is no `src/`).

## Conventions / gotchas

- Contract-call functions in `lib/functions.ts` return a `{ success, txHash?, error?, purchaseId? }` (`TransactionResult`) shape rather than throwing; pages surface `error`/`txHash` to the user (often via `react-hot-toast`). Preserve that pattern.
- `purchaseId` on `TransactionResult` is overloaded — it carries a proposal id from governance functions too.
- `getCoreContractAddresses` reads JSON directly; `getCoreAddresses` (private, in functions.ts) adds env overrides + chain-1 fallback. Use the latter inside the lib.
- `TODO.md` tracks outstanding product asks (e.g. network-gating PRM/Staking/Governance to Ethereum-only). `README.md` is empty.
