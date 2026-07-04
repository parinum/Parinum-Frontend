import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { URL } from 'node:url'
import { formatEther } from 'ethers'
import { query } from './db'
import { getIndexedChains } from './chains'
import { isWalletAddress } from './indexer'
import type { ProfilePurchaseItem, PurchaseAction, PurchaseCategory, PurchaseStatus } from './types'

type PurchaseRow = {
  chain_id: number | string
  purchase_address: string
  buyer_address: string
  seller_address: string
  token_address: string
  symbol: string
  current_status: PurchaseStatus
  current_category: PurchaseCategory
  price_display: string
  collateral_display: string
  latest_tx_hash: string
  created_at: Date | string
  updated_at: Date | string
}

type PurchaseEventRow = {
  event_name: string
  lifecycle_stage: string
  block_number: number | string
  block_timestamp: Date | string
  tx_hash: string
  log_index: number
  args: Record<string, unknown>
}

type SyncCheckpointRow = {
  chain_id: number | string
  last_scanned_block: number | string
  last_finalized_block: number | string
  sync_mode: 'backfill' | 'live'
  consecutive_failures: number
  last_error: string | null
  updated_at: Date | string
}

type PurchaseVolumeRow = {
  total_usd: string | number | null
  purchase_count: string | number
}

type WalletLogRow = {
  chain_id: number | string
  purchase_address: string
  buyer_address: string
  seller_address: string
  symbol: string
  event_name: string
  block_timestamp: Date | string
  tx_hash: string
  log_index: number
  args: Record<string, unknown>
}

const chains = getIndexedChains()
const chainMap = new Map(chains.map((chain) => [chain.chainId, chain]))

const sendJson = (response: ServerResponse, statusCode: number, payload: unknown) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.end(JSON.stringify(payload))
}

const getRoleAction = (status: PurchaseStatus, role: 'buyer' | 'seller'): PurchaseAction => {
  if (status === 'awaiting-confirmation') return role === 'seller' ? 'confirm' : 'abort'
  if (status === 'in-escrow' && role === 'buyer') return 'release'
  return null
}

const encodeCursor = (updatedAt: Date, chainId: number, purchaseAddress: string) =>
  Buffer.from(JSON.stringify({ updatedAt: updatedAt.toISOString(), chainId, purchaseAddress })).toString('base64url')

const decodeCursor = (value: string | null) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as {
      updatedAt: string
      chainId: number
      purchaseAddress: string
    }
    return parsed
  } catch {
    return null
  }
}

const parseChainIds = (searchParams: URL['searchParams']) => {
  const direct = searchParams.getAll('chainId')
  const combined = direct.flatMap((value) => value.split(','))
  const ids = combined.map((value) => Number(value.trim())).filter(Number.isFinite)
  return ids.length > 0 ? Array.from(new Set(ids)) : null
}

const buildProfileQuery = (wallet: string, requestUrl: URL) => {
  const values: unknown[] = [wallet]
  const where = ['(buyer_address = $1 or seller_address = $1)']

  const category = requestUrl.searchParams.get('category') as PurchaseCategory | null
  if (category === 'ongoing' || category === 'history') {
    values.push(category)
    where.push(`current_category = $${values.length}`)
  }

  const statuses = (requestUrl.searchParams.get('status') || '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => ['awaiting-confirmation', 'in-escrow', 'completed', 'aborted'].includes(part))

  if (statuses.length > 0) {
    values.push(statuses)
    where.push(`current_status = any($${values.length})`)
  }

  const chainIds = parseChainIds(requestUrl.searchParams)
  if (chainIds && chainIds.length > 0) {
    values.push(chainIds)
    where.push(`chain_id = any($${values.length})`)
  }

  const cursor = decodeCursor(requestUrl.searchParams.get('cursor'))
  if (cursor) {
    values.push(cursor.updatedAt)
    const updatedAtIndex = values.length
    values.push(cursor.chainId)
    const chainIdIndex = values.length
    values.push(cursor.purchaseAddress.toLowerCase())
    const purchaseIndex = values.length
    where.push(`(
      updated_at < $${updatedAtIndex}::timestamptz
      or (updated_at = $${updatedAtIndex}::timestamptz and chain_id > $${chainIdIndex})
      or (updated_at = $${updatedAtIndex}::timestamptz and chain_id = $${chainIdIndex} and purchase_address > $${purchaseIndex})
    )`)
  }

  const requestedLimit = Number(requestUrl.searchParams.get('limit') || '20')
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 20, 1), 100)
  values.push(limit + 1)

  return {
    sql: `
      select *
      from purchases
      where ${where.join(' and ')}
      order by updated_at desc, chain_id asc, purchase_address asc
      limit $${values.length}
    `,
    values,
    limit,
  }
}

