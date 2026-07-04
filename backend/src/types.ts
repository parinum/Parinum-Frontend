import type { InterfaceAbi } from 'ethers'

export type LifecycleStage = 'created' | 'confirmed' | 'completed' | 'aborted' | 'other'

export type PurchaseStatus = 'awaiting-confirmation' | 'in-escrow' | 'completed' | 'aborted'

export type PurchaseCategory = 'ongoing' | 'history'

export type PurchaseAction = 'confirm' | 'release' | 'abort' | null

export interface IndexedChainConfig {
  chainId: number
  name: string
  envKey: string
  nativeSymbol: string
  factoryAddress: string
  factoryAbi: InterfaceAbi
  deploymentBlock: number
  explorerAddressBaseUrl: string
  rpcUrls: string[]
  finalityBufferBlocks: number
  batchSize: number
}

export interface NormalizedEvent {
  chainId: number
  purchaseAddress: string
  contractAddress: string
  eventName: string
  lifecycleStage: LifecycleStage
  blockNumber: number
  blockHash: string
  blockTimestamp: Date
  txHash: string
  txIndex: number | null
  logIndex: number
  topics: readonly string[]
  data: string
  args: Record<string, unknown>
}

export interface PurchaseSnapshot {
  chainId: number
  purchaseAddress: string
  buyerAddress: string
  sellerAddress: string
  tokenAddress: string
  symbol: string
  priceRaw: string
  collateralRaw: string
  priceDisplay: string
  collateralDisplay: string
  creationTxHash: string
  latestTxHash: string
  currentStatus: PurchaseStatus
  currentCategory: PurchaseCategory
  createdAtBlock: number
  updatedAtBlock: number
  createdAt: Date
  updatedAt: Date
  lastEventName: string
  createdLogIndex: number
  latestLogIndex: number
}

export interface SyncCheckpoint {
  chainId: number
  syncMode: 'backfill' | 'live'
  nextFromBlock: number
  lastScannedBlock: number
  lastFinalizedBlock: number
  lastSeenBlockHash: string | null
  consecutiveFailures: number
  lastError: string | null
  updatedAt: Date
}

export interface ProfilePurchaseItem {
  chainId: number
  purchaseId: string
  role: 'buyer' | 'seller'
  counterparty: string
  price: string
  collateral: string
  tokenAddress: string
  symbol: string
  status: PurchaseStatus
  category: PurchaseCategory
  action: PurchaseAction
  createdAt: string
  updatedAt: string
  txHash: string
  explorerUrl: string
}
