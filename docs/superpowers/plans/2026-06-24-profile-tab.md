# Profile Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Profile tab that shows the connected wallet's escrow purchases on the current chain, split into Ongoing vs History, with contextual Confirm/Release/Abort actions.

**Architecture:** A new `getUserPurchases(wallet)` data function in `lib/functions.ts` scans the factory's `CreatedPurchase` events (by buyer and by seller) plus the four lifecycle events, groups them by clone `purchaseId`, and classifies each purchase. A new `pages/profile.tsx` renders the connected wallet's purchases via a new `components/ProfilePurchaseCard.tsx`. Action buttons deep-link to the existing confirm/release/abort pages, which gain a query-param prefill.

**Tech Stack:** Next.js (Pages Router, static export), React, TypeScript, ethers v6, wagmi v2, framer-motion, Tailwind + CSS variables.

## Global Constraints

- **No test framework exists in this repo** (CLAUDE.md: "Don't invent one unless asked"). Therefore verification per task = TypeScript type-check (`npx tsc --noEmit`) + `npm run lint`, with `npm run build` and manual browser checks at the end. **Do NOT add Jest/Vitest or any test runner.**
- **Reads** go through the existing resilient RPC layer (`initProvider`); **writes** go through the wallet signer. Do not introduce a new shared provider.
- Contract-call functions in `lib/functions.ts` return result shapes / empty arrays rather than throwing. Preserve that.
- Static export (`output: 'export'`): no SSR/API routes. Client-only data fetching in `useEffect`.
- Path alias `@/*` → repo root. Pages/components live at repo root (no `src/`).
- Style with the existing conventions: CSS variables (`var(--bg-1)` etc.), slate gradients, `bg-white/70 dark:bg-dark-800/50` cards, framer-motion entrances — match `pages/purchases.tsx` and `pages/logs-purchase.tsx`.
- Branch: `feature/profile-tab` (already checked out). Commit after each task.

---

### Task 1: Extract shared `scanFactoryEvents` helper and refactor `getPurchaseLogs`

Internal cleanup with **no behavior change** to the logs page. This isolates the 800-block chunked-scan loop so Task 2 can reuse it.

**Files:**
- Modify: `lib/functions.ts` (the `getPurchaseLogs` function, currently `lib/functions.ts:873-1007`)

**Interfaces:**
- Produces: `scanFactoryEvents(factory: ethers.Contract, filter: any, fromBlock: number, toBlock: number): Promise<ethers.EventLog[]>` — module-private helper used by Task 2.

- [ ] **Step 1: Add the `scanFactoryEvents` helper just above `getPurchaseLogs`**

Insert immediately before the `// Get transaction logs for a purchase wallet (factory events)` comment (currently `lib/functions.ts:872`):

```ts
// Scan a factory event filter across the full block range in chunks.
// 800-block chunks, batched 5 at a time, to respect RPC block-range limits.
const scanFactoryEvents = async (
  factory: ethers.Contract,
  filter: any,
  fromBlock: number,
  toBlock: number
): Promise<ethers.EventLog[]> => {
  const CHUNK_SIZE = 800
  const BATCH_SIZE = 5

  const ranges: { start: number; end: number }[] = []
  for (let start = fromBlock; start <= toBlock; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE - 1, toBlock)
    ranges.push({ start, end })
  }

  const logs: ethers.EventLog[] = []
  for (let i = 0; i < ranges.length; i += BATCH_SIZE) {
    const batch = ranges.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async ({ start, end }) => {
        try {
          const chunkLogs = await factory.queryFilter(filter, start, end)
          logs.push(...(chunkLogs as ethers.EventLog[]))
        } catch (chunkError) {
          console.warn(`Failed to fetch logs in range ${start}-${end}:`, chunkError)
        }
      })
    )
  }

  return logs
}
```

- [ ] **Step 2: Refactor `getPurchaseLogs` to use the helper**

Inside `getPurchaseLogs`, replace the inline range-building + batched `queryFilter` block (the part that builds `ranges`, logs `Scanning ${ranges.length} chunks`, and the per-topic `BATCH_SIZE` loop within `allLogsPromises`) so each topic uses `scanFactoryEvents`. The `allLogsPromises` map body becomes:

