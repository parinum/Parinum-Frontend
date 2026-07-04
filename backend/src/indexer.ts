import { Contract, Interface, JsonRpcProvider, ZeroAddress, ethers, isAddress } from 'ethers'
import { query } from './db'
import { env } from './env'
import { derivePurchaseSnapshot } from './purchaseState'
import type { IndexedChainConfig, LifecycleStage, NormalizedEvent, PurchaseSnapshot, SyncCheckpoint } from './types'

const lifecycleEvents = [
  'CreatedPurchase',
  'BuyerUnresolvedPurchase',
  'SellerUnresolvedPurchase',
  'BuyerCompletedPurchase',
  'SellerCompletedPurchase',
  'AbortedPurchase',
] as const

const stageByEventName: Record<(typeof lifecycleEvents)[number], LifecycleStage> = {
  CreatedPurchase: 'created',
  BuyerUnresolvedPurchase: 'confirmed',
  SellerUnresolvedPurchase: 'confirmed',
  BuyerCompletedPurchase: 'completed',
  SellerCompletedPurchase: 'completed',
  AbortedPurchase: 'aborted',
}

const erc20Abi = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const isRateLimitedError = (error: unknown) => {
  const message = String(error).toLowerCase()
  return message.includes('code": 429') || message.includes('compute units per second capacity')
}

const serializeValue = (value: unknown): unknown => {
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(serializeValue)
  if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) return value.toLowerCase()
  return value
}

const getEventArgs = (parsed: ethers.LogDescription) => {
  const args: Record<string, unknown> = {}
  parsed.fragment.inputs.forEach((input, index) => {
    if (!input.name) return
    args[input.name] = serializeValue(parsed.args[index])
  })
  return args
}

const getPurchaseAddressFromArgs = (args: Record<string, unknown>) => {
  const candidate = args.purchaseId || args.createdContractAddress
  if (typeof candidate !== 'string') return ''
  return candidate.toLowerCase()
}

class FallbackRpcClient {
  private readonly providers: JsonRpcProvider[]
  private providerCursor = 0

  constructor(private readonly chain: IndexedChainConfig) {
    this.providers = chain.rpcUrls.map((url) => new JsonRpcProvider(url))
  }

  private getProviderStartIndex() {
    if (this.providers.length === 0) return 0
    const start = this.providerCursor % this.providers.length
    this.providerCursor = (this.providerCursor + 1) % this.providers.length
    return start
  }

  private getProvidersFrom(startIndex: number) {
    if (this.providers.length === 0) return [] as JsonRpcProvider[]
    if (startIndex <= 0) return this.providers
    return [...this.providers.slice(startIndex), ...this.providers.slice(0, startIndex)]
  }

  private async tryAll<T>(label: string, run: (provider: JsonRpcProvider) => Promise<T>, startIndex = this.getProviderStartIndex()): Promise<T> {
    let lastError: unknown = null

    for (const provider of this.getProvidersFrom(startIndex)) {
      for (let attempt = 0; attempt <= env.maxRateLimitRetries; attempt += 1) {
        try {
          return await run(provider)
        } catch (error) {
          lastError = error

          if (!isRateLimitedError(error) || attempt === env.maxRateLimitRetries) {
            break
          }

          await sleep(env.rateLimitBackoffBaseMs * (attempt + 1))
        }
      }
    }

    throw new Error(`RPC failure on chain ${this.chain.chainId} for ${label}: ${String(lastError)}`)
  }

  getBlockNumber() {
    return this.tryAll('getBlockNumber', (provider) => provider.getBlockNumber())
  }

  getBlock(blockNumber: number) {
    return this.tryAll(`getBlock(${blockNumber})`, (provider) => provider.getBlock(blockNumber, false))
  }

  getLogs(fromBlock: number, toBlock: number, topics?: string[]) {
    return this.tryAll(`getLogs(${fromBlock}-${toBlock})`, (provider) =>
      provider.getLogs({
        address: this.chain.factoryAddress,
        fromBlock,
        toBlock,
        topics,
      })
    )
  }

