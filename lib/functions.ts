import { ethers } from 'ethers'
import { config } from './wagmiConfig'
import { getConnectorClient, getPublicClient } from '@wagmi/core'
import {
  GovernorContract__factory,
  PRMICO__factory,
  PRM__factory,
  RewardsPool__factory,
} from '@parinum/contracts/typechain-types'
import {
  getParinumFactoryInterface,
  getParinumNetworkConfig,
  getCoreContractAddresses,
  supportedParinumChainIds,
} from './parinum'

// Lightweight in-memory cache with TTL to reduce repeated read calls
class _Cache {
  private m = new Map<string, { v: any; t: number }>()
  constructor(private ttlMs = 60_000) {}
  get<T>(k: string): T | null {
    const e = this.m.get(k)
    if (!e) return null
    if (Date.now() - e.t > this.ttlMs) {
      this.m.delete(k)
      return null
    }
    return e.v as T
  }
  set<T>(k: string, v: T) {
    this.m.set(k, { v, t: Date.now() })
  }
  clear() { this.m.clear() }
}
export const readCache = new _Cache(45_000)

// Type definitions
export interface PurchaseDetails {
  id: string
  seller: string
  buyer: string
  price: string
  collateral: string
  tokenAddress: string
  /** Display symbol for price/collateral (native symbol or ERC-20 ticker) */
  symbol: string
  status: 'inactive' | 'created' | 'confirmed' | 'failed'
  timestamp: Date
}

export interface TransactionResult {
  success: boolean
  txHash?: string
  error?: string
  purchaseId?: string
}

// Staking-related interfaces
export interface StakeInfo {
  totalAmount: string
  totalRewardAmount: string
  availableAmount: string
  availableRewardAmount: string
}

export interface StakeData {
  amount: string
  stakeTime: number
  startTime: number
  multiplier: string
  rewards: string
  isAvailable: boolean
}

// PRM Funding-related interfaces
export interface IcoInfo {
  poolPRM: string
  poolETH: string
  deploymentTime: string
  timeLimit: string
  weightedETHRaised: string
  soldAmount: string
}

export interface AccountIcoInfo {
  contribution: string
  weightedContribution: string
  ethReceived: string
  prmWithdrawn: string
}

type ReadOptions = {
  forceRefresh?: boolean
  targetChainId?: number
}

// Governance-related interfaces
export interface ProposalInfo {
  id: string
  proposer: string
  targets: string[]
  values: string[]
  calldatas: string[]
  description: string
  state: number // 0: Pending, 1: Active, 2: Canceled, 3: Defeated, 4: Succeeded, 5: Queued, 6: Expired, 7: Executed
  startBlock: string
  endBlock: string
  forVotes: string
  againstVotes: string
  abstainVotes: string
}

export interface VotingPower {
  balance: string
  delegatedBalance: string
}

export interface TransactionLog {
  id: string
  timestamp: Date
  action: string
  status: 'success' | 'pending' | 'failed'
  txHash: string
  from: string
  to: string
  amount?: string
  gasUsed?: string
  message?: string
  isError?: boolean
}

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

const getCoreAddresses = (chainId?: number | null) => {
  const effectiveChainId = chainId || 1
  const net = getParinumNetworkConfig(effectiveChainId)
  const envKey = net?.envKey
  let deployedAddresses = getCoreContractAddresses(effectiveChainId)

  // Fallback to Chain 1 if addresses not found for current chain
  if (!deployedAddresses) {
    deployedAddresses = getCoreContractAddresses(1)
  }
  
  const pick = (key: string) => {
    const envVal = (envKey && process.env[`NEXT_PUBLIC_PARINUM_${key}_${envKey}`]?.trim()) ||
    process.env[`NEXT_PUBLIC_PARINUM_${key}`]?.trim()

    if (envVal) return envVal

    if (deployedAddresses) {
      if (key === 'REWARDS_POOL') return deployedAddresses.rewardsPool
      return (deployedAddresses as any)[key.toLowerCase()] || ''
    }

    return ''
  }

  return {
    ico: pick('ICO'),
    prm: pick('PRM'),
    rewardsPool: pick('REWARDS_POOL'),
    governor: pick('GOVERNOR'),
    timelock: pick('TIMELOCK'),
  }
}

const defaultIds = getCoreAddresses(1)

export const contractAddresses = {
  crowdfunder: defaultIds.ico,
  prm: defaultIds.prm,
  rewardsPool: defaultIds.rewardsPool,
  governor: defaultIds.governor,
  timelock: defaultIds.timelock,
}

const getRpcUrlForChain = (chainId?: number | null) => {
  const chain = config.chains.find((c) => c.id === (chainId || 0))
  const urls = chain?.rpcUrls?.default?.http || []
  return urls[0]
}

const getRpcUrlsForChain = (chainId?: number | null) => {
  const effectiveChainId = chainId || 1
  const chain = config.chains.find((c) => c.id === effectiveChainId)
  const urls: string[] = []

  const chainEnvCandidates: Record<number, Array<string | undefined>> = {
    1: [
      process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
      process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
      process.env.NEXT_PUBLIC_RPC_URL,
    ],
    56: [
      process.env.NEXT_PUBLIC_BSC_RPC_URL,
      process.env.NEXT_PUBLIC_BINANCE_RPC_URL,
      process.env.NEXT_PUBLIC_RPC_URL_BSC,
      process.env.NEXT_PUBLIC_RPC_URL,
    ],
    137: [
      process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
      process.env.NEXT_PUBLIC_MATIC_RPC_URL,
      process.env.NEXT_PUBLIC_RPC_URL_POLYGON,
      process.env.NEXT_PUBLIC_RPC_URL,
    ],
  }

  const envCandidates = chainEnvCandidates[effectiveChainId] || [process.env.NEXT_PUBLIC_RPC_URL]

  for (const candidate of envCandidates) {
    if (candidate?.trim()) {
      urls.push(candidate.trim())
    }
  }

  if (effectiveChainId === 1) {
    // Etherscan v2 handles log scanning for ETH. Keep 2 reliable RPCs for
    // block number, state reads, and timestamp lookups only.
    urls.push(
      'https://ethereum.publicnode.com',
      'https://eth.drpc.org'
    )
  } else if (effectiveChainId === 56) {
    // NodeReal is CORS-friendly and serves eth_getLogs (50k block limit handled
    // by the parallel chunked scanner below). Binance dataseed nodes are kept
    // as fallbacks for block number and state reads.
    urls.push(
      'https://bsc-mainnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5',
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.binance.org'
    )
  } else if (effectiveChainId === 137) {
    // Etherscan v2 handles log scanning for Polygon. drpc.org covers the rest.
    urls.push(
      'https://polygon.drpc.org'
    )
  } else {
    for (const url of chain?.rpcUrls?.default?.http || []) {
      urls.push(url)
    }
  }

  return [...new Set(urls.filter(Boolean))]
}

const RPC_TIMEOUT_MS = 2_500
const preferredRpcUrlByChain = new Map<number, string>()
const rpcUrlCooldownUntil = new Map<string, number>()
const RATE_LIMIT_COOLDOWN_MS = 90_000

const isRpcUrlCoolingDown = (url: string) => {
  const until = rpcUrlCooldownUntil.get(url)
  return typeof until === 'number' && until > Date.now()
}

const markRpcUrlRateLimited = (url: string) => {
  rpcUrlCooldownUntil.set(url, Date.now() + RATE_LIMIT_COOLDOWN_MS)
}

const rpcRequest = async <T>(
  url: string,
  method: string,
  params: unknown[],
  timeoutMs: number = RPC_TIMEOUT_MS
): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `${method}-${Date.now()}`,
        method,
        params,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`RPC request failed with status ${response.status}`)
    }

    const payload = (await response.json()) as {
      result?: T
      error?: { message?: string }
    }

    if (payload.error) {
      throw new Error(payload.error.message || 'RPC request failed')
    }

    if (typeof payload.result === 'undefined') {
      throw new Error('RPC response missing result')
    }

    return payload.result
  } finally {
    clearTimeout(timeoutId)
  }
}