```ts
    const allLogsPromises = topics.map(async (topic) => {
      try {
        const filterCreator = (factory.filters as any)[topic.name]
        if (typeof filterCreator !== 'function') return []

        const filter = await filterCreator(walletAddress)
        const logs = await scanFactoryEvents(factory, filter, fromBlock, currentBlock)

        return logs.map((l) => ({ l, type: topic.type }))
      } catch (e) {
        console.warn(`Failed to fetch logs for ${topic.name}`, e)
        return []
      }
    })
```

Delete the now-unused inline `ranges` array and `CHUNK_SIZE`/`BATCH_SIZE` constants that lived directly in `getPurchaseLogs` (the `const CHUNK_SIZE = 800` near `lib/functions.ts:895` and the `ranges` pre-calculation loop). Keep `const fromBlock = config.deploymentBlock || 0` and `const currentBlock = await provider.getBlockNumber()`. The rest of `getPurchaseLogs` (sorting, enrichment, return) is unchanged.

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no new errors for `lib/functions.ts`.

- [ ] **Step 4: Manual sanity check (logs page unchanged)**

Run: `npm run dev`, open `/logs-purchase`, paste a known wallet address, click Search. Expected: the same log list behavior as before (this task changed no output).

- [ ] **Step 5: Commit**

```bash
git add lib/functions.ts
git commit -m "refactor: extract scanFactoryEvents helper from getPurchaseLogs"
```

---

### Task 2: Add `UserPurchase` interface and `getUserPurchases()` data function

**Files:**
- Modify: `lib/functions.ts` (add interface near the other interfaces ~`lib/functions.ts:118`; add function after `getPurchaseLogs`)

**Interfaces:**
- Consumes: `scanFactoryEvents` (Task 1); existing `initProvider`, `getParinumNetworkConfig`, `isNativeTokenAddress`, `erc20ABI`, `ethers`.
- Produces:
  - `interface UserPurchase` (exported) with fields exactly as below.
  - `getUserPurchases(wallet: string, forceRefresh?: boolean): Promise<UserPurchase[]>` (exported).

- [ ] **Step 1: Add the `UserPurchase` interface**

Add after the `TransactionLog` interface (after `lib/functions.ts:130`):

```ts
export interface UserPurchase {
  purchaseId: string            // clone contract address
  role: 'buyer' | 'seller'      // the connected wallet's role in this deal
  counterparty: string          // the other party's address
  price: string                 // formatted, denominated in `symbol`
  collateral: string            // formatted, denominated in `symbol`
  tokenAddress: string
  symbol: string                // native symbol or ERC-20 ticker
  status: 'awaiting-confirmation' | 'in-escrow' | 'completed' | 'aborted'
  category: 'ongoing' | 'history'
  action: 'confirm' | 'release' | 'abort' | null // contextual next action for the viewer
  createdAt: Date
  updatedAt: Date               // timestamp of the latest known event for this purchase
  txHash: string                // most relevant tx (creation, or completion if completed)
}
```

- [ ] **Step 2: Add the module-level cache and the `getUserPurchases` function**

Add immediately after `getPurchaseLogs` (after `lib/functions.ts:1007`):