  async getLogsStriped(fromBlock: number, toBlock: number, topics?: string[]) {
    const totalBlocks = Math.max(0, toBlock - fromBlock + 1)
    const providerCount = this.providers.length
    const stripeCount = Math.min(env.rpcParallelRequests, providerCount, totalBlocks)

    if (stripeCount <= 1) {
      return this.getLogs(fromBlock, toBlock, topics)
    }

    const baseSize = Math.floor(totalBlocks / stripeCount)
    const remainder = totalBlocks % stripeCount
    let cursor = fromBlock

    const requests: Promise<Awaited<ReturnType<JsonRpcProvider['getLogs']>>>[] = []

    for (let i = 0; i < stripeCount; i += 1) {
      const chunkSize = baseSize + (i < remainder ? 1 : 0)
      const chunkFrom = cursor
      const chunkTo = chunkFrom + chunkSize - 1
      cursor = chunkTo + 1

      const startIndex = (this.getProviderStartIndex() + i) % providerCount
      requests.push(
        this.tryAll(
          `getLogs(${chunkFrom}-${chunkTo})`,
          (provider) =>
            provider.getLogs({
              address: this.chain.factoryAddress,
              fromBlock: chunkFrom,
              toBlock: chunkTo,
              topics,
            }),
          startIndex
        )
      )
    }

    const responses = await Promise.all(requests)
    return responses.flat()
  }
}

type TokenMeta = { symbol: string; decimals: number }

export class ProfileIndexer {
  private readonly rpcClients = new Map<number, FallbackRpcClient>()
  private readonly tokenMetaCache = new Map<string, TokenMeta>()
  private shouldStop = false

  constructor(private readonly chains: IndexedChainConfig[]) {}

  async start() {
    while (!this.shouldStop) {
      await this.runOnce()

      if (!this.shouldStop) {
        await sleep(env.pollIntervalMs)
      }
    }
  }

  async runOnce() {
    const queue = [...this.chains]
    const workers = Array.from({ length: Math.min(env.chainConcurrency, queue.length) }, async () => {
      while (queue.length > 0) {
        const chain = queue.shift()
        if (!chain) return
        try {
          await this.syncChain(chain)
        } catch (error) {
          await this.recordFailure(chain.chainId, error)
          console.error(`Indexer sync failed for chain ${chain.chainId}`, error)
        }
      }
    })

    await Promise.all(workers)
  }

  stop() {
    this.shouldStop = true
  }

  private getRpc(chain: IndexedChainConfig) {
    const existing = this.rpcClients.get(chain.chainId)
    if (existing) return existing
    const created = new FallbackRpcClient(chain)
    this.rpcClients.set(chain.chainId, created)
    return created
  }

  private async ensureChainRows(chain: IndexedChainConfig) {
    await query(
      `
        insert into chains (chain_id, chain_key, name, factory_address, deployment_block, finality_buffer_blocks, is_enabled)
        values ($1, $2, $3, $4, $5, $6, true)
        on conflict (chain_id) do update
        set chain_key = excluded.chain_key,
            name = excluded.name,
            factory_address = excluded.factory_address,
            deployment_block = excluded.deployment_block,
            finality_buffer_blocks = excluded.finality_buffer_blocks,
            is_enabled = true,
            updated_at = now()
      `,
      [chain.chainId, chain.envKey.toLowerCase(), chain.name, chain.factoryAddress, chain.deploymentBlock, chain.finalityBufferBlocks]
    )

    await query(
      `
        insert into sync_checkpoints (chain_id, sync_mode, next_from_block, last_scanned_block, last_finalized_block, last_seen_block_hash, consecutive_failures, last_error)
        values ($1, 'backfill', $2, $3, $3, null, 0, null)
        on conflict (chain_id) do nothing
      `,
      [chain.chainId, chain.deploymentBlock, Math.max(chain.deploymentBlock - 1, 0)]
    )
  }

