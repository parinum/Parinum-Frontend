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
    if (!tokenIsNative) {
      try {
        const token = new ethers.Contract(tokenAddr, erc20ABI, provider)
        decimals = await token.decimals()
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
    
    // Chunk size to avoid RPC limits (some RPCs limit to 1000 blocks)
    const CHUNK_SIZE = 800

    // Pre-calculate ranges
    const ranges: { start: number; end: number }[] = []
    for (let start = fromBlock; start <= currentBlock; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE - 1, currentBlock)
      ranges.push({ start, end })
    }
    console.log(`[getPurchaseLogs] Scanning ${ranges.length} chunks from ${fromBlock} to ${currentBlock}`)

    // Fetch logs for the 4 key events
    const topics = [
      { name: 'BuyerUnresolvedPurchase', type: 'BuyerUnresolved' },
      { name: 'SellerUnresolvedPurchase', type: 'SellerUnresolved' },
      { name: 'BuyerCompletedPurchase', type: 'BuyerCompleted' },
      { name: 'SellerCompletedPurchase', type: 'SellerCompleted' },
    ]

    const allLogsPromises = topics.map(async (topic) => {
      try {
        // Access filters dynamically
        const filterCreator = (factory.filters as any)[topic.name]
        if (typeof filterCreator !== 'function') return []
        
        // We filter by wallet address using the topic filter if possible
        const filter = await filterCreator(walletAddress)
        
        const logs: any[] = []
        
        // Process chunks in batches of 5 to improve speed while respecting limits
        const BATCH_SIZE = 5
        for (let i = 0; i < ranges.length; i += BATCH_SIZE) {
          const batch = ranges.slice(i, i + BATCH_SIZE)
          await Promise.all(batch.map(async ({ start, end }) => {
            try {
              const chunkLogs = await factory.queryFilter(filter, start, end)
              logs.push(...chunkLogs)
            } catch (chunkError) {
              console.warn(`Failed to fetch logs for ${topic.name} in range ${start}-${end}:`, chunkError)
            }
          }))
        }

        return logs.map((l) => ({ l, type: topic.type }))
      } catch (e) {
        console.warn(`Failed to fetch logs for ${topic.name}`, e)
        return []
      }
    })

    const results = await Promise.all(allLogsPromises)
    const allLogs = results.flat()
    console.log(allLogs)


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
                 amountStr = `${ethers.formatEther(val)} ETH`
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
export const getIcoInfo = async (): Promise<IcoInfo> => {
  try {
    const { provider, chainId } = await resolveChainContext()
    const cacheKey = `ico-info-${chainId}`
    const cached = readCache.get<IcoInfo>(cacheKey)
    if (cached) return cached
    const { ico } = getCoreAddresses(chainId)
    if (!ico) {
      throw new Error('PRM ICO contract address not configured')
    }

    const code = await provider.getCode(ico)
    if (code === '0x') {
      throw new Error(`Contract not deployed at ${ico} on chain ${chainId}`)
    }

    const icoContract = PRMICO__factory.connect(ico, provider)

    const [poolPRM, poolETH, deploymentTime, timeLimit, weightedETHRaised] = await Promise.all([
      icoContract.poolPRM(),
      icoContract.poolETH(),
      icoContract.deploymentTime(),
      icoContract.timeLimit(),
      icoContract.weightedETHRaised()
    ])

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
    return {
      poolPRM: '0',
      poolETH: '0',
      deploymentTime: '0',
      timeLimit: '0',
      weightedETHRaised: '0',
      soldAmount: '0'
    }
  }
}

// Get account ICO information
export const getAccountIcoInfo = async (account: string): Promise<AccountIcoInfo> => {
  try {
    const { provider, chainId } = await resolveChainContext()
    const key = `account-ico-${chainId}-${account?.toLowerCase?.() || ''}`
    const cached = readCache.get<AccountIcoInfo>(key)
    if (cached) return cached
    const { ico } = getCoreAddresses(chainId)
    if (!ico) {
      throw new Error('PRM ICO contract address not configured')
    }

    const code = await provider.getCode(ico)
    if (code === '0x') {
      throw new Error(`Contract not deployed at ${ico} on chain ${chainId}`)
    }

    const icoContract = PRMICO__factory.connect(ico, provider)
    const contributor = await icoContract.contributors(account)

    const res: AccountIcoInfo = {
      contribution: ethers.formatEther(contributor.contribution),
      weightedContribution: ethers.formatEther(contributor.weightedContribution),
      ethReceived: ethers.formatEther(contributor.ethReceived),
      prmWithdrawn: ethers.formatEther(contributor.prmWithdrawn)
    }
    readCache.set(key, res)
    return res
  } catch (error) {
    console.error('Failed to get account ICO info:', error)
    return {
      contribution: '0',
      weightedContribution: '0',
      ethReceived: '0',
      prmWithdrawn: '0'
    }
  }
}

// Calculate ICO price based on current pool state
export const calculateIcoPrice = async (ethAmount: string): Promise<string> => {
  try {
    const icoInfo = await getIcoInfo()
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
