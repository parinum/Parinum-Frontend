const getNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

const getList = (value: string | undefined) =>
  (value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

export const env = {
  databaseUrl: process.env.PROFILE_INDEXER_DATABASE_URL || '',
  databaseSsl: getBoolean(process.env.PROFILE_INDEXER_DATABASE_SSL, false),
  host: process.env.PROFILE_INDEXER_HOST || '0.0.0.0',
  port: getNumber(process.env.PROFILE_INDEXER_PORT, 4100),
  pollIntervalMs: getNumber(process.env.PROFILE_INDEXER_POLL_INTERVAL_MS, 15_000),
  chainConcurrency: Math.max(1, getNumber(process.env.PROFILE_INDEXER_CHAIN_CONCURRENCY, 1)),
  maxRateLimitRetries: Math.max(0, getNumber(process.env.PROFILE_INDEXER_MAX_RATE_LIMIT_RETRIES, 5)),
  rateLimitBackoffBaseMs: Math.max(100, getNumber(process.env.PROFILE_INDEXER_RATE_LIMIT_BACKOFF_BASE_MS, 1_000)),
  rpcParallelRequests: Math.max(1, getNumber(process.env.PROFILE_INDEXER_RPC_PARALLEL_REQUESTS, 1)),
  defaultBatchSize: getNumber(process.env.PROFILE_INDEXER_BATCH_SIZE, 2_000),
  defaultFinalityBufferBlocks: getNumber(process.env.PROFILE_INDEXER_FINALITY_BUFFER_BLOCKS, 20),
  enabledChainIds: getList(process.env.PROFILE_INDEXER_CHAINS).map((value) => Number(value)).filter(Number.isFinite),
}

export const requireDatabaseUrl = () => {
  if (!env.databaseUrl) {
    throw new Error('PROFILE_INDEXER_DATABASE_URL is required')
  }

  return env.databaseUrl
}

export const getChainBatchSize = (chainId: number) =>
  getNumber(process.env[`PROFILE_INDEXER_BATCH_SIZE_${chainId}`], env.defaultBatchSize)

export const getChainFinalityBuffer = (chainId: number) =>
  getNumber(process.env[`PROFILE_INDEXER_FINALITY_BUFFER_BLOCKS_${chainId}`], env.defaultFinalityBufferBlocks)

export const getRpcUrlList = (keys: string[]) => {
  const values = keys.flatMap((key) => getList(process.env[key]))
  return Array.from(new Set(values))
}
