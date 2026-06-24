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

  const envCandidates = [
    process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
    process.env.NEXT_PUBLIC_RPC_URL,
  ]

  for (const candidate of envCandidates) {
    if (candidate?.trim()) {
      urls.push(candidate.trim())
    }
  }

  if (effectiveChainId === 1) {
    urls.push(
      'https://ethereum.publicnode.com',
      'https://eth.drpc.org',
      'https://mainnet.gateway.tenderly.co'
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

const rpcRequest = async <T>(
  url: string,
  method: string,
  params: unknown[]
): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS)

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
  params: unknown[]
): Promise<T> => {
  const rpcUrls = getRpcUrlsForChain(chainId)
  const preferredUrl = preferredRpcUrlByChain.get(chainId)
  let lastError: unknown = null

  if (preferredUrl) {
    try {
      return await rpcRequest<T>(preferredUrl, method, params)
    } catch (error) {
      lastError = error
      preferredRpcUrlByChain.delete(chainId)
    }
  }

  const candidateUrls = rpcUrls.filter((url) => url !== preferredUrl)
  if (!candidateUrls.length) {
    throw new Error(formatEthersError(lastError) || `Unable to reach RPC for chain ${chainId}`)
  }

  try {
    const winner = await new Promise<{ url: string; result: T }>((resolve, reject) => {
      let pending = candidateUrls.length
      let finalError: unknown = null

      for (const url of candidateUrls) {
        rpcRequest<T>(url, method, params)
          .then((result) => resolve({ url, result }))
          .catch((error) => {
            finalError = error
            pending -= 1
            if (pending === 0) {
              reject(finalError)
            }
          })
      }
    })
    preferredRpcUrlByChain.set(chainId, winner.url)
    return winner.result
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

  if (rpcUrls.length === 1) {
    return new ethers.JsonRpcProvider(rpcUrls[0], network)
  }

  return new ethers.FallbackProvider(
    rpcUrls.map((url, index) => ({
      provider: new ethers.JsonRpcProvider(url, network),
      priority: index + 1,
      weight: 1,
      stallTimeout: 1_500,
    }))
  )
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

// Get transaction logs for a purchase wallet (factory events)
export const getPurchaseLogs = async (walletAddress: string): Promise<TransactionLog[]> => {
  try {
    const { provider, chainId } = await initProvider()
    const config = getParinumNetworkConfig(chainId)

    if (!config || !config.factoryAddress) {
      console.warn('Network config or factory address not found')
      return []
    }

    if (!ethers.isAddress(walletAddress)) return []

    const factory = new ethers.Contract(
      config.factoryAddress,
      config.factoryAbi,
      provider
    )

    const fromBlock = config.deploymentBlock || 0
    const currentBlock = await provider.getBlockNumber()

    // Fetch logs for the 4 key events
    const topics = [
      { name: 'BuyerUnresolvedPurchase', type: 'BuyerUnresolved' },
      { name: 'SellerUnresolvedPurchase', type: 'SellerUnresolved' },
      { name: 'BuyerCompletedPurchase', type: 'BuyerCompleted' },
      { name: 'SellerCompletedPurchase', type: 'SellerCompleted' },
    ]

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

    const results = await Promise.all(allLogsPromises)
    const allLogs = results.flat()


    // Sort by block number descending
    allLogs.sort((a, b) => b.l.blockNumber - a.l.blockNumber)

    // Enrich logs
    const enrichedLogs = await Promise.all(
      allLogs.map(async ({ l, type }) => {
        try {
          const log = l as ethers.EventLog
          const [block, receipt] = await Promise.all([
            provider.getBlock(log.blockNumber),
            provider.getTransactionReceipt(log.transactionHash),
          ])

          const timestamp = block?.timestamp
            ? new Date(Number(block.timestamp) * 1000)
            : new Date()

          let action = 'Unknown'
          if (type === 'BuyerUnresolved') action = 'Purchase Confirmed (Buyer)'
          else if (type === 'SellerUnresolved') action = 'Purchase Confirmed (Seller)'
          else if (type === 'BuyerCompleted') action = 'Purchase Completed (Buyer)'
          else if (type === 'SellerCompleted') action = 'Purchase Completed (Seller)'

          let amountStr = undefined
          if (type.includes('Completed') && log.args) {
            try {
               const val = (log.args as any).ethValue
               if (val) {
                 amountStr = `${ethers.formatEther(val)} ${config.nativeSymbol || 'ETH'}`
               }
            } catch (e) { /* ignore */ }
          }

          return {
            id: `${log.transactionHash}-${log.index}`,
            timestamp,
            action,
            status: receipt?.status === 1 ? 'success' : 'failed',
            txHash: log.transactionHash,
            from: receipt?.from || walletAddress,
            to: receipt?.to || config.factoryAddress,
            amount: amountStr,
            gasUsed: receipt?.gasUsed?.toString(),
            isError: receipt?.status !== 1,
          } as TransactionLog
        } catch (e) {
          console.error('Error processing log', e)
          return null
        }
      })
    )

    return enrichedLogs.filter((l): l is TransactionLog => l !== null)
  } catch (error) {
    console.error('getPurchaseLogs error:', error)
    return []
  }
}

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
      } else {
        // Created only — abort emits no event, so read the clone's state to disambiguate.
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
        const block = await provider.getBlock(n)
        if (block?.timestamp) blockTimes.set(n, new Date(Number(block.timestamp) * 1000))
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
    return results
  } catch (error) {
    console.error('getUserPurchases error:', error)
    return []
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
