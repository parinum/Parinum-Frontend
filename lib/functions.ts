import { ethers } from 'ethers'

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
  status: 'created' | 'confirmed' | 'completed' | 'aborted'
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
export const contractAddresses = {
  crowdfunder: "0x17f4B55A352Be71CC03856765Ad04147119Aa09B",
  psc: "0x3Aa338c8d5E6cefE95831cD0322b558677abA0f1",
  rewardsPool: "0x27f7785b17c6B4d034094a1B16Bc928bD697f386",
  governor: "0x267fB71b280FB34B278CedE84180a9A9037C941b",
  timelock: "0x6858dF5365ffCbe31b5FE68D9E6ebB81321F7F86"
}

// Contract ABIs (simplified - you should import the full ABIs)
const crowdfunderABI = [
  "function buyPSC(address referer) external payable",
  "function claimPSC() external",
  "function contributors(address) external view returns (uint256 contribution, uint256 weightedContribution, uint256 ethReceived, uint256 pscWithdrawn)",
  "function poolPSC() external view returns (uint256)",
  "function poolETH() external view returns (uint256)",
  "function deploymentTime() external view returns (uint256)",
  "function timeLimit() external view returns (uint256)",
  "function weightedETHRaised() external view returns (uint256)"
]

const pscABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function delegates(address account) external view returns (address)",
  "function delegate(address delegatee) external",
  "function getVotes(address account) external view returns (uint256)"
]

const governorABI = [
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) external returns (uint256)",
  "function proposals(uint256 proposalId) external view returns (uint256 id, address proposer, uint256 eta, uint256 startBlock, uint256 endBlock, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed)",
  "function state(uint256 proposalId) external view returns (uint8)",
  "function proposalSnapshot(uint256 proposalId) external view returns (uint256)",
  "function proposalDeadline(uint256 proposalId) external view returns (uint256)",
  "function getVotes(address account, uint256 blockNumber) external view returns (uint256)",
  "function hasVoted(uint256 proposalId, address account) external view returns (bool)",
  "function proposalThreshold() external view returns (uint256)",
  "function quorum(uint256 blockNumber) external view returns (uint256)"
]