const rpcRequestWithFallback = async <T>(
  chainId: number,
  method: string,
  params: unknown[],
  timeoutMs: number = RPC_TIMEOUT_MS
): Promise<T> => {
  const rpcUrls = getRpcUrlsForChain(chainId)
  const preferredUrl = preferredRpcUrlByChain.get(chainId)
  let lastError: unknown = null

  const activeRpcUrls = rpcUrls.filter((url) => !isRpcUrlCoolingDown(url))

  if (preferredUrl && !isRpcUrlCoolingDown(preferredUrl)) {
    try {
      return await rpcRequest<T>(preferredUrl, method, params, timeoutMs)
    } catch (error) {
      lastError = error
      if (chainId === 56 && looksLikeAlchemyGetLogsPlanLimit(error)) {
        throw new Error(
          'Alchemy BSC free tier allows only 10-block eth_getLogs ranges. Upgrade to PAYG or use another dedicated BSC RPC URL.'
        )
      }
      if (looksLikeRateLimit(error)) {
        markRpcUrlRateLimited(preferredUrl)
      }
      preferredRpcUrlByChain.delete(chainId)
    }
  }

  const candidateUrls = activeRpcUrls.filter((url) => url !== preferredUrl)
  if (!candidateUrls.length) {
    if (chainId === 56) {
      throw new Error(
        'BSC RPC endpoints are rate-limited. Set NEXT_PUBLIC_BSC_RPC_URL to a dedicated BSC endpoint and retry.'
      )
    }
    throw new Error(formatEthersError(lastError) || `Unable to reach RPC for chain ${chainId}`)
  }

  try {
    for (const url of candidateUrls) {
      try {
        const result = await rpcRequest<T>(url, method, params, timeoutMs)
        preferredRpcUrlByChain.set(chainId, url)
        return result
      } catch (error) {
        lastError = error
        if (chainId === 56 && looksLikeAlchemyGetLogsPlanLimit(error)) {
          throw new Error(
            'Alchemy BSC free tier allows only 10-block eth_getLogs ranges. Upgrade to PAYG or use another dedicated BSC RPC URL.'
          )
        }
        if (looksLikeRateLimit(error)) {
          markRpcUrlRateLimited(url)
        }
      }
    }
  } catch (error) {
    lastError = error
  }

  throw new Error(formatEthersError(lastError) || `Unable to reach RPC for chain ${chainId}`)
}

const parseHexBigInt = (value: string) => BigInt(value)

const readContractValue = async (
  chainId: number,
  to: string,
  data: string
) => rpcRequestWithFallback<string>(chainId, 'eth_call', [{ to, data }, 'latest'])

const getReadOnlyProvider = (chainId?: number | null) => {
  const effectiveChainId = chainId || 1
  const chain = config.chains.find((c) => c.id === effectiveChainId)

  if (!chain) {
    throw new Error(`Unsupported read chain ${effectiveChainId}`)
  }

  const rpcUrls = getRpcUrlsForChain(effectiveChainId)
  if (!rpcUrls.length) {
    throw new Error(`Missing RPC URL for chain ${effectiveChainId}`)
  }

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: (chain.contracts as any)?.ensRegistry?.address,
  }

  // Use one explicit endpoint at a time for ethers provider reads. Some public
  // endpoints respond in ways that cause provider-level coalescing errors on
  // BSC/Polygon when mixed in FallbackProvider.
  const preferred = preferredRpcUrlByChain.get(effectiveChainId)
  const selected = preferred && rpcUrls.includes(preferred) ? preferred : rpcUrls[0]
  return new ethers.JsonRpcProvider(selected, network)
}

const getSafeBlockNumber = async (chainId: number, provider: ethers.Provider): Promise<number> => {
  try {
    const hex = await rpcRequestWithFallback<string>(chainId, 'eth_blockNumber', [], LOGS_TIMEOUT_MS)
    return Number(parseHexBigInt(hex))
  } catch {
    return provider.getBlockNumber()
  }
}

const getSafeBlockTimestamp = async (
  chainId: number,
  provider: ethers.Provider,
  blockNumber: number
): Promise<Date | null> => {
  const blockTag = '0x' + Math.max(0, Math.floor(blockNumber)).toString(16)
  try {
    const block = await rpcRequestWithFallback<{ timestamp?: string }>(
      chainId,
      'eth_getBlockByNumber',
      [blockTag, false],
      LOGS_TIMEOUT_MS
    )
    if (block?.timestamp) {
      return new Date(Number(parseHexBigInt(block.timestamp)) * 1000)
    }
  } catch {
    // fall through to provider path
  }

  try {
    const block = await provider.getBlock(blockNumber)
    if (block?.timestamp) return new Date(Number(block.timestamp) * 1000)
  } catch {
    // tolerate missing block metadata from flaky endpoints
  }
  return null
}

// Contract ABIs (simplified - you should import the full ABIs)
const erc20ABI = [
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function symbol() view returns (string)"
]

const isNativeTokenAddress = (address?: string) =>
  !address ||
  address === '0' ||
  address.toLowerCase() === ethers.ZeroAddress.toLowerCase()

const formatEthersError = (error: unknown) => {
  if (typeof error === 'object' && error) {
    const err = error as { shortMessage?: string; reason?: string; message?: string }
    return err.shortMessage || err.reason || err.message || 'Unknown error'
  }
  if (error instanceof Error) return error.message
  return 'Unknown error'
}

const resolveChainContext = async () => {
  const { signer, provider, chainId: initChainId } = await initProvider()
  const network = await provider.getNetwork()
  const chainId = initChainId || Number(network.chainId)
  return { signer, provider, chainId }
}

const getRewardsPoolContext = async () => {
  const ctx = await resolveChainContext()
  const addresses = getCoreAddresses(ctx.chainId)
  if (!addresses.rewardsPool) {
    throw new Error('RewardsPool address not configured')
  }
  const signerAddress = await ctx.signer?.getAddress()
  return {
    ...ctx,
    poolAddress: addresses.rewardsPool,
    prmAddress: addresses.prm,
    signerAddress,
    poolContract: RewardsPool__factory.connect(addresses.rewardsPool, ctx.signer),
  }
}

const getGovernorContext = async () => {
  const ctx = await resolveChainContext()
  const addresses = getCoreAddresses(ctx.chainId)
  if (!addresses.governor) {
    throw new Error('Governor contract address not configured')
  }
  return {
    ...ctx,
    governorAddress: addresses.governor,
    governorContract: GovernorContract__factory.connect(addresses.governor, ctx.signer),
    prmAddress: addresses.prm,
  }
}

// Initialize Web3 provider
export const initProvider = async () => {
  try {
    const client = await getConnectorClient(config)
    const { account, chain, transport } = client
    const network = {
      chainId: chain.id,
      name: chain.name,
      ensAddress: (chain.contracts as any)?.ensRegistry?.address,
    }
    
    // Create an Ethers provider using the Viem client transport
    const provider = new ethers.BrowserProvider(transport as any, network)
    const signer = new ethers.JsonRpcSigner(provider, account.address)
    
    return { provider, signer, account: account.address, chainId: chain.id }
  } catch (error) {
    // Fallback to public provider if wallet not connected
    try {
      const client = getPublicClient(config)
      if (!client) throw error

      const { chain, transport } = client
      const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: (chain.contracts as any)?.ensRegistry?.address,
      }
      
      const provider = new ethers.JsonRpcProvider(
        (transport as any).url || chain.rpcUrls.default.http[0], 
        network
      )
      
      return { 
        provider, 
        signer: undefined, 
        account: undefined, 
        chainId: chain.id 
      }
    } catch (fallbackError) {
      console.error('Failed to initialize provider:', error)
      throw error
    }
  }
}