```ts
// In-session cache so re-opening the Profile tab is instant. Keyed by chain + wallet.
const userPurchasesCache = new Map<string, UserPurchase[]>()

// Get all escrow purchases the wallet is involved in (buyer or seller) on the current chain,
// grouped by clone purchaseId and classified into ongoing vs history.
export const getUserPurchases = async (
  wallet: string,
  forceRefresh = false
): Promise<UserPurchase[]> => {
  try {
    const { provider, chainId } = await initProvider()
    const config = getParinumNetworkConfig(chainId)
    if (!config || !config.factoryAddress) return []
    if (!ethers.isAddress(wallet)) return []

    const cacheKey = `${chainId}-${wallet.toLowerCase()}`
    if (!forceRefresh && userPurchasesCache.has(cacheKey)) {
      return userPurchasesCache.get(cacheKey)!
    }

    const factory = new ethers.Contract(config.factoryAddress, config.factoryAbi, provider)
    const fromBlock = config.deploymentBlock || 0
    const currentBlock = await provider.getBlockNumber()
    const f = factory.filters as any

    // 1. CreatedPurchase: complete set of purchases the wallet is in, with full detail.
    //    CreatedPurchase(buyer, seller, price, collateral, tokenAddress, purchaseId) — buyer & seller indexed.
    const [createdAsBuyer, createdAsSeller] = await Promise.all([
      scanFactoryEvents(factory, f.CreatedPurchase(wallet), fromBlock, currentBlock),
      scanFactoryEvents(factory, f.CreatedPurchase(null, wallet), fromBlock, currentBlock),
    ])

    // 2. Lifecycle events filtered by the wallet (first indexed arg is the party).
    const [buyerUnresolved, sellerUnresolved, buyerCompleted, sellerCompleted] = await Promise.all([
      scanFactoryEvents(factory, f.BuyerUnresolvedPurchase(wallet), fromBlock, currentBlock),
      scanFactoryEvents(factory, f.SellerUnresolvedPurchase(wallet), fromBlock, currentBlock),
      scanFactoryEvents(factory, f.BuyerCompletedPurchase(wallet), fromBlock, currentBlock),
      scanFactoryEvents(factory, f.SellerCompletedPurchase(wallet), fromBlock, currentBlock),
    ])

    type Base = {
      purchaseId: string
      role: 'buyer' | 'seller'
      counterparty: string
      priceRaw: bigint
      collateralRaw: bigint
      tokenAddress: string
      createdBlock: number
      txHash: string
    }
    const records = new Map<string, Base>()

    const ingestCreated = (logs: ethers.EventLog[], role: 'buyer' | 'seller') => {
      for (const log of logs) {
        const args = log.args as any
        const purchaseId: string | undefined = args?.purchaseId
        if (!purchaseId) continue
        const key = purchaseId.toLowerCase()
        if (records.has(key)) continue
        records.set(key, {
          purchaseId,
          role,
          counterparty: role === 'buyer' ? args.seller : args.buyer,
          priceRaw: args.price,
          collateralRaw: args.collateral,
          tokenAddress: args.tokenAddress,
          createdBlock: log.blockNumber,
          txHash: log.transactionHash,
        })
      }
    }
    ingestCreated(createdAsBuyer, 'buyer')
    ingestCreated(createdAsSeller, 'seller')

    const confirmedIds = new Set<string>()
    const completedLogs = new Map<string, ethers.EventLog>()
    const markConfirmed = (logs: ethers.EventLog[]) => {
      for (const log of logs) {
        const id = (log.args as any)?.purchaseId?.toLowerCase()
        if (id) confirmedIds.add(id)
      }
    }
    const markCompleted = (logs: ethers.EventLog[]) => {
      for (const log of logs) {
        const id = (log.args as any)?.purchaseId?.toLowerCase()
        if (id) completedLogs.set(id, log)
      }
    }
    markConfirmed(buyerUnresolved)
    markConfirmed(sellerUnresolved)
    markCompleted(buyerCompleted)
    markCompleted(sellerCompleted)

    // Token metadata, fetched once per distinct token.
    const distinctTokens = new Set<string>()
    for (const r of records.values()) distinctTokens.add(r.tokenAddress)
    const tokenMeta = new Map<string, { decimals: number; symbol: string }>()
    await Promise.all(
      Array.from(distinctTokens).map(async (tokenAddr) => {
        if (isNativeTokenAddress(tokenAddr)) {
          tokenMeta.set(tokenAddr, { decimals: 18, symbol: config.nativeSymbol || 'ETH' })
          return
        }
        try {
          const token = new ethers.Contract(tokenAddr, erc20ABI, provider)
          let decimals = 18
          let symbol = 'tokens'
          try { decimals = Number(await token.decimals()) } catch { /* keep 18 */ }
          try { symbol = await token.symbol() } catch { /* keep 'tokens' */ }
          tokenMeta.set(tokenAddr, { decimals, symbol })
        } catch {
          tokenMeta.set(tokenAddr, { decimals: 18, symbol: 'tokens' })
        }
      })
    )

    const results: UserPurchase[] = []
    for (const r of records.values()) {
      const key = r.purchaseId.toLowerCase()
      const meta = tokenMeta.get(r.tokenAddress) || { decimals: 18, symbol: config.nativeSymbol || 'ETH' }

      let status: UserPurchase['status']
      let category: UserPurchase['category']
      let updatedBlock = r.createdBlock
      let txHash = r.txHash

      const completedLog = completedLogs.get(key)
      if (completedLog) {
        status = 'completed'
        category = 'history'
        updatedBlock = completedLog.blockNumber
        txHash = completedLog.transactionHash
      } else if (confirmedIds.has(key)) {
        status = 'in-escrow'
        category = 'ongoing'
      } else {
        // Created only — abort emits no event, so read the clone's state to disambiguate.
        let state = 1
        try {
          const clone = new ethers.Contract(r.purchaseId, config.cloneAbi, provider)
          state = Number(await clone.state())
        } catch {
          state = 3 // defensive: treat unreadable as aborted/history
        }
        if (state === 1) {
          status = 'awaiting-confirmation'
          category = 'ongoing'
        } else {
          status = 'aborted'
          category = 'history'
        }
      }

      let action: UserPurchase['action'] = null
      if (status === 'awaiting-confirmation') {
        action = r.role === 'seller' ? 'confirm' : 'abort'
      } else if (status === 'in-escrow' && r.role === 'buyer') {
        action = 'release'
      }

      const [createdBlockData, updatedBlockData] = await Promise.all([
        provider.getBlock(r.createdBlock),
        provider.getBlock(updatedBlock),
      ])

      results.push({
        purchaseId: r.purchaseId,
        role: r.role,
        counterparty: r.counterparty,
        price: ethers.formatUnits(r.priceRaw, meta.decimals),
        collateral: ethers.formatUnits(r.collateralRaw, meta.decimals),
        tokenAddress: r.tokenAddress,
        symbol: meta.symbol,
        status,
        category,
        action,
        createdAt: createdBlockData?.timestamp
          ? new Date(Number(createdBlockData.timestamp) * 1000)
          : new Date(),
        updatedAt: updatedBlockData?.timestamp
          ? new Date(Number(updatedBlockData.timestamp) * 1000)
          : new Date(),
        txHash,
      })
    }

    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    userPurchasesCache.set(cacheKey, results)
    return results
  } catch (error) {
    console.error('getUserPurchases error:', error)
    return []
  }
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add lib/functions.ts
git commit -m "feat: add getUserPurchases data function and UserPurchase type"
```