  private async getCheckpoint(chainId: number): Promise<SyncCheckpoint> {
    const result = await query<{
      chain_id: number
      sync_mode: 'backfill' | 'live'
      next_from_block: string
      last_scanned_block: string
      last_finalized_block: string
      last_seen_block_hash: string | null
      consecutive_failures: number
      last_error: string | null
      updated_at: Date
    }>(
      `select * from sync_checkpoints where chain_id = $1`,
      [chainId]
    )

    if (!result.rows[0]) {
      throw new Error(`Missing sync checkpoint for chain ${chainId}`)
    }

    const row = result.rows[0]

    return {
      chainId: row.chain_id,
      syncMode: row.sync_mode,
      nextFromBlock: Number(row.next_from_block),
      lastScannedBlock: Number(row.last_scanned_block),
      lastFinalizedBlock: Number(row.last_finalized_block),
      lastSeenBlockHash: row.last_seen_block_hash,
      consecutiveFailures: row.consecutive_failures,
      lastError: row.last_error,
      updatedAt: row.updated_at,
    }
  }

  private async syncChain(chain: IndexedChainConfig) {
    await this.ensureChainRows(chain)

    const rpc = this.getRpc(chain)
    const checkpoint = await this.getCheckpoint(chain.chainId)

    if (checkpoint.lastFinalizedBlock > 0 && checkpoint.lastSeenBlockHash) {
      const finalizedBlock = await rpc.getBlock(checkpoint.lastFinalizedBlock)
      const finalizedHash = finalizedBlock?.hash || null
      if (finalizedHash && finalizedHash !== checkpoint.lastSeenBlockHash) {
        const rewindTo = Math.max(chain.deploymentBlock, checkpoint.lastFinalizedBlock - chain.finalityBufferBlocks)
        await this.rewindChain(chain.chainId, rewindTo)
      }
    }

    const headBlock = await rpc.getBlockNumber()
    const targetBlock = Math.max(chain.deploymentBlock, headBlock - chain.finalityBufferBlocks)
    let fromBlock = checkpoint.nextFromBlock

    if (fromBlock > targetBlock) {
      await query(
        `update sync_checkpoints set sync_mode = 'live', last_error = null, consecutive_failures = 0, updated_at = now() where chain_id = $1`,
        [chain.chainId]
      )
      return
    }

    while (fromBlock <= targetBlock) {
      const toBlock = Math.min(fromBlock + chain.batchSize - 1, targetBlock)
      const events = await this.fetchEvents(chain, fromBlock, toBlock)
      const affectedAddresses = await this.persistEvents(events)
      await this.rebuildPurchases(chain.chainId, affectedAddresses)
      const nextSyncMode = toBlock < headBlock - chain.finalityBufferBlocks ? 'backfill' : 'live'
      // Avoid an extra getBlock call on every backfill batch; only pin block hash when near live tip.
      const lastSeenBlockHash = nextSyncMode === 'live' ? (await rpc.getBlock(toBlock))?.hash || null : null

      await query(
        `
          update sync_checkpoints
          set sync_mode = $2,
              next_from_block = $3,
              last_scanned_block = $4,
              last_finalized_block = $4,
              last_seen_block_hash = $5,
              consecutive_failures = 0,
              last_error = null,
              updated_at = now()
          where chain_id = $1
        `,
        [chain.chainId, nextSyncMode, toBlock + 1, toBlock, lastSeenBlockHash]
      )

      fromBlock = toBlock + 1
    }
  }

  private async rewindChain(chainId: number, fromBlock: number) {
    await query(`delete from purchase_events where chain_id = $1 and block_number >= $2`, [chainId, fromBlock])
    await query(`delete from purchases where chain_id = $1 and updated_at_block >= $2`, [chainId, fromBlock])
    await query(
      `
        update sync_checkpoints
        set sync_mode = 'backfill',
            next_from_block = $2,
            last_scanned_block = greatest($2 - 1, 0),
            last_finalized_block = greatest($2 - 1, 0),
            last_seen_block_hash = null,
            updated_at = now()
        where chain_id = $1
      `,
      [chainId, fromBlock]
    )
  }