// Create a new purchase
export const createPurchase = async (
  seller: string,
  price: string,
  collateral: string,
  tokenAddress: string
): Promise<TransactionResult> => {
  try {
    const { signer, provider, chainId: initialChainId } = await initProvider()
    const network = await provider.getNetwork()
    const chainId = initialChainId || Number(network.chainId)
    const parinumConfig = getParinumNetworkConfig(chainId)

    if (!parinumConfig) {
      return {
        success: false,
        error: `Unsupported network (chainId ${chainId || 'unknown'})`,
      }
    }
    if (!parinumConfig.factoryAddress) {
      return {
        success: false,
        error: `ParinumFactory address not configured for ${parinumConfig.name}`,
      }
    }
    if (!ethers.isAddress(seller)) {
      return { success: false, error: 'Invalid seller address' }
    }

    const sellerAddress = ethers.getAddress(seller)
    const tokenIsNative = isNativeTokenAddress(tokenAddress)
    const normalizedToken = tokenIsNative
      ? ethers.ZeroAddress
      : ethers.getAddress(tokenAddress)

    const token =
      tokenIsNative || normalizedToken === ethers.ZeroAddress
        ? null
        : new ethers.Contract(normalizedToken, erc20ABI, signer)

    const tokenDecimals =
      token && typeof token.decimals === 'function'
        ? await token.decimals()
        : 18

    const parsedPrice = tokenIsNative
      ? ethers.parseEther(price || '0')
      : ethers.parseUnits(price || '0', tokenDecimals)
    const parsedCollateral = tokenIsNative
      ? ethers.parseEther(collateral || '0')
      : ethers.parseUnits(collateral || '0', tokenDecimals)

    const factory = new ethers.Contract(
      parinumConfig.factoryAddress,
      parinumConfig.factoryAbi,
      signer
    )

    const createContractTx = await factory.createContract()
    const createContractReceipt = await createContractTx.wait()

    const factoryInterface =
      getParinumFactoryInterface(chainId) ||
      new ethers.Interface(parinumConfig.factoryAbi)

    const purchaseIdFromEvent = (() => {
      if (!createContractReceipt?.logs?.length) return ''
      for (const log of createContractReceipt.logs) {
        try {
          const parsed = factoryInterface.parseLog(log)
          if (
            parsed?.name === 'CreatedContract' ||
            parsed?.name === 'CreatedPurchase'
          ) {
            const arg = parsed.args?.purchaseId ?? parsed.args?.[0]
            if (arg) return arg as string
          }
        } catch {
          continue
        }
      }
      return ''
    })()

    const purchaseId =
      purchaseIdFromEvent ||
      createContractReceipt?.logs.find(
        (log: any) =>
          log.address.toLowerCase() !==
          parinumConfig.factoryAddress.toLowerCase()
      )?.address

    if (!purchaseId) {
      return {
        success: false,
        error: 'Could not determine purchase contract address',
      }
    }

    const purchaseContract = new ethers.Contract(
      purchaseId,
      parinumConfig.cloneAbi,
      signer
    )

    let tx
    if (tokenIsNative) {
      const value = parsedPrice + parsedCollateral
      tx = await purchaseContract.createPurchase(
        sellerAddress,
        parsedPrice,
        parsedCollateral,
        ethers.ZeroAddress,
        { value }
      )
    } else {
      const total = parsedPrice + parsedCollateral
      if (!token) {
        return { success: false, error: 'Token contract could not be created' }
      }
      const approval = await token.approve(purchaseId, total)
      await approval.wait()

      tx = await purchaseContract.createPurchase(
        sellerAddress,
        parsedPrice,
        parsedCollateral,
        normalizedToken
      )
    }

    const receipt = await tx.wait()

    return {
      success: true,
      purchaseId,
      txHash: receipt?.hash,
    }
  } catch (error) {
    return {
      success: false,
      error: formatEthersError(error),
    }
  }
}

// Confirm a purchase (seller locks collateral)
export const confirmPurchase = async (purchaseId: string): Promise<TransactionResult> => {
  try {
    const { signer, provider, chainId: initialChainId } = await initProvider()
    const network = await provider.getNetwork()
    console.log('Network:', network)
    const chainId = initialChainId || Number(network.chainId)
    const parinumConfig = getParinumNetworkConfig(chainId)

    if (!parinumConfig) {
      return {
        success: false,
        error: `Unsupported network (chainId ${chainId || 'unknown'})`,
      }
    }

    const purchase = new ethers.Contract(
      purchaseId,
      parinumConfig.cloneAbi,
      signer
    )
    const tokenAddr: string = await purchase.tokenAddress()
    const collateral: bigint = await purchase.collateral()
    const [seller, currentState] = await Promise.all([
      purchase.seller(),
      purchase.state()
    ])

    const signerAddress = await signer?.getAddress()
    if (seller.toLowerCase() !== signerAddress?.toLowerCase()) {
      return { 
        success: false, 
        error: `Unauthorized: Only the seller can confirm this purchase. Connected: ${signerAddress}, Seller: ${seller}` 
      }
    }

    // State 1 = Created
    if (Number(currentState) !== 1) {
      return { 
        success: false, 
        error: `Invalid State: Purchase must be Created (1) to confirm. Current state: ${currentState}` 
      }
    }

    let tx
    if (isNativeTokenAddress(tokenAddr)) {
      tx = await purchase.confirmPurchase({ value: collateral })
    } else {
      const token = new ethers.Contract(tokenAddr, erc20ABI, signer)
      const approval = await token.approve(purchaseId, collateral)
      await approval.wait()
      tx = await purchase.confirmPurchase()
    }

    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt?.hash,
    }
  } catch (error) {
    return {
      success: false,
      error: formatEthersError(error),
    }
  }
}

// Release purchase funds to seller
export const releasePurchase = async (purchaseId: string): Promise<TransactionResult> => {
  try {
    const { signer, provider, chainId: initialChainId } = await initProvider()
    const network = await provider.getNetwork()
    const chainId = initialChainId || Number(network.chainId)
    const parinumConfig = getParinumNetworkConfig(chainId)

    if (!parinumConfig) {
      return {
        success: false,
        error: `Unsupported network (chainId ${chainId || 'unknown'})`,
      }
    }

    const purchase = new ethers.Contract(
      purchaseId,
      parinumConfig.cloneAbi,
      signer
    )

    // Pre-transaction validation
    const [buyer, currentState] = await Promise.all([
      purchase.buyer(),
      purchase.state()
    ])

    const signerAddress = await signer?.getAddress()
    if (buyer.toLowerCase() !== signerAddress?.toLowerCase()) {
      return { 
        success: false, 
        error: `Unauthorized: Only the buyer can release this purchase. Connected: ${signerAddress}, Buyer: ${buyer}` 
      }
    }

    // State 2 = Confirmed
    if (Number(currentState) !== 2) {
      return { 
        success: false, 
        error: `Invalid State: Purchase must be Confirmed (2) to release. Current state: ${currentState}` 
      }
    }

    const tx = await purchase.releasePurchase()
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt?.hash,
    }
  } catch (error) {
    return {
      success: false,
      error: formatEthersError(error),
    }
  }
}

// Abort a purchase and refund funds
export const abortPurchase = async (purchaseId: string): Promise<TransactionResult> => {
  try {
    const { signer, provider, chainId: initialChainId } = await initProvider()
    const network = await provider.getNetwork()
    const chainId = initialChainId || Number(network.chainId)
    const parinumConfig = getParinumNetworkConfig(chainId)

    if (!parinumConfig) {
      return {
        success: false,
        error: `Unsupported network (chainId ${chainId || 'unknown'})`,
      }
    }

    const purchase = new ethers.Contract(
      purchaseId,
      parinumConfig.cloneAbi,
      signer
    )

    // Pre-transaction validation
    const [buyer, currentState] = await Promise.all([
      purchase.buyer(),
      purchase.state()
    ])

    const signerAddress = await signer?.getAddress()
    if (buyer.toLowerCase() !== signerAddress?.toLowerCase()) {
      return { 
        success: false, 
        error: `Unauthorized: Only the buyer can abort this purchase. Connected: ${signerAddress}, Buyer: ${buyer}` 
      }
    }

    // State 1 = Created
    if (Number(currentState) !== 1) {
      return { 
        success: false, 
        error: `Invalid State: Purchase must be Created (1) to abort. Current state: ${currentState}` 
      }
    }

    const tx = await purchase.abortPurchase()
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt?.hash,
    }
  } catch (error) {
    return {
      success: false,
      error: formatEthersError(error),
    }
  }
}

