import { Contract, Interface, JsonRpcProvider, ZeroAddress, ethers } from 'ethers'
import { readdirSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { getIndexedChains } from './chains'
import { query } from './db'
import { env } from './env'
import { derivePurchaseSnapshot } from './purchaseState'
import type { IndexedChainConfig, LifecycleStage, NormalizedEvent, PurchaseSnapshot } from './types'

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

const unitToChainId: Record<string, number> = {
  ETH: 1,
  BNB: 56,
  POL: 137,
}

const erc20Abi = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
] as const

type SeedOptions = {
  csvPaths: string[]
  reset: boolean
}

type CsvRow = {
  txHash: string
  chainId: number
}

const sleep = (ms: number) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

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

const splitCsvLine = (line: string) => {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"') {
      const nextChar = line[index + 1]
      if (inQuotes && nextChar === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      fields.push(current)
      current = ''
      continue
    }

    current += char
  }

  fields.push(current)
  return fields.map((field) => field.trim())
}

const parseChainIdFromHeader = (headerLine: string) => {
  const match = headerLine.match(/Value_IN\(([^)]+)\)/i)
  if (!match) return null
  const unit = (match[1] || '').trim().toUpperCase()
  return unitToChainId[unit] ?? null
}

const parseCsvFile = (filePath: string): CsvRow[] => {
  const content = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) return []

  const chainId = parseChainIdFromHeader(lines[0])
  if (!chainId) {
    throw new Error(`Unable to determine chain from CSV header: ${filePath}`)
  }

  const headers = splitCsvLine(lines[0])
  const txHashIndex = headers.findIndex((header) => header.toLowerCase() === 'transaction hash')
  if (txHashIndex === -1) {
    throw new Error(`CSV missing Transaction Hash column: ${filePath}`)
  }

  const rows: CsvRow[] = []
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = splitCsvLine(lines[lineIndex])
    const txHash = (values[txHashIndex] || '').toLowerCase()
    if (!txHash.startsWith('0x') || txHash.length !== 66) continue
    rows.push({ txHash, chainId })
  }

  return rows
}

const collectCsvPaths = (providedPaths: string[]) => {
  if (providedPaths.length > 0) {
    return providedPaths.map((path) => resolve(path))
  }

  return readdirSync(process.cwd())
    .filter((name) => name.toLowerCase().endsWith('.csv'))
    .map((name) => resolve(process.cwd(), name))
}

class SeedRpcClient {
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

  getTransactionReceipt(txHash: string) {
    return this.tryAll(`getTransactionReceipt(${txHash})`, (provider) => provider.getTransactionReceipt(txHash))
  }

  getPrimaryProvider() {
    return this.providers[0]
  }
}

class CsvSeedImporter {
  private readonly rpcClients = new Map<number, SeedRpcClient>()
  private readonly tokenMetaCache = new Map<string, { symbol: string; decimals: number }>()

  constructor(private readonly chains: IndexedChainConfig[]) {}

