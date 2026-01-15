import { PurchaseDetails } from '@/lib/functions'
import { useState } from 'react'

interface PurchaseDetailsCardProps {
  details: PurchaseDetails | null
  purchaseId?: string
}

const shortenAddress = (addr: string) => {
  if (!addr) return 'N/A'
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
}

const CopyIcon = () => (
  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const CheckIcon = () => (
   <svg className="w-4 h-4 ml-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg> 
)

const CopyButton = ({ text }: { text: string | undefined }) => {
  const [copied, setCopied] = useState(false)

  if (!text || text === 'N/A') return null

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center text-secondary-400 hover:text-secondary-600 dark:hover:text-white transition-colors focus:outline-none ml-1"
      title="Copy to clipboard"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  )
}

export default function PurchaseDetailsCard({ details, purchaseId }: PurchaseDetailsCardProps) {
  const displayId = details?.id || purchaseId || 'N/A'
  const displayStatus = details?.status || 'N/A'
  const displaySeller = details?.seller || 'N/A'
  const displayBuyer = details?.buyer || 'N/A'
  const displayPrice = details?.price || 'N/A'
  const displayCollateral = details?.collateral || 'N/A'
  const displayTokenAddress = details?.tokenAddress || 'N/A'
  const displayTimestamp = details?.timestamp ? details.timestamp.toLocaleString() : 'N/A'

  return (
    <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-6 mt-6 shadow-xl">
      <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">
        Purchase Details
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-secondary-500 dark:text-dark-400">Purchase ID</p>
          <div className="flex items-center">
            <p className="font-mono text-secondary-900 dark:text-white break-all">{displayId}</p>
            <CopyButton text={displayId} />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-secondary-500 dark:text-dark-400">Status</p>
          <p className="font-medium text-secondary-900 dark:text-white capitalize">
             <span className={`px-2 py-1 rounded text-xs ${
                displayStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                displayStatus === 'created' ? 'bg-blue-100 text-blue-800' :
                displayStatus === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
             }`}>
              {displayStatus}
             </span>
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-secondary-500 dark:text-dark-400">Seller</p>
          <div className="flex items-center">
            <p className="font-mono text-secondary-900 dark:text-white" title={displaySeller}>
              {shortenAddress(displaySeller)}
            </p>
            <CopyButton text={displaySeller} />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-secondary-500 dark:text-dark-400">Buyer</p>
           <div className="flex items-center">
            <p className="font-mono text-secondary-900 dark:text-white" title={displayBuyer}>
              {shortenAddress(displayBuyer)}
            </p>
            <CopyButton text={displayBuyer} />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-secondary-500 dark:text-dark-400">Price (Values in Wei)</p>
          <p className="font-mono text-secondary-900 dark:text-white">{displayPrice}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-secondary-500 dark:text-dark-400">Collateral (Values in Wei)</p>
          <p className="font-mono text-secondary-900 dark:text-white">{displayCollateral}</p>
        </div>

        <div className="space-y-1 md:col-span-2">
            <p className="text-sm text-secondary-500 dark:text-dark-400">Token Address</p>
            <div className="flex items-center">
             <p className="font-mono text-secondary-900 dark:text-white break-all">{displayTokenAddress}</p>
             <CopyButton text={displayTokenAddress} />
            </div>
        </div>
        
         <div className="space-y-1 md:col-span-2">
            <p className="text-sm text-secondary-500 dark:text-dark-400">Timestamp</p>
             <p className="text-secondary-900 dark:text-white">{displayTimestamp}</p>
        </div>
      </div>
    </div>
  )
}