// Get purchase details
export const getPurchaseDetails = async (purchaseId: string): Promise<{ success: boolean, data?: PurchaseDetails, error?: string }> => {
  try {
    const { provider, chainId } = await resolveChainContext()
    const parinumConfig = getParinumNetworkConfig(chainId)
    if (!parinumConfig) return { success: false, error: 'Network configuration not found' }

    // Validate address
    if (!ethers.isAddress(purchaseId)) {
        return { success: false, error: 'Invalid purchase address format' }
    }

    try {
      const code = await provider.getCode(purchaseId)
      if (code === '0x') {
         return { success: false, error: 'No contract found at this address' }
      }
    } catch (err: any) {
       console.error("Error fetching code:", err)
       return { success: false, error: `Failed to verify contract: ${err.message || err}` }
    }

    const purchase = new ethers.Contract(
      purchaseId,
      parinumConfig.cloneAbi,
      provider
    )

    // Fetch properties sequentially to avoid RPC rate limits
    const buyer = await purchase.buyer()
    const seller = await purchase.seller()
    const priceRaw = await purchase.price()
    const collateralRaw = await purchase.collateral()
    const tokenAddr = await purchase.tokenAddress()
    const state = await purchase.state()
    const latestBlock = await provider.getBlock('latest')

    const tokenIsNative = isNativeTokenAddress(tokenAddr)
    let decimals = 18
    let symbol = parinumConfig.nativeSymbol || 'ETH'
    if (!tokenIsNative) {
      try {
        const token = new ethers.Contract(tokenAddr, erc20ABI, provider)
        decimals = await token.decimals()
        try {
          symbol = await token.symbol()
        } catch {
          symbol = 'tokens'
        }
      } catch {
        decimals = 18
      }
    }

    const statusMap: Record<number, PurchaseDetails['status']> = {
      0: 'inactive',
      1: 'created',
      2: 'confirmed',
      3: 'failed',
    }

    const data: PurchaseDetails = {
      id: purchaseId,
      seller,
      buyer,
      price: ethers.formatUnits(priceRaw, decimals),
      collateral: ethers.formatUnits(collateralRaw, decimals),
      tokenAddress: tokenAddr,
      symbol,
      status: statusMap[Number(state)] || 'created',
      timestamp: latestBlock?.timestamp
        ? new Date(Number(latestBlock.timestamp) * 1000)
        : new Date(),
    }
    
    return { success: true, data }

  } catch (error) {
    console.error('Failed to get purchase details:', error)
    return { success: false, error: formatEthersError(error) }
  }
}

// A decoded factory event log, shaped to the small surface the callers consume.
export interface ScannedLog {
  args: ethers.Result
  blockNumber: number
  transactionHash: string
  logIndex: number
}

interface RawRpcLog {
  topics: string[]
  data: string
  blockNumber: string
  transactionHash: string
  logIndex: string
}

const LOGS_TIMEOUT_MS = 15_000
const EXPLORER_API_BASE = 'https://api.etherscan.io/v2/api'
const EXPLORER_PAGE_SIZE = 1000
const EXPLORER_MIN_INTERVAL_MS = 360
const lastExplorerRequestAtByChain = new Map<number, number>()

const getExplorerApiKey = () =>
  process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY?.trim() ||
  process.env.ETHERSCAN_API_KEY?.trim() ||
  ''

const isEtherscanV2ChainSupported = (chainId: number) =>
  // BSC (56) requires a paid Etherscan API plan in v2 for logs.
  [1, 10, 137, 8453, 42161, 59144].includes(chainId)

const normalizeExplorerTopic = (topic: string) => {
  const normalized = topic.toLowerCase()
  // Address topics in logs are left-padded to 32 bytes.
  if (/^0x[0-9a-f]{40}$/.test(normalized)) {
    return `0x000000000000000000000000${normalized.slice(2)}`
  }
  return normalized
}

const waitForExplorerSlot = async (chainId: number) => {
  const last = lastExplorerRequestAtByChain.get(chainId) || 0
  const elapsed = Date.now() - last
  if (elapsed < EXPLORER_MIN_INTERVAL_MS) {
    await wait(EXPLORER_MIN_INTERVAL_MS - elapsed)
  }
  lastExplorerRequestAtByChain.set(chainId, Date.now())
}

const fetchLogsFromExplorer = async (
  chainId: number,
  address: string,
  topics: Array<string | string[] | null>,
  fromBlock: number,
  toBlock: number
): Promise<RawRpcLog[]> => {
  const apiKey = getExplorerApiKey()
  if (!apiKey || !isEtherscanV2ChainSupported(chainId)) return []

  const topicParams: Array<[string, string]> = []
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i]
    if (typeof topic !== 'string') continue
    topicParams.push([`topic${i}`, normalizeExplorerTopic(topic)])
    if (i > 0) {
      topicParams.push([`topic0_${i}_opr`, 'and'])
    }
  }

  const logs: RawRpcLog[] = []
  let page = 1

  while (true) {
    const search = new URLSearchParams({
      chainid: String(chainId),
      module: 'logs',
      action: 'getLogs',
      fromBlock: String(fromBlock),
      toBlock: String(toBlock),
      address,
      page: String(page),
      offset: String(EXPLORER_PAGE_SIZE),
      apikey: apiKey,
    })

    for (const [k, v] of topicParams) {
      search.append(k, v)
    }

    let payload: {
      status?: string
      message?: string
      result?: RawRpcLog[] | string
    } | null = null

    for (let attempt = 0; attempt < 5; attempt++) {
      await waitForExplorerSlot(chainId)
      const response = await fetch(`${EXPLORER_API_BASE}?${search.toString()}`)
      if (!response.ok) {
        if (attempt === 4) {
          throw new Error(`Explorer request failed with status ${response.status}`)
        }
        await wait(250 * (attempt + 1))
        continue
      }

      payload = (await response.json()) as {
        status?: string
        message?: string
        result?: RawRpcLog[] | string
      }

      const message = `${payload.message || ''} ${typeof payload.result === 'string' ? payload.result : ''}`.trim()
      if (/rate limit|max calls per sec|too many requests|429/i.test(message)) {
        if (attempt === 4) {
          throw new Error(message || 'Explorer rate limit exceeded')
        }
        await wait(350 * (attempt + 1))
        continue
      }

      break
    }

    if (!payload) {
      throw new Error('Explorer response missing payload')
    }

    if (Array.isArray(payload.result)) {
      logs.push(...payload.result)
      if (payload.result.length < EXPLORER_PAGE_SIZE) break
      page += 1
      continue
    }

    const message = `${payload.message || ''} ${typeof payload.result === 'string' ? payload.result : ''}`.trim()
    if (/no records/i.test(message)) break

    throw new Error(message || 'Explorer request failed')
  }

  return logs
}

const getErrorText = (error: unknown) => {
  if (!error) return ''
  if (error instanceof Error) return `${error.name} ${error.message}`
  if (typeof error === 'object') {
    const err = error as {
      shortMessage?: string
      reason?: string
      message?: string
      code?: string | number
      error?: { code?: string | number; message?: string }
    }
    return [
      err.shortMessage,
      err.reason,
      err.message,
      typeof err.code !== 'undefined' ? String(err.code) : '',
      typeof err.error?.code !== 'undefined' ? String(err.error.code) : '',
      err.error?.message,
      (() => {
        try {
          return JSON.stringify(error)
        } catch {
          return ''
        }
      })(),
    ]
      .filter(Boolean)
      .join(' ')
  }
  return String(error)
}

// An RPC that rejects a wide range because it's too wide (vs. an auth/network
// failure) is worth retrying in chunks; anything else should surface to the user.
const looksLikeRangeLimit = (error: unknown) => {
  const message = getErrorText(error)
  return /range|too many|more than|limit|exceed|result set|response size|too large|timeout|10000|512|-32005|coalesce|missing response/i.test(message)
}

const looksLikeRateLimit = (error: unknown) => {
  const message = getErrorText(error)
  return /rate limit|too many requests|429|limit exceeded|throttle|try again|-32005|coalesce|missing response/i.test(message)
}