const mapProfileItem = (wallet: string, row: PurchaseRow): ProfilePurchaseItem => {
  const isBuyer = String(row.buyer_address).toLowerCase() === wallet
  const role = isBuyer ? 'buyer' : 'seller'
  const chain = chainMap.get(Number(row.chain_id))

  return {
    chainId: Number(row.chain_id),
    purchaseId: row.purchase_address,
    role,
    counterparty: isBuyer ? row.seller_address : row.buyer_address,
    price: row.price_display,
    collateral: row.collateral_display,
    tokenAddress: row.token_address,
    symbol: row.symbol,
    status: row.current_status,
    category: row.current_category,
    action: getRoleAction(row.current_status, role),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    txHash: row.latest_tx_hash,
    explorerUrl: `${chain?.explorerAddressBaseUrl || ''}${row.purchase_address}`,
  }
}

const handleProfilePurchases = async (requestUrl: URL, response: ServerResponse, wallet: string) => {
  const normalizedWallet = wallet.toLowerCase()
  if (!isWalletAddress(normalizedWallet)) {
    sendJson(response, 400, { error: 'Invalid wallet address' })
    return
  }

  const built = buildProfileQuery(normalizedWallet, requestUrl)
  const result = await query<PurchaseRow>(built.sql, built.values)
  const rows = result.rows.slice(0, built.limit)
  const items = rows.map((row) => mapProfileItem(normalizedWallet, row))
  const last = rows[rows.length - 1]

  sendJson(response, 200, {
    items,
    pageInfo: {
      hasNextPage: result.rows.length > built.limit,
      nextCursor: result.rows.length > built.limit && last
        ? encodeCursor(new Date(last.updated_at), Number(last.chain_id), String(last.purchase_address))
        : null,
    },
  })
}

const handlePurchaseDetails = async (requestUrl: URL, response: ServerResponse, purchaseAddress: string) => {
  const chainId = Number(requestUrl.searchParams.get('chainId'))
  if (!Number.isFinite(chainId)) {
    sendJson(response, 400, { error: 'chainId is required' })
    return
  }

  const normalizedPurchaseAddress = purchaseAddress.toLowerCase()
  const purchaseResult = await query<PurchaseRow>(`select * from purchases where chain_id = $1 and purchase_address = $2`, [chainId, normalizedPurchaseAddress])
  if (!purchaseResult.rows[0]) {
    sendJson(response, 404, { error: 'Purchase not found' })
    return
  }

  const eventResult = await query<PurchaseEventRow>(
    `
      select event_name, lifecycle_stage, block_number, block_timestamp, tx_hash, log_index, args
      from purchase_events
      where chain_id = $1 and purchase_address = $2
      order by block_number asc, log_index asc
    `,
    [chainId, normalizedPurchaseAddress]
  )

  const purchase = purchaseResult.rows[0]
  sendJson(response, 200, {
    purchase: {
      chainId,
      purchaseId: purchase.purchase_address,
      buyer: purchase.buyer_address,
      seller: purchase.seller_address,
      tokenAddress: purchase.token_address,
      symbol: purchase.symbol,
      price: purchase.price_display,
      collateral: purchase.collateral_display,
      status: purchase.current_status,
      category: purchase.current_category,
      createdAt: new Date(purchase.created_at).toISOString(),
      updatedAt: new Date(purchase.updated_at).toISOString(),
      txHash: purchase.latest_tx_hash,
    },
    events: eventResult.rows.map((event) => ({
      eventName: event.event_name,
      lifecycleStage: event.lifecycle_stage,
      blockNumber: Number(event.block_number),
      blockTimestamp: new Date(event.block_timestamp).toISOString(),
      txHash: event.tx_hash,
      logIndex: event.log_index,
      args: event.args,
    })),
  })
}

