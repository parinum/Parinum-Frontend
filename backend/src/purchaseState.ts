import { isAddress } from 'ethers'
import type { LifecycleStage, NormalizedEvent, PurchaseCategory, PurchaseSnapshot, PurchaseStatus } from './types'

const stageToStatus = (stage: LifecycleStage): PurchaseStatus => {
  if (stage === 'created') return 'awaiting-confirmation'
  if (stage === 'confirmed') return 'in-escrow'
  if (stage === 'completed') return 'completed'
  if (stage === 'other') return 'aborted'
  return 'aborted'
}

const statusToCategory = (status: PurchaseStatus): PurchaseCategory =>
  status === 'awaiting-confirmation' || status === 'in-escrow' ? 'ongoing' : 'history'

const getAddressArg = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return isAddress(value) ? value.toLowerCase() : value
}

export const derivePurchaseSnapshot = (chainId: number, purchaseAddress: string, events: NormalizedEvent[]): PurchaseSnapshot | null => {
  if (events.length === 0) return null

  const ordered = [...events].sort((left, right) => {
    if (left.blockNumber !== right.blockNumber) return left.blockNumber - right.blockNumber
    return left.logIndex - right.logIndex
  })

  const lifecycleEvents = ordered.filter((event) => event.lifecycleStage !== 'other')
  const created = lifecycleEvents.find((event) => event.lifecycleStage === 'created')
  if (!created) return null

  const latest = lifecycleEvents[lifecycleEvents.length - 1]
  if (!latest) return null
  const status = stageToStatus(latest.lifecycleStage)

  return {
    chainId,
    purchaseAddress,
    buyerAddress: getAddressArg(created.args.buyer),
    sellerAddress: getAddressArg(created.args.seller),
    tokenAddress: getAddressArg(created.args.tokenAddress),
    symbol: String(created.args.symbol || ''),
    priceRaw: String(created.args.price || '0'),
    collateralRaw: String(created.args.collateral || '0'),
    priceDisplay: String(created.args.priceDisplay || '0'),
    collateralDisplay: String(created.args.collateralDisplay || '0'),
    creationTxHash: created.txHash,
    latestTxHash: latest.txHash,
    currentStatus: status,
    currentCategory: statusToCategory(status),
    createdAtBlock: created.blockNumber,
    updatedAtBlock: latest.blockNumber,
    createdAt: created.blockTimestamp,
    updatedAt: latest.blockTimestamp,
    lastEventName: latest.eventName,
    createdLogIndex: created.logIndex,
    latestLogIndex: latest.logIndex,
  }
}