// Initialize Web3 provider
export const initProvider = async () => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not detected')
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])
    const signer = await provider.getSigner()
    
    return { provider, signer, account: accounts[0] }
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
    // TODO: Replace with actual contract interaction
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockPurchaseId = `0x${Math.random().toString(16).slice(2, 42)}`
    
    return {
      success: true,
      purchaseId: mockPurchaseId,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Confirm a purchase (seller locks collateral)
export const confirmPurchase = async (purchaseId: string): Promise<TransactionResult> => {
  try {
    // TODO: Replace with actual contract interaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Release purchase funds to seller
export const releasePurchase = async (purchaseId: string): Promise<TransactionResult> => {
  try {
    // TODO: Replace with actual contract interaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Abort a purchase and refund funds
export const abortPurchase = async (purchaseId: string): Promise<TransactionResult> => {
  try {
    // TODO: Replace with actual contract interaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get purchase details
export const getPurchaseDetails = async (purchaseId: string): Promise<PurchaseDetails | null> => {
  try {
    // TODO: Replace with actual contract call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock purchase details
    return {
      id: purchaseId,
      seller: '0x456b789a012c345d678e901f234567890abcdef1',
      buyer: '0x742d35Cc6f34D84C44Da98B954EedeAC495271d0',
      price: '0.5',
      collateral: '0.1',
      tokenAddress: '0x0000000000000000000000000000000000000000',
      status: 'created',
      timestamp: new Date()
    }
  } catch (error) {
    console.error('Failed to get purchase details:', error)
    return null
  }
}

// Get transaction logs for a purchase
export const getPurchaseLogs = async (purchaseId: string) => {
  try {
    // TODO: Replace with actual event log queries
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock transaction logs
    return [
      {
        id: '1',
        timestamp: new Date('2025-01-02T10:30:00'),
        action: 'Purchase Created',
        status: 'success' as const,
        txHash: '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef12345678',
        from: '0x742d35Cc6f34D84C44Da98B954EedeAC495271d0',
        to: '0x456b789a012c345d678e901f234567890abcdef1',
        amount: '0.5 ETH',
        gasUsed: '21,000'
      },
      {
        id: '2',
        timestamp: new Date('2025-01-02T11:15:00'),
        action: 'Seller Confirmation',
        status: 'success' as const,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        from: '0x456b789a012c345d678e901f234567890abcdef1',
        to: '0x742d35Cc6f34D84C44Da98B954EedeAC495271d0',
        amount: '0.5 ETH',
        gasUsed: '45,000'
      }
    ]
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
      // TODO: Get ERC20 token balance
      return '0'
    }
  } catch (error) {
    console.error('Failed to get wallet balance:', error)
    return '0'
  }
}

// Create a new stake
export const createNewStake = async (amount: string, stakeTime: number): Promise<TransactionResult> => {
  try {
    // TODO: Replace with actual contract interaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Claim rewards and withdraw stake
export const claimRewardsandWithdrawStake = async (): Promise<TransactionResult> => {
  try {
    // TODO: Replace with actual contract interaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Claim rewards and reset stake
export const claimRewardsandResetStake = async (stakeTime: number): Promise<TransactionResult> => {
  try {
    // TODO: Replace with actual contract interaction
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).slice(2, 66)}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get stake information
export const getStakeInfo = async (): Promise<StakeInfo> => {
  try {
    // TODO: Replace with actual contract call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock stake data
    return {
      totalAmount: '150.5',
      totalRewardAmount: '12.35',
      availableAmount: '75.0',
      availableRewardAmount: '6.15'
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
    // TODO: Replace with actual contract call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock individual stake data
    return {
      amount: '50.0',
      stakeTime: 2592000, // 30 days in seconds
      startTime: Date.now() - (15 * 24 * 60 * 60 * 1000), // 15 days ago
      multiplier: '1.05',
      rewards: '2.5',
      isAvailable: false
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
    const { provider, signer } = await initProvider()
    
    // Convert amount to wei
    const amountWei = ethers.parseEther(amount || "0")
    const refererAddress = referer || ethers.ZeroAddress
    
    // Create contract instance
    const crowdfunder = new ethers.Contract(
      contractAddresses.crowdfunder,
      crowdfunderABI,
      signer
    )
    
    // Execute buy transaction
    const tx = await crowdfunder.buyPSC(refererAddress, { value: amountWei })
    const receipt = await tx.wait()
    
    return {
      success: true,
      txHash: receipt.hash
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
    const { provider, signer } = await initProvider()
    
    const crowdfunder = new ethers.Contract(
      contractAddresses.crowdfunder,
      crowdfunderABI,
      signer
    )
    
    const tx = await crowdfunder.claimPSC()
    const receipt = await tx.wait()
    
    return {
      success: true,
      txHash: receipt.hash
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
  const cached = readCache.get<IcoInfo>('ico-info')
  if (cached) return cached
  try {
    const { provider } = await initProvider()
    
    const crowdfunder = new ethers.Contract(
      contractAddresses.crowdfunder,
      crowdfunderABI,
      provider
    )
    
    const [poolPSC, poolETH, deploymentTime, timeLimit, weightedETHRaised] = await Promise.all([
      crowdfunder.poolPSC(),
      crowdfunder.poolETH(),
      crowdfunder.deploymentTime(),
      crowdfunder.timeLimit(),
      crowdfunder.weightedETHRaised()
    ])
    
    const res: IcoInfo = {
      poolPSC: ethers.formatEther(poolPSC),
      poolETH: ethers.formatEther(poolETH),
      deploymentTime: deploymentTime.toString(),
      timeLimit: timeLimit.toString(),
      weightedETHRaised: ethers.formatEther(weightedETHRaised),
      soldAmount: ethers.formatEther(weightedETHRaised) // Approximation
    }
    readCache.set('ico-info', res)
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
  const key = `account-ico-${account?.toLowerCase?.() || ''}`
  const cached = readCache.get<AccountIcoInfo>(key)
  if (cached) return cached
  try {
    const { provider } = await initProvider()
    
    const crowdfunder = new ethers.Contract(
      contractAddresses.crowdfunder,
      crowdfunderABI,
      provider
    )
    
    const contributor = await crowdfunder.contributors(account)
    
    const res: AccountIcoInfo = {
      contribution: ethers.formatEther(contributor.contribution),
      weightedContribution: ethers.formatEther(contributor.weightedContribution),
      ethReceived: ethers.formatEther(contributor.ethReceived),
      pscWithdrawn: ethers.formatEther(contributor.pscWithdrawn)
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
  const key = `voting-power-${account?.toLowerCase?.() || ''}`
  const cached = readCache.get<VotingPower>(key)
  if (cached) return cached
  try {
    const { provider } = await initProvider()
    
    const pscContract = new ethers.Contract(
      contractAddresses.psc,
      pscABI,
      provider
    )
    
    const balance = await pscContract.balanceOf(account)
    const votes = await pscContract.getVotes(account)
    
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
    const { signer } = await initProvider()
    
    const pscContract = new ethers.Contract(
      contractAddresses.psc,
      pscABI,
      signer
    )
    
    const tx = await pscContract.delegate(delegatee)
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
    const { signer } = await initProvider()
    
    const governorContract = new ethers.Contract(
      contractAddresses.governor,
      governorABI,
      signer
    )
    
    const tx = await governorContract.propose(targets, values, calldatas, description)
    const receipt = await tx.wait()
    
    // Extract proposal ID from logs
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = governorContract.interface.parseLog(log)
        return parsed?.name === 'ProposalCreated'
      } catch {
        return false
      }
    })
    
    let proposalId = ''
    if (event) {
      const parsed = governorContract.interface.parseLog(event)
      proposalId = parsed?.args[0]?.toString() || ''
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
    const { signer } = await initProvider()
    
    const governorContract = new ethers.Contract(
      contractAddresses.governor,
      governorABI,
      signer
    )
    
    const tx = await governorContract.castVote(proposalId, support)
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
    const { provider } = await initProvider()
    
    const governorContract = new ethers.Contract(
      contractAddresses.governor,
      governorABI,
      provider
    )
    
    const proposal = await governorContract.proposals(proposalId)
    const state = await governorContract.state(proposalId)
    
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
    const { provider } = await initProvider()
    
    const governorContract = new ethers.Contract(
      contractAddresses.governor,
      governorABI,
      provider
    )
    
    return await governorContract.hasVoted(proposalId, account)
  } catch (error) {
    console.error('Failed to check if voted:', error)
    return false
  }
}

// Get governance settings
export const getGovernanceSettings = async () => {
  try {
    const { provider } = await initProvider()
    
    const governorContract = new ethers.Contract(
      contractAddresses.governor,
      governorABI,
      provider
    )
    
    const proposalThreshold = await governorContract.proposalThreshold()
    const currentBlock = await provider.getBlockNumber()
    const quorum = await governorContract.quorum(currentBlock)
    
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