const looksLikeAlchemyGetLogsPlanLimit = (error: unknown) => {
  const message = getErrorText(error)
  return /eth_getlogs/i.test(message) && /10 block range|upgrade to payg|free tier/i.test(message)
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// BSC and other chains without explorer support use a parallel chunked scanner.
// Keep the BSC defaults conservative to avoid provider 429 bursts.
const BSC_CHUNK_SIZE = 45_000
const BSC_CONCURRENCY = 1
const BSC_BATCH_COOLDOWN_MS = 0
const BSC_MIN_REQUEST_INTERVAL_MS = 500

const fetchLogsInParallelChunks = async (
  chainId: number,
  address: string,
  topics: Array<string | string[] | null>,
  fromBlock: number,
  toBlock: number
): Promise<RawRpcLog[]> => {
  const toHex = (n: number) => '0x' + Math.max(0, Math.floor(n)).toString(16)

  // Build the full list of chunk ranges up front.
  const ranges: { start: number; end: number }[] = []
  for (let s = fromBlock; s <= toBlock; s += BSC_CHUNK_SIZE) {
    ranges.push({ start: s, end: Math.min(s + BSC_CHUNK_SIZE - 1, toBlock) })
  }

  const results: RawRpcLog[] = []
  let lastRequestAt = 0

  // Process in parallel batches.
  for (let i = 0; i < ranges.length; i += BSC_CONCURRENCY) {
    const batch = ranges.slice(i, i + BSC_CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map(async ({ start, end }) => {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const elapsed = Date.now() - lastRequestAt
            if (elapsed < BSC_MIN_REQUEST_INTERVAL_MS) {
              await wait(BSC_MIN_REQUEST_INTERVAL_MS - elapsed)
            }
            lastRequestAt = Date.now()

            return await rpcRequestWithFallback<RawRpcLog[]>(
              chainId,
              'eth_getLogs',
              [{ address, topics, fromBlock: toHex(start), toBlock: toHex(end) }],
              LOGS_TIMEOUT_MS
            )
          } catch (err) {
            if (looksLikeRateLimit(err)) {
              throw new Error(
                'BSC public RPC rate-limited. Configure NEXT_PUBLIC_BSC_RPC_URL with a dedicated BSC endpoint.'
              )
            }
            if (attempt === 1) throw err
            await wait(400)
          }
        }
        return [] as RawRpcLog[]
      })
    )
    for (const chunk of batchResults) results.push(...chunk)

    // Brief cooldown between batches to keep free-tier providers responsive.
    if (i + BSC_CONCURRENCY < ranges.length) {
      await wait(BSC_BATCH_COOLDOWN_MS)
    }
  }

  return results
}

const fetchLogsWithAdaptiveRange = async (
  chainId: number,
  address: string,
  topics: Array<string | string[] | null>,
  fromBlock: number,
  toBlock: number
): Promise<RawRpcLog[]> => {
  const toHex = (n: number) => '0x' + Math.max(0, Math.floor(n)).toString(16)

  const fetchRange = (start: number, end: number) =>
    rpcRequestWithFallback<RawRpcLog[]>(
      chainId,
      'eth_getLogs',
      [{ address, topics, fromBlock: toHex(start), toBlock: toHex(end) }],
      LOGS_TIMEOUT_MS
    )

  const fetchRangeWithRetry = async (start: number, end: number) => {
    let lastError: unknown
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await fetchRange(start, end)
      } catch (error) {
        lastError = error
        if (!looksLikeRateLimit(error) || attempt === 3) break
        await wait(300 * (attempt + 1))
      }
    }
    throw lastError
  }

  const fetchRecursively = async (start: number, end: number): Promise<RawRpcLog[]> => {
    try {
      return await fetchRangeWithRetry(start, end)
    } catch (error) {
      if (!looksLikeRangeLimit(error)) throw error
      if (start >= end) throw error

      const mid = Math.floor((start + end) / 2)
      const left = await fetchRecursively(start, mid)
      const right = await fetchRecursively(mid + 1, end)
      return [...left, ...right]
    }
  }

  return fetchRecursively(fromBlock, toBlock)
}

const fetchLogsWithProviderAdaptiveRange = async (
  provider: ethers.Provider,
  address: string,
  topics: Array<string | string[] | null>,
  fromBlock: number,
  toBlock: number
): Promise<ethers.Log[]> => {
  const fetchRange = (start: number, end: number) =>
    provider.getLogs({
      address,
      topics,
      fromBlock: start,
      toBlock: end,
    })

  const fetchRangeWithRetry = async (start: number, end: number) => {
    let lastError: unknown
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await fetchRange(start, end)
      } catch (error) {
        lastError = error
        if (!looksLikeRateLimit(error) || attempt === 3) break
        await wait(300 * (attempt + 1))
      }
    }
    throw lastError
  }

  const fetchRecursively = async (start: number, end: number): Promise<ethers.Log[]> => {
    try {
      return await fetchRangeWithRetry(start, end)
    } catch (error) {
      if (!looksLikeRangeLimit(error)) throw error
      if (start >= end) throw error

      const mid = Math.floor((start + end) / 2)
      const left = await fetchRecursively(start, mid)
      const right = await fetchRecursively(mid + 1, end)
      return [...left, ...right]
    }
  }

  return fetchRecursively(fromBlock, toBlock)
}

// Scan one factory event across [fromBlock, toBlock] via the resilient JSON-RPC
// layer (off the wallet provider). It starts with one wide eth_getLogs call and,
// when a node rejects the span, keeps bisecting until each slice is acceptable.
// Throws if no endpoint can serve even the smallest slice, so the caller can
// show an error instead of a misleading empty result.
const scanEventLogs = async (
  chainId: number,
  address: string,
  provider: ethers.Provider,
  iface: ethers.Interface,
  eventName: string,
  indexedArgs: (string | null)[],
  fromBlock: number,
  toBlock: number
): Promise<ScannedLog[]> => {
  const topics = iface.encodeFilterTopics(eventName, indexedArgs)
  let decoded: ScannedLog[] = []
  const hasExplorer = Boolean(getExplorerApiKey()) && isEtherscanV2ChainSupported(chainId)

  if (hasExplorer) {
    // For ETH/Polygon (and other explorer-supported chains), treat explorer as
    // the authoritative source for logs to avoid noisy RPC range failures.
    const explorerLogs = await fetchLogsFromExplorer(chainId, address, topics, fromBlock, toBlock)
    if (explorerLogs.length) {
      for (const log of explorerLogs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data })
          if (!parsed) continue
          decoded.push({
            args: parsed.args,
            blockNumber: parseInt(log.blockNumber, 16),
            transactionHash: log.transactionHash,
            logIndex: parseInt(log.logIndex, 16),
          })
        } catch {
          // skip a log we can't decode rather than failing the whole scan
        }
      }
    }
    return decoded
  }

  // For chains without explorer support (e.g. BSC on a free key), use the
  // parallel chunked scanner which keeps all 12 concurrent requests in flight
  // to cover large ranges (32M+ blocks) in reasonable time.
  const useParallelChunks = !isEtherscanV2ChainSupported(chainId)

  try {
    const rawLogs = useParallelChunks
      ? await fetchLogsInParallelChunks(chainId, address, topics, fromBlock, toBlock)
      : await fetchLogsWithAdaptiveRange(chainId, address, topics, fromBlock, toBlock)

    for (const log of rawLogs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data })
        if (!parsed) continue
        decoded.push({
          args: parsed.args,
          blockNumber: parseInt(log.blockNumber, 16),
          transactionHash: log.transactionHash,
          logIndex: parseInt(log.logIndex, 16),
        })
      } catch {
        // skip a log we can't decode rather than failing the whole scan
      }
    }

    return decoded
  } catch (error) {
    if (useParallelChunks) {
      throw error
    }

    // If browser-level RPC fetch fails (CORS/network/provider edge cases), fall
    // back to the provider's getLogs path with the same adaptive range splitting.
    const providerLogs = await fetchLogsWithProviderAdaptiveRange(provider, address, topics, fromBlock, toBlock)

    decoded = []
    for (const log of providerLogs) {
      try {
        const parsed = iface.parseLog({ topics: log.topics, data: log.data })
        if (!parsed) continue
        decoded.push({
          args: parsed.args,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          logIndex: log.index,
        })
      } catch {
        // skip a log we can't decode rather than failing the whole scan
      }
    }

    return decoded
  }
}

// Get transaction logs for a purchase wallet (factory events)
export const getPurchaseLogs = async (walletAddress: string): Promise<TransactionLog[]> => {
  try {
    const { chainId } = await initProvider()
    if (!ethers.isAddress(walletAddress)) return []

    const backendEnabled = (process.env.NEXT_PUBLIC_PROFILE_BACKEND_ENABLED ?? 'true') === 'true'
    const backendBaseUrl = process.env.NEXT_PUBLIC_PROFILE_BACKEND_URL?.trim().replace(/\/$/, '') || 'https://api.parinum.com'
    if (!backendEnabled || !backendBaseUrl) {
      return []
    }

    const params = new URLSearchParams({ chainId: String(chainId), limit: '400' })
    const response = await fetch(`${backendBaseUrl}/logs/${walletAddress}?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Backend request failed with ${response.status}`)
    }

    const payload = (await response.json()) as {
      items?: Array<{
        id: string
        timestamp: string
        action: string
        status: 'success' | 'pending' | 'failed'
        txHash: string
        from: string
        to: string
        amount?: string
        gasUsed?: string | null
        message?: string
        isError?: boolean
      }>
    }

    return (Array.isArray(payload.items) ? payload.items : []).map((item) => ({
      id: item.id,
      timestamp: new Date(item.timestamp),
      action: item.action,
      status: item.status,
      txHash: item.txHash,
      from: item.from,
      to: item.to,
      amount: item.amount,
      gasUsed: item.gasUsed || undefined,
      message: item.message,
      isError: item.isError,
    }))
  } catch (error) {
    console.error('getPurchaseLogs error:', error)
    return []
  }
}