const handleHealth = async (response: ServerResponse) => {
  const enabledChainIds = Array.from(chainMap.keys())
  if (enabledChainIds.length === 0) {
    sendJson(response, 200, { ok: true, chains: [] })
    return
  }

  const result = await query<SyncCheckpointRow>(
    `select * from sync_checkpoints where chain_id = any($1) order by chain_id asc`,
    [enabledChainIds]
  )
  const items = await Promise.all(
    result.rows.map(async (row) => {
      const chain = chainMap.get(Number(row.chain_id))
      let headBlock: number | null = null

      if (chain?.rpcUrls[0]) {
        try {
          const { JsonRpcProvider } = await import('ethers')
          const provider = new JsonRpcProvider(chain.rpcUrls[0])
          headBlock = await provider.getBlockNumber()
        } catch {
          headBlock = null
        }
      }

      const lastFinalizedBlock = Number(row.last_finalized_block)
      return {
        chainId: Number(row.chain_id),
        lastScannedBlock: Number(row.last_scanned_block),
        lastFinalizedBlock,
        headBlock,
        lagBlocks: headBlock == null ? null : Math.max(headBlock - lastFinalizedBlock, 0),
        syncMode: row.sync_mode,
        consecutiveFailures: row.consecutive_failures,
        lastError: row.last_error,
        updatedAt: new Date(row.updated_at).toISOString(),
      }
    })
  )

  sendJson(response, 200, {
    ok: items.every((item) => item.consecutiveFailures === 0),
    chains: items,
  })
}

const handleTotalVolumeUsd = async (response: ServerResponse) => {
  const result = await query<PurchaseVolumeRow>(
    `
      select
        coalesce(sum(price_display::numeric), 0) as total_usd,
        count(*) as purchase_count
      from purchases
      where current_status = 'completed'
    `
  )

  const row = result.rows[0]
  const totalUsd = row?.total_usd == null ? '0' : String(row.total_usd)
  const completedPurchaseCount = Number(row?.purchase_count ?? 0)

  sendJson(response, 200, {
    totalUsd,
    completedPurchaseCount,
    symbolsIncluded: 'all',
  })
}