  private async fetchEvents(chain: IndexedChainConfig, fromBlock: number, toBlock: number): Promise<NormalizedEvent[]> {
    const rpc = this.getRpc(chain)
    const iface = new Interface(chain.factoryAbi)
    const rawLogs = await rpc.getLogsStriped(fromBlock, toBlock)

    rawLogs.sort((left, right) => {
      if (left.blockNumber !== right.blockNumber) return left.blockNumber - right.blockNumber
      return (left.index ?? 0) - (right.index ?? 0)
    })

    const uniqueBlocks = Array.from(new Set(rawLogs.map((log) => log.blockNumber)))
    const blockMap = new Map<number, { hash: string; timestamp: Date }>()
    for (const blockNumber of uniqueBlocks) {
      const block = await rpc.getBlock(blockNumber)
      if (!block?.hash || block.timestamp == null) continue
      blockMap.set(blockNumber, {
        hash: block.hash,
        timestamp: new Date(Number(block.timestamp) * 1000),
      })
    }

    const events: NormalizedEvent[] = []
    for (const log of rawLogs) {
      let parsed: ethers.LogDescription | null = null
      try {
        parsed = iface.parseLog(log)
      } catch {
        parsed = null
      }
      if (!parsed) continue

      const args = getEventArgs(parsed)
      const purchaseAddress = getPurchaseAddressFromArgs(args)
      if (!purchaseAddress) continue

      if (parsed.name === 'CreatedPurchase') {
        const tokenMeta = await this.getTokenMetadata(chain, String(args.tokenAddress || ZeroAddress))
        const priceRaw = String(args.price || '0')
        const collateralRaw = String(args.collateral || '0')
        args.symbol = tokenMeta.symbol
        args.priceDisplay = ethers.formatUnits(priceRaw, tokenMeta.decimals)
        args.collateralDisplay = ethers.formatUnits(collateralRaw, tokenMeta.decimals)
      }

      const block = blockMap.get(log.blockNumber)
      if (!block) continue

      events.push({
        chainId: chain.chainId,
        purchaseAddress,
        contractAddress: String(log.address).toLowerCase(),
        eventName: parsed.name,
        lifecycleStage: stageByEventName[parsed.name as keyof typeof stageByEventName] || 'other',
        blockNumber: log.blockNumber,
        blockHash: block.hash,
        blockTimestamp: block.timestamp,
        txHash: String(log.transactionHash).toLowerCase(),
        txIndex: log.transactionIndex ?? null,
        logIndex: log.index ?? 0,
        topics: [...log.topics],
        data: log.data,
        args,
      })
    }

    return events
  }

  private async getTokenMetadata(chain: IndexedChainConfig, tokenAddress: string): Promise<TokenMeta> {
    const normalizedAddress = String(tokenAddress).toLowerCase()
    if (!normalizedAddress || normalizedAddress === ZeroAddress.toLowerCase()) {
      return { symbol: chain.nativeSymbol, decimals: 18 }
    }

    const cacheKey = `${chain.chainId}:${normalizedAddress}`
    const cached = this.tokenMetaCache.get(cacheKey)
    if (cached) return cached

    const provider = new JsonRpcProvider(chain.rpcUrls[0])
    const contract = new Contract(normalizedAddress, erc20Abi, provider)
    let symbol = 'tokens'
    let decimals = 18

    try {
      symbol = await contract.symbol()
    } catch {
      symbol = 'tokens'
    }

    try {
      decimals = Number(await contract.decimals())
    } catch {
      decimals = 18
    }

    const meta = { symbol, decimals }
    this.tokenMetaCache.set(cacheKey, meta)
    return meta
  }

  private async persistEvents(events: NormalizedEvent[]) {
    const affected = new Set<string>()

    for (const event of events) {
      affected.add(event.purchaseAddress)
      await query(
        `
          insert into purchase_events (
            chain_id,
            purchase_address,
            contract_address,
            event_name,
            lifecycle_stage,
            block_number,
            block_hash,
            block_timestamp,
            tx_hash,
            tx_index,
            log_index,
            topics,
            data,
            args,
            removed
          )
          values (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12::jsonb, $13, $14::jsonb, false
          )
          on conflict (chain_id, tx_hash, log_index) do nothing
        `,
        [
          event.chainId,
          event.purchaseAddress,
          event.contractAddress,
          event.eventName,
          event.lifecycleStage,
          event.blockNumber,
          event.blockHash,
          event.blockTimestamp,
          event.txHash,
          event.txIndex,
          event.logIndex,
          JSON.stringify(event.topics),
          event.data,
          JSON.stringify(event.args),
        ]
      )
    }

    return Array.from(affected)
  }