// In-session cache so re-opening the Profile tab is instant. Keyed by chain + wallet.
const userPurchasesCache = new Map<string, UserPurchase[]>()

// Cross-reload cache of discovered purchases (clones + classification), so a return
// visit renders instantly while a fresh scan runs in the background.
const PURCHASES_STORAGE_PREFIX = 'parinum-purchases-v1'
const purchasesStorageKey = (chainId: number, wallet: string) =>
  `${PURCHASES_STORAGE_PREFIX}-${chainId}-${wallet.toLowerCase()}`

// Read the persisted purchases for instant hydration. Dates are stored as ISO
// strings and rehydrated to Date. Returns null when absent or unreadable.
export const getCachedUserPurchases = (
  chainId: number | null | undefined,
  wallet: string | null | undefined
): UserPurchase[] | null => {
  if (typeof window === 'undefined' || !chainId || !wallet) return null
  try {
    const raw = window.localStorage.getItem(purchasesStorageKey(chainId, wallet))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { purchases?: Array<Record<string, unknown>> }
    if (!Array.isArray(parsed.purchases)) return null
    return parsed.purchases.map((p) => ({
      ...(p as unknown as UserPurchase),
      createdAt: new Date(p.createdAt as string),
      updatedAt: new Date(p.updatedAt as string),
    }))
  } catch {
    return null
  }
}

export const setCachedUserPurchases = (chainId: number, wallet: string, purchases: UserPurchase[]) => {
  if (typeof window === 'undefined') return
  try {
    const serializable = purchases.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
    window.localStorage.setItem(
      purchasesStorageKey(chainId, wallet),
      JSON.stringify({ purchases: serializable })
    )
  } catch {
    // localStorage may be full or disabled (private mode) — caching is best-effort.
  }
}

// Get all escrow purchases the wallet is involved in (buyer or seller) on the current chain,
// grouped by clone purchaseId and classified into ongoing vs history.
export const getUserPurchases = async (
  wallet: string,
  forceRefresh = false
): Promise<UserPurchase[]> => {
  try {
    const { chainId } = await initProvider()
    const config = getParinumNetworkConfig(chainId)
    if (!config || !config.factoryAddress) return []
    if (!ethers.isAddress(wallet)) return []

    const cacheKey = `${chainId}-${wallet.toLowerCase()}`
    if (!forceRefresh && userPurchasesCache.has(cacheKey)) {
      return userPurchasesCache.get(cacheKey)!
    }

    // Reads go through the resilient public-RPC layer, never the wallet provider:
    // the scans below alone would be thousands of calls and would throttle a wallet RPC.
    const provider = getReadOnlyProvider(chainId)
    const iface = new ethers.Interface(config.factoryAbi)
    const fromBlock = config.deploymentBlock || 0
    const currentBlock = await getSafeBlockNumber(chainId, provider)
    const scan = (eventName: string, indexedArgs: (string | null)[]) =>
      scanEventLogs(chainId, config.factoryAddress, provider, iface, eventName, indexedArgs, fromBlock, currentBlock)
    const canUseExplorerLifecycleScans =
      Boolean(getExplorerApiKey()) && isEtherscanV2ChainSupported(chainId)

    // 1. CreatedPurchase: complete set of purchases the wallet is in, with full detail.
    //    CreatedPurchase(buyer, seller, price, collateral, tokenAddress, purchaseId) — buyer & seller indexed.
    const createdAsBuyer = await scan('CreatedPurchase', [wallet])
    const createdAsSeller = await scan('CreatedPurchase', [null, wallet])

    // 2. Lifecycle events filtered by the wallet (first indexed arg is the party).
    //    AbortedPurchase(buyer, purchaseId) detects a buyer-side abort from an event,
    //    so we don't need a per-clone state() read for those.
    const buyerUnresolved = canUseExplorerLifecycleScans
      ? await scan('BuyerUnresolvedPurchase', [wallet])
      : []
    const sellerUnresolved = canUseExplorerLifecycleScans
      ? await scan('SellerUnresolvedPurchase', [wallet])
      : []
    const buyerCompleted = canUseExplorerLifecycleScans
      ? await scan('BuyerCompletedPurchase', [wallet])
      : []
    const sellerCompleted = canUseExplorerLifecycleScans
      ? await scan('SellerCompletedPurchase', [wallet])
      : []
    const abortedAsBuyer = canUseExplorerLifecycleScans
      ? await scan('AbortedPurchase', [wallet])
      : []

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

    const ingestCreated = (logs: ScannedLog[], role: 'buyer' | 'seller') => {
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
    const abortedIds = new Set<string>()
    const completedLogs = new Map<string, ScannedLog>()
    const collectIds = (logs: ScannedLog[], into: Set<string>) => {
      for (const log of logs) {
        const id = (log.args as any)?.purchaseId?.toLowerCase()
        if (id) into.add(id)
      }
    }
    const markCompleted = (logs: ScannedLog[]) => {
      for (const log of logs) {
        const id = (log.args as any)?.purchaseId?.toLowerCase()
        if (id) completedLogs.set(id, log)
      }
    }
    collectIds(buyerUnresolved, confirmedIds)
    collectIds(sellerUnresolved, confirmedIds)
    collectIds(abortedAsBuyer, abortedIds)
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

    // Pass 1: classify each record; collect the distinct block numbers we need timestamps for.
    type Classified = {
      r: Base
      meta: { decimals: number; symbol: string }
      status: UserPurchase['status']
      category: UserPurchase['category']
      action: UserPurchase['action']
      updatedBlock: number
      txHash: string
    }
    const classified: Classified[] = []
    const blockNumbers = new Set<number>()

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
      } else if (abortedIds.has(key)) {
        // Buyer-side abort caught directly from the AbortedPurchase event.
        status = 'aborted'
        category = 'history'
      } else {
        // Created only, no terminal event matched. AbortedPurchase indexes only the
        // buyer, so a seller viewing an aborted deal lands here — read the clone's
        // state() to disambiguate.
        let state = 1
        try {
          const clone = new ethers.Contract(r.purchaseId, config.cloneAbi, provider)
          state = Number(await clone.state())
        } catch {
          state = 1 // fail-open: an unreadable state is treated as still awaiting confirmation (actionable), not aborted
        }
        if (state === 1) {
          status = 'awaiting-confirmation'
          category = 'ongoing'
        } else if (state === 2) {
          status = 'in-escrow'
          category = 'ongoing'
        } else if (state === 0) {
          status = 'completed'
          category = 'history'
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

      blockNumbers.add(r.createdBlock)
      blockNumbers.add(updatedBlock)
      classified.push({ r, meta, status, category, action, updatedBlock, txHash })
    }

    // Fetch each needed block timestamp once (deduped across all records).
    const blockTimes = new Map<number, Date>()
    await Promise.all(
      Array.from(blockNumbers).map(async (n) => {
        const ts = await getSafeBlockTimestamp(chainId, provider, n)
        if (ts) blockTimes.set(n, ts)
      })
    )

    // Pass 2: assemble results using the prefetched timestamps.
    const results: UserPurchase[] = classified.map((c) => ({
      purchaseId: c.r.purchaseId,
      role: c.r.role,
      counterparty: c.r.counterparty,
      price: ethers.formatUnits(c.r.priceRaw, c.meta.decimals),
      collateral: ethers.formatUnits(c.r.collateralRaw, c.meta.decimals),
      tokenAddress: c.r.tokenAddress,
      symbol: c.meta.symbol,
      status: c.status,
      category: c.category,
      action: c.action,
      createdAt: blockTimes.get(c.r.createdBlock) || new Date(),
      updatedAt: blockTimes.get(c.updatedBlock) || new Date(),
      txHash: c.txHash,
    }))

    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    userPurchasesCache.set(cacheKey, results)
    setCachedUserPurchases(chainId, wallet, results)
    return results
  } catch (error) {
    // Surface the failure so the page can show an error + retry, instead of an
    // empty list that reads as "you have no purchases" when the scan really failed.
    console.error('getUserPurchases error:', error)
    throw new Error(formatEthersError(error) || 'Failed to load purchases')
  }
}

// Connect wallet
export const connectWallet = async () => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not installed')
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    // Clear cached reads on account change
    readCache.clear()
    return accounts[0]
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    throw error
  }
}