const handleWalletLogs = async (requestUrl: URL, response: ServerResponse, wallet: string) => {
  const normalizedWallet = wallet.toLowerCase()
  if (!isWalletAddress(normalizedWallet)) {
    sendJson(response, 400, { error: 'Invalid wallet address' })
    return
  }

  const values: unknown[] = [normalizedWallet]
  const where = ['(p.buyer_address = $1 or p.seller_address = $1)']

  const chainIds = parseChainIds(requestUrl.searchParams)
  if (chainIds && chainIds.length > 0) {
    values.push(chainIds)
    where.push(`p.chain_id = any($${values.length})`)
  }

  const trackedEvents = [
    'BuyerUnresolvedPurchase',
    'SellerUnresolvedPurchase',
    'BuyerCompletedPurchase',
    'SellerCompletedPurchase',
  ]
  values.push(trackedEvents)
  where.push(`pe.event_name = any($${values.length})`)

  const requestedLimit = Number(requestUrl.searchParams.get('limit') || '200')
  const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 200, 1), 1000)
  values.push(limit)

  const result = await query<WalletLogRow>(
    `
      select
        p.chain_id,
        p.purchase_address,
        p.buyer_address,
        p.seller_address,
        p.symbol,
        pe.event_name,
        pe.block_timestamp,
        pe.tx_hash,
        pe.log_index,
        pe.args
      from purchase_events pe
      inner join purchases p
        on p.chain_id = pe.chain_id
       and p.purchase_address = pe.purchase_address
      where ${where.join(' and ')}
      order by pe.block_timestamp desc, pe.block_number desc, pe.log_index desc
      limit $${values.length}
    `,
    values
  )

  const items = result.rows.map((row) => {
    let action = 'Unknown'
    if (row.event_name === 'BuyerUnresolvedPurchase') action = 'Purchase Confirmed (Buyer)'
    if (row.event_name === 'SellerUnresolvedPurchase') action = 'Purchase Confirmed (Seller)'
    if (row.event_name === 'BuyerCompletedPurchase') action = 'Purchase Completed (Buyer)'
    if (row.event_name === 'SellerCompletedPurchase') action = 'Purchase Completed (Seller)'

    const args = row.args || {}
    const buyer = typeof args.buyer === 'string' ? args.buyer : row.buyer_address
    const seller = typeof args.seller === 'string' ? args.seller : row.seller_address

    let amount: string | undefined
    if (row.event_name.includes('Completed')) {
      const rawEthValue = typeof args.ethValue === 'string' ? args.ethValue : null
      if (rawEthValue && /^\d+$/.test(rawEthValue)) {
        amount = `${formatEther(BigInt(rawEthValue))} ${row.symbol || chainMap.get(Number(row.chain_id))?.nativeSymbol || ''}`.trim()
      }
    }

    return {
      id: `${row.tx_hash}-${row.log_index}`,
      chainId: Number(row.chain_id),
      purchaseId: row.purchase_address,
      timestamp: new Date(row.block_timestamp).toISOString(),
      action,
      status: 'success',
      txHash: row.tx_hash,
      from: row.event_name.startsWith('Seller') ? seller : buyer,
      to: row.event_name.startsWith('Seller') ? buyer : seller,
      amount,
      gasUsed: null,
      isError: false,
    }
  })

  sendJson(response, 200, { items })
}

export const createApiServer = () =>
  createServer(async (request: IncomingMessage, response: ServerResponse) => {
    try {
      if (request.method === 'OPTIONS') {
        sendJson(response, 200, {})
        return
      }

      if (request.method !== 'GET' || !request.url) {
        sendJson(response, 405, { error: 'Method not allowed' })
        return
      }

      const requestUrl = new URL(request.url, 'http://localhost')
      if (requestUrl.pathname === '/healthz') {
        await handleHealth(response)
        return
      }

      if (requestUrl.pathname === '/stats/total-volume-usd') {
        await handleTotalVolumeUsd(response)
        return
      }

      const walletLogsMatch = requestUrl.pathname.match(/^\/logs\/([^/]+)$/)
      if (walletLogsMatch) {
        await handleWalletLogs(requestUrl, response, walletLogsMatch[1])
        return
      }

      const profileMatch = requestUrl.pathname.match(/^\/profile\/([^/]+)\/purchases$/)
      if (profileMatch) {
        await handleProfilePurchases(requestUrl, response, profileMatch[1])
        return
      }

      const purchaseMatch = requestUrl.pathname.match(/^\/purchases\/([^/]+)$/)
      if (purchaseMatch) {
        await handlePurchaseDetails(requestUrl, response, purchaseMatch[1])
        return
      }

      sendJson(response, 404, { error: 'Not found' })
    } catch (error) {
      console.error('API request failed', error)
      sendJson(response, 500, { error: 'Internal server error' })
    }
  })