---

### Task 3: Create `ProfilePurchaseCard` component

**Files:**
- Create: `components/ProfilePurchaseCard.tsx`

**Interfaces:**
- Consumes: `UserPurchase` (Task 2).
- Produces: default-exported React component `ProfilePurchaseCard` with props:
  ```ts
  { purchase: UserPurchase; explorerUrl: string; explorerName: string }
  ```

- [ ] **Step 1: Write the component**

Create `components/ProfilePurchaseCard.tsx`:

```tsx
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { UserPurchase } from '@/lib/functions'

interface ProfilePurchaseCardProps {
  purchase: UserPurchase
  explorerUrl: string
  explorerName: string
}

const STATUS_STYLES: Record<UserPurchase['status'], { label: string; className: string }> = {
  'awaiting-confirmation': { label: 'Awaiting Confirmation', className: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
  'in-escrow': { label: 'In Escrow', className: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  completed: { label: 'Completed', className: 'text-green-400 bg-green-500/10 border-green-500/30' },
  aborted: { label: 'Aborted', className: 'text-red-400 bg-red-500/10 border-red-500/30' },
}

const ACTION_META: Record<'confirm' | 'release' | 'abort', { label: string; href: string }> = {
  confirm: { label: 'Confirm', href: '/confirm-purchase' },
  release: { label: 'Release Funds', href: '/release-purchase' },
  abort: { label: 'Abort', href: '/abort-purchase' },
}

const truncate = (address: string) => {
  if (!address) return 'N/A'
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function ProfilePurchaseCard({ purchase, explorerUrl, explorerName }: ProfilePurchaseCardProps) {
  const statusStyle = STATUS_STYLES[purchase.status]
  const action = purchase.action ? ACTION_META[purchase.action] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl"
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.className}`}>
            {statusStyle.label}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium border border-primary-500/30 text-secondary-700 dark:text-dark-200 bg-primary-500/5">
            You are the {purchase.role}
          </span>
        </div>
        <span className="text-secondary-600 dark:text-dark-400 text-sm whitespace-nowrap">
          {purchase.updatedAt.toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-secondary-600 dark:text-dark-400">Counterparty ({purchase.role === 'buyer' ? 'seller' : 'buyer'}):</span>
          <p className="text-secondary-900 dark:text-white font-mono">{truncate(purchase.counterparty)}</p>
        </div>
        <div>
          <span className="text-secondary-600 dark:text-dark-400">Price:</span>
          <p className="text-secondary-900 dark:text-white font-medium">{purchase.price} {purchase.symbol}</p>
        </div>
        <div>
          <span className="text-secondary-600 dark:text-dark-400">Collateral:</span>
          <p className="text-secondary-900 dark:text-white font-medium">{purchase.collateral} {purchase.symbol}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-primary-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-secondary-600 dark:text-dark-400 text-sm">Contract:</span>
          <p className="text-secondary-900 dark:text-white font-mono text-sm">{truncate(purchase.purchaseId)}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${explorerUrl}/address/${purchase.purchaseId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-primary-100 dark:bg-primary-500/20 hover:bg-primary-200 dark:hover:bg-primary-500/30 text-primary-700 dark:text-primary-400 rounded-lg transition-colors duration-200 text-sm"
          >
            View on {explorerName}
          </a>
          {action && (
            <Link
              href={`${action.href}?id=${purchase.purchaseId}`}
              className="px-4 py-2 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-lg shadow hover:shadow-lg transition-all duration-300 text-sm"
            >
              {action.label}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add components/ProfilePurchaseCard.tsx
git commit -m "feat: add ProfilePurchaseCard component"
```

---

### Task 4: Create `pages/profile.tsx`

**Files:**
- Create: `pages/profile.tsx`

**Interfaces:**
- Consumes: `getUserPurchases`, `UserPurchase` (Task 2); `ProfilePurchaseCard` (Task 3); `getBlockExplorer`, `getParinumNetworkConfig` from `@/lib/parinum`; `WalletButton` from `@/components/WalletButton`; wagmi `useAccount`, `useChainId`.

- [ ] **Step 1: Write the page**

Create `pages/profile.tsx`:

```tsx
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useChainId } from 'wagmi'
import Layout from '@/components/Layout'
import ProfilePurchaseCard from '@/components/ProfilePurchaseCard'
import { WalletButton } from '@/components/WalletButton'
import { getUserPurchases, type UserPurchase } from '@/lib/functions'
import { getBlockExplorer, getParinumNetworkConfig } from '@/lib/parinum'

type Tab = 'ongoing' | 'history'

export default function Profile() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const explorer = getBlockExplorer(chainId)
  const networkName = getParinumNetworkConfig(chainId)?.name || 'this network'

  const [purchases, setPurchases] = useState<UserPurchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('ongoing')

  const load = useCallback(
    async (forceRefresh: boolean) => {
      if (!address) return
      setIsLoading(true)
      try {
        const data = await getUserPurchases(address, forceRefresh)
        setPurchases(data)
      } finally {
        setIsLoading(false)
        setHasLoaded(true)
      }
    },
    [address]
  )

  useEffect(() => {
    setHasLoaded(false)
    setPurchases([])
    if (address) load(false)
  }, [address, chainId, load])

  const ongoing = purchases.filter((p) => p.category === 'ongoing')
  const history = purchases.filter((p) => p.category === 'history')
  const visible = activeTab === 'ongoing' ? ongoing : history

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen pt-20 pb-12"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">Profile</h1>
            <p className="text-secondary-600 dark:text-dark-300">Your escrow purchases on {networkName}</p>
          </div>

          {!isConnected || !address ? (
            <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-10 text-center">
              <p className="text-secondary-700 dark:text-dark-200 mb-6">Connect your wallet to view your purchases.</p>
              <div className="flex justify-center">
                <WalletButton />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-secondary-600 dark:text-dark-400 text-xs uppercase">Connected wallet</span>
                  <p className="text-secondary-900 dark:text-white font-mono">{`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
                  <p className="text-secondary-600 dark:text-dark-400 text-sm mt-1">{networkName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => load(true)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-dark-700/40 border border-primary-500/20 rounded-xl mb-6 w-full sm:w-auto">
                {(['ongoing', 'history'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-white dark:bg-dark-800 text-secondary-900 dark:text-white shadow'
                        : 'text-secondary-600 dark:text-dark-300 hover:text-secondary-900 dark:hover:text-white'
                    }`}
                  >
                    {tab === 'ongoing' ? `Ongoing (${ongoing.length})` : `History (${history.length})`}
                  </button>
                ))}
              </div>

              {isLoading && !hasLoaded ? (
                <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-10 text-center">
                  <div className="w-8 h-8 mx-auto border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4" />
                  <p className="text-secondary-600 dark:text-dark-300">Scanning the blockchain for your purchases… this can take a moment.</p>
                </div>
              ) : visible.length === 0 ? (
                <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-10 text-center">
                  <p className="text-secondary-600 dark:text-dark-300">
                    {activeTab === 'ongoing' ? 'No ongoing purchases.' : 'No purchase history yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visible.map((purchase) => (
                    <ProfilePurchaseCard
                      key={purchase.purchaseId}
                      purchase={purchase}
                      explorerUrl={explorer.url}
                      explorerName={explorer.name}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 3: Manual check**

Run `npm run dev`, open `/profile`. Expected: disconnected state shows the connect prompt; after connecting, the header + toggle render and a scan runs (spinner, then Ongoing/History lists or empty states).

- [ ] **Step 4: Commit**

```bash
git add pages/profile.tsx
git commit -m "feat: add Profile page with ongoing/history toggle"
```

---

### Task 5: Add the Profile entry to the navbar

**Files:**
- Modify: `components/NavBar.tsx` (the `navigation` array at `components/NavBar.tsx:118-124`)

**Interfaces:**
- Consumes: existing `navigation` array, rendered in both desktop and mobile menus.

- [ ] **Step 1: Add the nav item**

In `components/NavBar.tsx`, add a `Profile` entry to the `navigation` array (after `Purchases`):

```tsx
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Purchases', href: '/create-purchase' },
    { name: 'Profile', href: '/profile' },
    { name: 'PRM', href: '/prm-funding' },
    { name: 'Staking', href: '/stake-dashboard' },
    { name: 'Governance', href: '/governance' },
  ]
```

No change to `isNavItemActive` is needed: `/profile` is not in `purchaseRoutes`, so it highlights only on an exact `router.pathname === '/profile'` match.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 3: Manual check**

Run `npm run dev`. Expected: "Profile" appears in the desktop nav and the mobile menu, links to `/profile`, and shows the active style only on `/profile`.

- [ ] **Step 4: Commit**

```bash
git add components/NavBar.tsx
git commit -m "feat: add Profile tab to navigation"
```

---

### Task 6: Prefill purchase address from query param on action pages

Lets Profile's action buttons deep-link to the right page with the clone address filled in.

**Files:**
- Modify: `pages/confirm-purchase.tsx`
- Modify: `pages/release-purchase.tsx`
- Modify: `pages/abort-purchase.tsx`

**Interfaces:**
- Consumes: each page's existing `const [purchaseId, setPurchaseId] = useState('')`.

- [ ] **Step 1: Update `pages/confirm-purchase.tsx`**

Change the React import (currently `import { useState } from 'react'`) to:

```tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
```

Then, immediately after the `useState` declarations inside `ConfirmPurchase` (after `const [isSuccess, setIsSuccess] = useState(false)`), add:

```tsx
  const router = useRouter()
  useEffect(() => {
    const id = router.query.id
    if (typeof id === 'string' && id) setPurchaseId(id)
  }, [router.query.id])
```

- [ ] **Step 2: Apply the same change to `pages/release-purchase.tsx`**

Same edit: add `useEffect` to the `react` import, add `import { useRouter } from 'next/router'`, and add the same `useRouter` + `useEffect` block after the `useState` declarations in the `ReleasePurchase` component.

- [ ] **Step 3: Apply the same change to `pages/abort-purchase.tsx`**

Same edit in the `AbortPurchase` component.

- [ ] **Step 4: Type-check and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no new errors. (If `next lint` flags the `useEffect` dependency array, `[router.query.id]` is correct and complete — `setPurchaseId` is a stable setter and does not need listing.)

- [ ] **Step 5: Manual check**

Run `npm run dev`, open `/confirm-purchase?id=0x0000000000000000000000000000000000000001`. Expected: the purchase ID field is prefilled with that address. Repeat for `/release-purchase?id=…` and `/abort-purchase?id=…`.

- [ ] **Step 6: Commit**

```bash
git add pages/confirm-purchase.tsx pages/release-purchase.tsx pages/abort-purchase.tsx
git commit -m "feat: prefill purchase address from query param on action pages"
```

---

### Task 7: Full build + end-to-end manual verification

**Files:** none (verification only).

- [ ] **Step 1: Lint the whole project**

Run: `npm run lint`
Expected: passes with no new errors.

- [ ] **Step 2: Production build (static export)**

Run: `npm run build`
Expected: build succeeds; `/profile` appears in the exported routes and the build does not error on the new page/component.

- [ ] **Step 3: End-to-end manual flow**

Run `npm run dev` and verify:
- `/profile` while disconnected → connect prompt.
- Connect a wallet on a supported chain → scan runs, Ongoing/History counts populate, cards show role, counterparty, price/collateral + symbol, and status badge.
- An ongoing purchase where you are the seller (state 1) shows **Confirm** and links to `/confirm-purchase?id=<clone>` with the field prefilled.
- An ongoing purchase where you are the buyer in escrow (state 2) shows **Release Funds** → `/release-purchase?id=<clone>` prefilled.
- A completed purchase appears under History with no action button and a working "View on {explorer}" link.
- Switching chains re-runs the scan; Refresh forces a re-scan.

- [ ] **Step 4: Final commit (if any verification fixups were needed)**

```bash
git add -A
git commit -m "chore: profile tab verification fixups"
```

(Skip if no changes were required.)

---

## Self-Review

**Spec coverage:**
- Profile tab purchases-only, ongoing vs history → Tasks 2, 4. ✓
- Segmented toggle, default Ongoing, counts → Task 4. ✓
- Current-chain-only scan → Task 2 (`getUserPurchases` uses `initProvider` chain). ✓
- Act directly (Confirm/Release/Abort) + view on explorer → Tasks 3 (card buttons) + 6 (prefill). ✓
- Group by `purchaseId`, classify via events + clone `state()` for created-only → Task 2. ✓
- Shared scan helper, no change to logs page → Task 1. ✓
- New `ProfilePurchaseCard`, nav entry → Tasks 3, 5. ✓
- In-session cache + Refresh → Task 2 (`userPurchasesCache`) + Task 4 (Refresh button). ✓
- Disconnected / loading / empty states → Task 4. ✓
- No new test framework; verify via tsc/lint/build/manual → Global Constraints + every task. ✓

**Placeholder scan:** No TBD/TODO; all code blocks are complete. The `0x000…001` address is an intentional manual-test input, not a placeholder. ✓

**Type consistency:** `getUserPurchases(wallet, forceRefresh?)` and the `UserPurchase` field names/types are defined in Task 2 and consumed identically in Tasks 3 (`ProfilePurchaseCard` props) and 4 (page). `action` values `'confirm' | 'release' | 'abort' | null` match `ACTION_META` keys in Task 3. `getBlockExplorer` returns `{ url, name }`, consumed as `explorer.url`/`explorer.name`. ✓