  private async rebuildPurchases(chainId: number, addresses: string[]) {
    if (addresses.length === 0) return

    const result = await query<{
      purchase_address: string
      event_name: string
      lifecycle_stage: LifecycleStage
      block_number: string
      block_hash: string
      block_timestamp: Date
      tx_hash: string
      tx_index: number | null
      log_index: number
      topics: string[]
      data: string
      args: Record<string, unknown>
    }>(
      `
        select purchase_address, event_name, lifecycle_stage, block_number, block_hash, block_timestamp, tx_hash, tx_index, log_index, topics, data, args
        from purchase_events
        where chain_id = $1 and purchase_address = any($2)
        order by block_number asc, log_index asc
      `,
      [chainId, addresses]
    )

    const grouped = new Map<string, NormalizedEvent[]>()
    for (const row of result.rows) {
      const event: NormalizedEvent = {
        chainId,
        purchaseAddress: row.purchase_address,
        contractAddress: '',
        eventName: row.event_name,
        lifecycleStage: row.lifecycle_stage,
        blockNumber: Number(row.block_number),
        blockHash: row.block_hash,
        blockTimestamp: new Date(row.block_timestamp),
        txHash: row.tx_hash,
        txIndex: row.tx_index,
        logIndex: row.log_index,
        topics: row.topics,
        data: row.data,
        args: row.args,
      }

      const bucket = grouped.get(row.purchase_address) || []
      bucket.push(event)
      grouped.set(row.purchase_address, bucket)
    }

    for (const address of addresses) {
      const snapshot = derivePurchaseSnapshot(chainId, address, grouped.get(address) || [])
      if (!snapshot) {
        await query(`delete from purchases where chain_id = $1 and purchase_address = $2`, [chainId, address])
        continue
      }

      await this.upsertPurchase(snapshot)
    }
  }

  private async upsertPurchase(snapshot: PurchaseSnapshot) {
    await query(
      `
        insert into purchases (
          chain_id,
          purchase_address,
          buyer_address,
          seller_address,
          token_address,
          symbol,
          price_raw,
          collateral_raw,
          price_display,
          collateral_display,
          creation_tx_hash,
          latest_tx_hash,
          current_status,
          current_category,
          created_at_block,
          updated_at_block,
          created_at,
          updated_at,
          last_event_name,
          created_log_index,
          latest_log_index
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        on conflict (chain_id, purchase_address) do update
        set buyer_address = excluded.buyer_address,
            seller_address = excluded.seller_address,
            token_address = excluded.token_address,
            symbol = excluded.symbol,
            price_raw = excluded.price_raw,
            collateral_raw = excluded.collateral_raw,
            price_display = excluded.price_display,
            collateral_display = excluded.collateral_display,
            creation_tx_hash = excluded.creation_tx_hash,
            latest_tx_hash = excluded.latest_tx_hash,
            current_status = excluded.current_status,
            current_category = excluded.current_category,
            created_at_block = excluded.created_at_block,
            updated_at_block = excluded.updated_at_block,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            last_event_name = excluded.last_event_name,
            created_log_index = excluded.created_log_index,
            latest_log_index = excluded.latest_log_index
      `,
      [
        snapshot.chainId,
        snapshot.purchaseAddress,
        snapshot.buyerAddress,
        snapshot.sellerAddress,
        snapshot.tokenAddress,
        snapshot.symbol,
        snapshot.priceRaw,
        snapshot.collateralRaw,
        snapshot.priceDisplay,
        snapshot.collateralDisplay,
        snapshot.creationTxHash,
        snapshot.latestTxHash,
        snapshot.currentStatus,
        snapshot.currentCategory,
        snapshot.createdAtBlock,
        snapshot.updatedAtBlock,
        snapshot.createdAt,
        snapshot.updatedAt,
        snapshot.lastEventName,
        snapshot.createdLogIndex,
        snapshot.latestLogIndex,
      ]
    )
  }

  private async recordFailure(chainId: number, error: unknown) {
    await query(
      `
        update sync_checkpoints
        set consecutive_failures = consecutive_failures + 1,
            last_error = $2,
            updated_at = now()
        where chain_id = $1
      `,
      [chainId, String(error)]
    )
  }
}

export const isWalletAddress = (value: string) => isAddress(value)