  private getRpc(chain: IndexedChainConfig) {
    const existing = this.rpcClients.get(chain.chainId)
    if (existing) return existing
    const created = new SeedRpcClient(chain)
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

  private async clearChainData(chainId: number) {
    await query(`delete from purchase_events where chain_id = $1`, [chainId])
    await query(`delete from purchases where chain_id = $1`, [chainId])
  }

  private async getTokenMetadata(chain: IndexedChainConfig, tokenAddress: string) {
    const normalizedAddress = String(tokenAddress).toLowerCase()
    if (!normalizedAddress || normalizedAddress === ZeroAddress.toLowerCase()) {
      return { symbol: chain.nativeSymbol, decimals: 18 }
    }

    const cacheKey = `${chain.chainId}:${normalizedAddress}`
    const cached = this.tokenMetaCache.get(cacheKey)
    if (cached) return cached

    const provider = this.getRpc(chain).getPrimaryProvider()
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

  private async moveCheckpointToLive(chain: IndexedChainConfig) {
    const rpc = this.getRpc(chain)
    const headBlock = await rpc.getBlockNumber()
    const finalizedBlock = Math.max(chain.deploymentBlock, headBlock - chain.finalityBufferBlocks)
    const finalizedHash = (await rpc.getBlock(finalizedBlock))?.hash || null

    await query(
      `
        update sync_checkpoints
        set sync_mode = 'live',
            next_from_block = $2,
            last_scanned_block = $3,
            last_finalized_block = $3,
            last_seen_block_hash = $4,
            consecutive_failures = 0,
            last_error = null,
            updated_at = now()
        where chain_id = $1
      `,
      [chain.chainId, finalizedBlock + 1, finalizedBlock, finalizedHash]
    )

    return { headBlock, finalizedBlock }
  }

  private async seedChainFromTransactions(chain: IndexedChainConfig, txHashes: string[]) {
    const rpc = this.getRpc(chain)
    const iface = new Interface(chain.factoryAbi)

    const blockNumbers = new Set<number>()
    const bufferedLogs: Array<{ log: ethers.Log; parsed: ethers.LogDescription; args: Record<string, unknown> }> = []

    for (const txHash of txHashes) {
      const receipt = await rpc.getTransactionReceipt(txHash)
      if (!receipt) {
        console.warn(`Chain ${chain.chainId}: missing receipt for ${txHash}`)
        continue
      }

      blockNumbers.add(receipt.blockNumber)

      for (const log of receipt.logs) {
        const logAddress = String(log.address || '').toLowerCase()
        if (logAddress !== chain.factoryAddress.toLowerCase()) continue

        try {
          const parsed = iface.parseLog(log)
          if (!parsed) continue
          const args = getEventArgs(parsed)
          bufferedLogs.push({ log, parsed, args })
          blockNumbers.add(log.blockNumber)
        } catch {
          continue
        }
      }
    }

    const blockMap = new Map<number, { hash: string; timestamp: Date }>()
    for (const blockNumber of blockNumbers) {
      const block = await rpc.getBlock(blockNumber)
      if (!block?.hash || block.timestamp == null) continue
      blockMap.set(blockNumber, {
        hash: block.hash,
        timestamp: new Date(Number(block.timestamp) * 1000),
      })
    }

    const events: NormalizedEvent[] = []
    for (const { log, parsed, args } of bufferedLogs) {
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

    events.sort((left, right) => {
      if (left.blockNumber !== right.blockNumber) return left.blockNumber - right.blockNumber
      return left.logIndex - right.logIndex
    })

    const affectedAddresses = await this.persistEvents(events)
    await this.rebuildPurchases(chain.chainId, affectedAddresses)

    return { importedEvents: events.length, affectedPurchases: affectedAddresses.length }
  }

  async seedFromCsv(options: SeedOptions) {
    const csvPaths = collectCsvPaths(options.csvPaths)
    if (csvPaths.length === 0) {
      throw new Error('No CSV files found. Provide CSV paths or place them in the current working directory.')
    }

    const chainsById = new Map(this.chains.map((chain) => [chain.chainId, chain]))
    const hashesByChain = new Map<number, Set<string>>()

    for (const csvPath of csvPaths) {
      const rows = parseCsvFile(csvPath)
      for (const row of rows) {
        if (!chainsById.has(row.chainId)) continue
        const bucket = hashesByChain.get(row.chainId) || new Set<string>()
        bucket.add(row.txHash)
        hashesByChain.set(row.chainId, bucket)
      }
    }

    for (const chain of this.chains) {
      await this.ensureChainRows(chain)
      if (options.reset) {
        await this.clearChainData(chain.chainId)
      }

      const txHashes = Array.from(hashesByChain.get(chain.chainId) || [])
      const seedResult = txHashes.length > 0
        ? await this.seedChainFromTransactions(chain, txHashes)
        : { importedEvents: 0, affectedPurchases: 0 }

      const liveResult = await this.moveCheckpointToLive(chain)

      console.log(
        `Seeded chain ${chain.chainId}: txs=${txHashes.length} importedEvents=${seedResult.importedEvents} ` +
          `purchases=${seedResult.affectedPurchases} finalizedBlock=${liveResult.finalizedBlock} head=${liveResult.headBlock}`
      )
    }
  }
}

const parseArgs = (args: string[]) => {
  let reset = false
  const csvPaths: string[] = []

  for (const arg of args) {
    if (arg === '--reset') {
      reset = true
      continue
    }

    csvPaths.push(arg)
  }

  return { csvPaths, reset }
}

export const runSeedFromCsv = async (args: string[]) => {
  const chains = getIndexedChains()
  if (chains.length === 0) {
    throw new Error('No backend chains are configured. Set PROFILE_INDEXER_RPC_URL_* and PROFILE_INDEXER_CHAINS.')
  }

  const options = parseArgs(args)
  const importer = new CsvSeedImporter(chains)
  await importer.seedFromCsv(options)
}