// Get wallet balance
export const getWalletBalance = async (address: string, tokenAddress?: string) => {
  try {
    const { provider } = await initProvider()
    
    if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
      // Get ETH balance
      const balance = await provider.getBalance(address)
      return ethers.formatEther(balance)
    } else {
      const token = new ethers.Contract(tokenAddress, erc20ABI, provider)
      const [balance, decimals] = await Promise.all([
        token.balanceOf(address),
        token.decimals()
      ])
      return ethers.formatUnits(balance, decimals)
    }
  } catch (error) {
    console.error('Failed to get wallet balance:', error)
    return '0'
  }
}

// Create a new stake
export const createNewStake = async (amount: string, stakeTime: number): Promise<TransactionResult> => {
  try {
    const { poolContract, prmAddress, poolAddress, signer, signerAddress } = await getRewardsPoolContext()

    if (!signer || !signerAddress) {
      return { success: false, error: 'Wallet not connected' }
    }

    if (!prmAddress) {
      return { success: false, error: 'PRM token address not configured' }
    }

    const prm = PRM__factory.connect(prmAddress, signer)
    const amountWei = ethers.parseEther(amount || '0')

    const approval = await prm.approve(poolAddress, amountWei)
    await approval.wait()

    const tx = await poolContract.newStake(amountWei, BigInt(stakeTime), signerAddress)
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt?.hash
    }
  } catch (error) {
    return {
      success: false,
      error: formatEthersError(error)
    }
  }
}

// Claim rewards and withdraw stake
export const claimRewardsandWithdrawStake = async (): Promise<TransactionResult> => {
  try {
    const { poolContract } = await getRewardsPoolContext()
    const tx = await poolContract.claimRewardsAndWithdrawStake()
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt?.hash
    }
  } catch (error) {
    return {
      success: false,
      error: formatEthersError(error)
    }
  }
}

// Claim rewards and reset stake
export const claimRewardsandResetStake = async (stakeTime: number): Promise<TransactionResult> => {
  try {
    const { poolContract } = await getRewardsPoolContext()
    const tx = await poolContract.claimRewardsAndResetStake(BigInt(stakeTime))
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt?.hash
    }
  } catch (error) {
    return {
      success: false,
      error: formatEthersError(error)
    }
  }
}

// Get stake information
export const getStakeInfo = async (): Promise<StakeInfo> => {
  try {
    const { poolContract, provider, signerAddress } = await getRewardsPoolContext()
    const account = signerAddress
    
    if (!account) {
      return {
        totalAmount: '0',
        totalRewardAmount: '0',
        availableAmount: '0',
        availableRewardAmount: '0'
      }
    }

    const latestBlock = await provider.getBlock('latest')
    const now = Number(latestBlock?.timestamp || Math.floor(Date.now() / 1000))

    let totalAmount = 0n
    let availableAmount = 0n

    for (let i = 0; i < 10; i++) {
      try {
        const stake = await poolContract.stakes(account, BigInt(i))
        if (stake.amount === 0n && stake.stakeTime === 0n) break
        totalAmount += stake.amount
        const matured = now - Number(stake.startTime) >= Number(stake.stakeTime)
        if (matured) {
          availableAmount += stake.amount
        }
      } catch {
        break
      }
    }

    return {
      totalAmount: ethers.formatEther(totalAmount),
      totalRewardAmount: '0',
      availableAmount: ethers.formatEther(availableAmount),
      availableRewardAmount: '0'
    }
  } catch (error) {
    console.error('Failed to get stake info:', error)
    return {
      totalAmount: '0',
      totalRewardAmount: '0',
      availableAmount: '0',
      availableRewardAmount: '0'
    }
  }
}


// Get stake information by index
export const getStakeInfoByIndex = async (stakeIndex: number): Promise<StakeData | null> => {
  try {
    const { poolContract, provider, signerAddress } = await getRewardsPoolContext()
    const account = signerAddress
    
    if (!account) return null

    const stake = await poolContract.stakes(account, stakeIndex)
    const latestBlock = await provider.getBlock('latest')
    const now = Number(latestBlock?.timestamp || Math.floor(Date.now() / 1000))

    const isAvailable = now - Number(stake.startTime) >= Number(stake.stakeTime)

    return {
      amount: ethers.formatEther(stake.amount),
      stakeTime: Number(stake.stakeTime),
      startTime: Number(stake.startTime) * 1000,
      multiplier: calculateStakeMultiplier(Number(stake.stakeTime)),
      rewards: '0',
      isAvailable
    }
  } catch (error) {
    console.error('Failed to get stake info by index:', error)
    return null
  }
}

// Calculate multiplier based on stake time
export const calculateStakeMultiplier = (stakeTimeInSeconds: number): string => {
  const timeIncentive = 0.05
  const thirtyDaysInSeconds = 2592000
  const multiplierValue = 1 + (timeIncentive * stakeTimeInSeconds / thirtyDaysInSeconds)
  return multiplierValue.toFixed(2)
}

// PRM Funding Functions

