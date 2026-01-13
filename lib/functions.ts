import { ethers } from 'ethers'
import { config } from './wagmiConfig'
import { getConnectorClient } from '@wagmi/core'
import {
  GovernorContract__factory,
  PRMICO__factory,
  PRM__factory,
  RewardsPool__factory,
} from '@parinum/contracts/typechain-types'
import {
  getParinumFactoryInterface,
  getParinumNetworkConfig,
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

// PSC Funding-related interfaces
export interface IcoInfo {
  poolPSC: string
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
  pscWithdrawn: string
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

// Contract addresses (replace with actual deployed addresses)
const defaultContractAddresses = {
  ico: "0x17f4B55A352Be71CC03856765Ad04147119Aa09B",
  prm: "0x3Aa338c8d5E6cefE95831cD0322b558677abA0f1",
  rewardsPool: "0x27f7785b17c6B4d034094a1B16Bc928bD697f386",
  governor: "0x267fB71b280FB34B278CedE84180a9A9037C941b",
  timelock: "0x6858dF5365ffCbe31b5FE68D9E6ebB81321F7F86"
}

const getCoreAddresses = (chainId?: number | null) => {
  const net = getParinumNetworkConfig(chainId || 1)
  const envKey = net?.envKey
  const pick = (key: string) =>
    (envKey && process.env[`NEXT_PUBLIC_PARINUM_${key}_${envKey}`]?.trim()) ||
    process.env[`NEXT_PUBLIC_PARINUM_${key}`]?.trim() ||
    (defaultContractAddresses as any)[key.toLowerCase()] ||
    ''

  return {
    ico: pick('ICO'),
    prm: pick('PRM'),
    rewardsPool: pick('REWARDS_POOL'),
    governor: pick('GOVERNOR'),
    timelock: pick('TIMELOCK'),
  }
}

export const contractAddresses = {
  crowdfunder: defaultContractAddresses.ico,
  psc: defaultContractAddresses.prm,
  rewardsPool: defaultContractAddresses.rewardsPool,
  governor: defaultContractAddresses.governor,
  timelock: defaultContractAddresses.timelock,
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
  const signerAddress = await ctx.signer.getAddress()
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
    console.error('Failed to initialize provider:', error)
    throw error
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

    const signerAddress = await signer.getAddress()
    if (seller.toLowerCase() !== signerAddress.toLowerCase()) {
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

    const signerAddress = await signer.getAddress()
    if (buyer.toLowerCase() !== signerAddress.toLowerCase()) {
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

    const signerAddress = await signer.getAddress()
    if (buyer.toLowerCase() !== signerAddress.toLowerCase()) {
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
export const getPurchaseDetails = async (purchaseId: string): Promise<PurchaseDetails | null> => {
  try {
    const { provider, chainId } = await resolveChainContext()
    const parinumConfig = getParinumNetworkConfig(chainId)
    if (!parinumConfig) return null

    const purchase = new ethers.Contract(
      purchaseId,
      parinumConfig.cloneAbi,
      provider
    )

    const [buyer, seller, priceRaw, collateralRaw, tokenAddr, state, latestBlock] =
      await Promise.all([
        purchase.buyer(),
        purchase.seller(),
        purchase.price(),
        purchase.collateral(),
        purchase.tokenAddress(),
        purchase.state(),
        provider.getBlock('latest')
      ])

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

    return {
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
  } catch (error) {
    console.error('Failed to get purchase details:', error)
    return null
  }
}

// Get transaction logs for a purchase
export const getPurchaseLogs = async (purchaseId: string) => {
  try {
    const { provider, chainId } = await resolveChainContext()
    const parinumConfig = getParinumNetworkConfig(chainId)
    if (!parinumConfig) return []

    const purchase = new ethers.Contract(
      purchaseId,
      parinumConfig.cloneAbi,
      provider
    )

    const tokenAddress = await purchase.tokenAddress()
    const tokenIsNative = isNativeTokenAddress(tokenAddress)
    let decimals = 18
    let symbol = tokenIsNative ? parinumConfig.nativeSymbol : 'TOKEN'
    if (!tokenIsNative) {
      try {
        const token = new ethers.Contract(tokenAddress, erc20ABI, provider)
        decimals = await token.decimals()
        symbol = await token.symbol()
      } catch {
        decimals = 18
        symbol = 'TOKEN'
      }
    }

    const createdFilter = purchase.filters?.PurchaseCreated?.()
    const confirmedFilter = purchase.filters?.PurchaseConfirmed?.()
    const releasedFilter = purchase.filters?.PurchaseReleased?.()
    const abortedFilter = purchase.filters?.PurchaseAborted?.()

    const createdLogs = createdFilter
      ? await purchase.queryFilter(createdFilter, 0)
      : []
    const confirmedLogs = confirmedFilter
      ? await purchase.queryFilter(confirmedFilter, 0)
      : []
    const releasedLogs = releasedFilter
      ? await purchase.queryFilter(releasedFilter, 0)
      : []
    const abortedLogs = abortedFilter
      ? await purchase.queryFilter(abortedFilter, 0)
      : []

    const logs = [
      ...createdLogs.map((log) => ({ type: 'Purchase Created', log })),
      ...confirmedLogs.map((log) => ({ type: 'Purchase Confirmed', log })),
      ...releasedLogs.map((log) => ({ type: 'Purchase Released', log })),
      ...abortedLogs.map((log) => ({ type: 'Purchase Aborted', log })),
    ]

    const enriched = await Promise.all(
      logs.map(async ({ type, log }, idx) => {
        const block = await provider.getBlock(log.blockNumber)
        const receipt = await provider.getTransactionReceipt(
          log.transactionHash
        )
        const args: any = (log as any).args || {}
        const price = args.price ?? args.ethValue ?? args.collateral ?? 0n
        const amount = ethers.formatUnits(price, decimals)

        return {
          id: `${idx + 1}`,
          timestamp: block?.timestamp
            ? new Date(Number(block.timestamp) * 1000)
            : new Date(),
          action: type,
          status: 'success' as const,
          txHash: log.transactionHash,
          from: args.buyer || args.seller || '',
          to: args.seller || args.buyer || '',
          amount: `${amount} ${symbol}`,
          gasUsed: receipt?.gasUsed ? receipt.gasUsed.toString() : '0',
        }
      })
    )

    return enriched.sort(
      (a, b) => (a.timestamp?.getTime?.() || 0) - (b.timestamp?.getTime?.() || 0)
    )
  } catch (error) {
    console.error('Failed to get purchase logs:', error)
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
    const { poolContract, prmAddress, poolAddress, signer } = await getRewardsPoolContext()

    if (!prmAddress) {
      return { success: false, error: 'PRM token address not configured' }
    }

    const prm = PRM__factory.connect(prmAddress, signer)
    const amountWei = ethers.parseEther(amount || '0')

    const approval = await prm.approve(poolAddress, amountWei)
    await approval.wait()

    const tx = await poolContract.newStake(amountWei, BigInt(stakeTime))
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
    const latestBlock = await provider.getBlock('latest')
    const now = Number(latestBlock?.timestamp || Math.floor(Date.now() / 1000))

    let totalAmount = 0n
    let availableAmount = 0n

    for (let i = 0; i < 10; i++) {
      try {
        const stake = await poolContract.stakes(account, i)
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

// PSC Funding Functions

// Buy PSC tokens during ICO
export const buyPSCTokens = async (referer: string, amount: string): Promise<TransactionResult> => {
  try {
    const { signer, chainId } = await resolveChainContext()
    const { ico } = getCoreAddresses(chainId)
    if (!ico) {
      return { success: false, error: 'PRM ICO contract address not configured' }
    }

    const icoContract = PRMICO__factory.connect(ico, signer)

    const amountWei = ethers.parseEther(amount || "0")
    const refererAddress = referer ? ethers.getAddress(referer) : ethers.ZeroAddress
    const multiplier = await icoContract.getMultiplier()

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

// Claim PSC tokens after ICO ends
export const claimPSCTokens = async (): Promise<TransactionResult> => {
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

    const icoContract = PRMICO__factory.connect(ico, provider)

    const [poolPRM, poolETH, deploymentTime, timeLimit, weightedETHRaised] = await Promise.all([
      icoContract.poolPRM(),
      icoContract.poolETH(),
      icoContract.deploymentTime(),
      icoContract.timeLimit(),
      icoContract.weightedETHRaised()
    ])

    const res: IcoInfo = {
      poolPSC: ethers.formatEther(poolPRM),
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
    // Return mock data for development
    return {
      poolPSC: '1000000',
      poolETH: '500',
      deploymentTime: (Date.now() - 30 * 24 * 60 * 60 * 1000).toString(), // 30 days ago
      timeLimit: (90 * 24 * 60 * 60).toString(), // 90 days
      weightedETHRaised: '150',
      soldAmount: '300000'
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

    const icoContract = PRMICO__factory.connect(ico, provider)
    const contributor = await icoContract.contributors(account)

    const res: AccountIcoInfo = {
      contribution: ethers.formatEther(contributor.contribution),
      weightedContribution: ethers.formatEther(contributor.weightedContribution),
      ethReceived: ethers.formatEther(contributor.ethReceived),
      pscWithdrawn: ethers.formatEther(contributor.prmWithdrawn)
    }
    readCache.set(key, res)
    return res
  } catch (error) {
    console.error('Failed to get account ICO info:', error)
    // Return mock data for development
    return {
      contribution: '0.5',
      weightedContribution: '0.75',
      ethReceived: '0',
      pscWithdrawn: '0'
    }
  }
}

// Calculate ICO price based on current pool state
export const calculateIcoPrice = async (ethAmount: string): Promise<string> => {
  try {
    const icoInfo = await getIcoInfo()
    const poolETH = parseFloat(icoInfo.poolETH)
    const poolPSC = parseFloat(icoInfo.poolPSC)
    const ethAmountNum = parseFloat(ethAmount)
    
    if (poolETH === 0 || poolPSC === 0) return "0"
    
    // Simple price calculation: PSC tokens = ETH * (poolPSC / poolETH)
    const pscTokens = ethAmountNum * (poolPSC / poolETH)
    return pscTokens.toFixed(6)
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