// Buy PRM tokens during ICO
export const buyPRMTokens = async (referer: string, amount: string, multiplierValue: number): Promise<TransactionResult> => {
  try {
    const { signer, chainId } = await resolveChainContext()
    const { ico } = getCoreAddresses(chainId)
    if (!ico) {
      return { success: false, error: 'PRM ICO contract address not configured' }
    }

    const icoContract = PRMICO__factory.connect(ico, signer)

    const amountWei = ethers.parseEther(amount || "0")
    const refererAddress = referer ? ethers.getAddress(referer) : ethers.ZeroAddress
    const multiplier = ethers.parseEther(multiplierValue.toString())

    const tx = await icoContract.buyPRM(refererAddress, multiplier, { value: amountWei })
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt?.hash
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Claim PRM tokens after ICO ends
export const claimPRMTokens = async (): Promise<TransactionResult> => {
  try {
    const { signer, chainId } = await resolveChainContext()
    const { ico } = getCoreAddresses(chainId)
    if (!ico) {
      return { success: false, error: 'PRM ICO contract address not configured' }
    }

    const icoContract = PRMICO__factory.connect(ico, signer)
    const tx = await icoContract.claimPRM()
    const receipt = await tx.wait()

    return {
      success: true,
      txHash: receipt?.hash
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get ICO information
export const getIcoInfo = async (options: ReadOptions = {}): Promise<IcoInfo> => {
  try {
    const chainId = options.targetChainId || 1
    const cacheKey = `ico-info-${chainId}`
    if (!options.forceRefresh) {
      const cached = readCache.get<IcoInfo>(cacheKey)
      if (cached) return cached
    }
    const { ico } = getCoreAddresses(chainId)
    if (!ico) {
      throw new Error('PRM ICO contract address not configured')
    }

    const code = await rpcRequestWithFallback<string>(chainId, 'eth_getCode', [ico, 'latest'])
    if (code === '0x') {
      throw new Error(`Contract not deployed at ${ico} on chain ${chainId}`)
    }

    const icoInterface = PRMICO__factory.createInterface()

    const [poolPRMRaw, poolETHRaw, deploymentTimeRaw, timeLimitRaw, weightedETHRaisedRaw] = await Promise.all([
      readContractValue(chainId, ico, icoInterface.encodeFunctionData('poolPRM')),
      readContractValue(chainId, ico, icoInterface.encodeFunctionData('poolETH')),
      readContractValue(chainId, ico, icoInterface.encodeFunctionData('deploymentTime')),
      readContractValue(chainId, ico, icoInterface.encodeFunctionData('timeLimit')),
      readContractValue(chainId, ico, icoInterface.encodeFunctionData('weightedETHRaised')),
    ])

    const poolPRM = parseHexBigInt(poolPRMRaw)
    const poolETH = parseHexBigInt(poolETHRaw)
    const deploymentTime = parseHexBigInt(deploymentTimeRaw)
    const timeLimit = parseHexBigInt(timeLimitRaw)
    const weightedETHRaised = parseHexBigInt(weightedETHRaisedRaw)

    const res: IcoInfo = {
      poolPRM: ethers.formatEther(poolPRM),
      poolETH: ethers.formatEther(poolETH),
      deploymentTime: deploymentTime.toString(),
      timeLimit: timeLimit.toString(),
      weightedETHRaised: ethers.formatEther(weightedETHRaised),
      soldAmount: ethers.formatEther(weightedETHRaised) // Approximation
    }
    readCache.set(cacheKey, res)
    return res
  } catch (error) {
    console.error('Failed to get ICO info:', error)
    throw new Error(formatEthersError(error))
  }
}

// Get account ICO information
export const getAccountIcoInfo = async (
  account: string,
  options: ReadOptions = {}
): Promise<AccountIcoInfo> => {
  try {
    const chainId = options.targetChainId || 1
    const key = `account-ico-${chainId}-${account?.toLowerCase?.() || ''}`
    if (!options.forceRefresh) {
      const cached = readCache.get<AccountIcoInfo>(key)
      if (cached) return cached
    }
    const { ico } = getCoreAddresses(chainId)
    if (!ico) {
      throw new Error('PRM ICO contract address not configured')
    }

    const code = await rpcRequestWithFallback<string>(chainId, 'eth_getCode', [ico, 'latest'])
    if (code === '0x') {
      throw new Error(`Contract not deployed at ${ico} on chain ${chainId}`)
    }

    const icoInterface = PRMICO__factory.createInterface()
    const contributorRaw = await readContractValue(
      chainId,
      ico,
      icoInterface.encodeFunctionData('contributors', [account])
    )
    const contributor = icoInterface.decodeFunctionResult('contributors', contributorRaw)
    const isReferer = contributor[0] as boolean
    const ethReceived = contributor[1] as bigint
    const contribution = contributor[2] as bigint
    const weightedContribution = contributor[3] as bigint
    const prmWithdrawn = contributor[4] as bigint

    void isReferer

    const res: AccountIcoInfo = {
      contribution: ethers.formatEther(contribution),
      weightedContribution: ethers.formatEther(weightedContribution),
      ethReceived: ethers.formatEther(ethReceived),
      prmWithdrawn: ethers.formatEther(prmWithdrawn)
    }
    readCache.set(key, res)
    return res
  } catch (error) {
    console.error('Failed to get account ICO info:', error)
    throw new Error(formatEthersError(error))
  }
}

// Calculate ICO price based on current pool state
export const calculateIcoPrice = async (
  ethAmount: string,
  options: ReadOptions = {}
): Promise<string> => {
  try {
    const icoInfo = await getIcoInfo(options)
    const poolETH = parseFloat(icoInfo.poolETH)
    const poolPRM = parseFloat(icoInfo.poolPRM)
    const ethAmountNum = parseFloat(ethAmount)
    
    if (poolETH === 0 || poolPRM === 0) return "0"
    
    // Simple price calculation: PRM tokens = ETH * (poolPRM / poolETH)
    const prmTokens = ethAmountNum * (poolPRM / poolETH)
    return prmTokens.toFixed(6)
  } catch (error) {
    console.error('Failed to calculate ICO price:', error)
    return "0"
  }
}

// Governance Functions

// Get voting power for an account
export const getVotingPower = async (account: string): Promise<VotingPower> => {
  try {
    const { provider, chainId } = await resolveChainContext()
    const key = `voting-power-${chainId}-${account?.toLowerCase?.() || ''}`
    const cached = readCache.get<VotingPower>(key)
    if (cached) return cached
    const { prm } = getCoreAddresses(chainId)
    if (!prm) throw new Error('PRM token address not configured')

    const prmContract = PRM__factory.connect(prm, provider)

    const [balance, votes] = await Promise.all([
      prmContract.balanceOf(account),
      prmContract.getVotes(account)
    ])

    const res: VotingPower = {
      balance: ethers.formatEther(balance),
      delegatedBalance: ethers.formatEther(votes)
    }
    readCache.set(key, res)
    return res
  } catch (error) {
    console.error('Failed to get voting power:', error)
    return {
      balance: '0',
      delegatedBalance: '0'
    }
  }
}

// Delegate voting power
export const delegateVotes = async (delegatee: string): Promise<TransactionResult> => {
  try {
    const { prmAddress, signer } = await getGovernorContext()
    if (!prmAddress) {
      return { success: false, error: 'PRM token address not configured' }
    }

    const prmContract = PRM__factory.connect(prmAddress, signer)

    const tx = await prmContract.delegate(delegatee)
    await tx.wait()

    return {
      success: true,
      txHash: tx.hash
    }
  } catch (error) {
    console.error('Failed to delegate votes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Create a new proposal
export const createProposal = async (
  targets: string[],
  values: string[],
  calldatas: string[],
  description: string
): Promise<TransactionResult> => {
  try {
    const { governorContract } = await getGovernorContext()

    const tx = await governorContract.propose(
      targets,
      values.map((v) => BigInt(v)),
      calldatas,
      description
    )
    const receipt = await tx.wait()

    let proposalId = ''
    for (const log of receipt?.logs || []) {
      try {
        const parsed = governorContract.interface.parseLog(log)
        if (parsed?.name === 'ProposalCreated') {
          proposalId = parsed.args?.[0]?.toString?.() || ''
          break
        }
      } catch {
        continue
      }
    }

    return {
      success: true,
      txHash: tx.hash,
      purchaseId: proposalId
    }
  } catch (error) {
    console.error('Failed to create proposal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Cast a vote on a proposal
export const castVote = async (proposalId: string, support: number): Promise<TransactionResult> => {
  try {
    const { governorContract } = await getGovernorContext()

    const tx = await governorContract.castVote(BigInt(proposalId), support)
    await tx.wait()

    return {
      success: true,
      txHash: tx.hash
    }
  } catch (error) {
    console.error('Failed to cast vote:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get proposal information
export const getProposalInfo = async (proposalId: string): Promise<ProposalInfo | null> => {
  try {
    const { governorAddress, provider } = await getGovernorContext()
    const governorContract = GovernorContract__factory.connect(
      governorAddress,
      provider
    )

    const proposal = await (governorContract as any).proposals(BigInt(proposalId))
    const state = await governorContract.state(BigInt(proposalId))

    return {
      id: proposalId,
      proposer: proposal.proposer,
      targets: [], // Would need to get this from events
      values: [],
      calldatas: [],
      description: '', // Would need to get this from events
      state: Number(state),
      startBlock: proposal.startBlock.toString(),
      endBlock: proposal.endBlock.toString(),
      forVotes: ethers.formatEther(proposal.forVotes),
      againstVotes: ethers.formatEther(proposal.againstVotes),
      abstainVotes: ethers.formatEther(proposal.abstainVotes)
    }
  } catch (error) {
    console.error('Failed to get proposal info:', error)
    return null
  }
}

// Check if user has voted on a proposal
export const hasVoted = async (proposalId: string, account: string): Promise<boolean> => {
  try {
    const { governorAddress, provider } = await getGovernorContext()
    const governorContract = GovernorContract__factory.connect(
      governorAddress,
      provider
    )

    return await governorContract.hasVoted(BigInt(proposalId), account)
  } catch (error) {
    console.error('Failed to check if voted:', error)
    return false
  }
}

// Get governance settings
export const getGovernanceSettings = async () => {
  try {
    const { governorAddress, provider } = await getGovernorContext()
    const governorContract = GovernorContract__factory.connect(
      governorAddress,
      provider
    )

    const currentBlock = await provider.getBlockNumber()
    const [proposalThreshold, quorum] = await Promise.all([
      governorContract.proposalThreshold(),
      governorContract.quorum(currentBlock)
    ])

    return {
      proposalThreshold: ethers.formatEther(proposalThreshold),
      quorum: ethers.formatEther(quorum),
      currentBlock: currentBlock.toString()
    }
  } catch (error) {
    console.error('Failed to get governance settings:', error)
    return {
      proposalThreshold: '0',
      quorum: '0',
      currentBlock: '0'
    }
  }
}
