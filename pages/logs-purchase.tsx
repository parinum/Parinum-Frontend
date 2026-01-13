import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import PurchaseStepsNavigation from '@/components/PurchaseStepsNavigation'
import { useRouter } from 'next/router'
import { getPurchaseLogs } from '@/lib/functions'

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const DocumentTextIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

interface TransactionLog {
  id: string
  timestamp: Date
  action: string
  status: 'success' | 'pending' | 'failed'
  txHash: string
  from: string
  to: string
  amount?: string
  gasUsed?: string
}

export default function LogsPurchase() {
  const [purchaseId, setPurchaseId] = useState('')
  const [logs, setLogs] = useState<TransactionLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  const purchaseSteps = [
    { id: 'create', label: 'Create', active: false },
    { id: 'abort', label: 'Abort', active: false },
    { id: 'confirm', label: 'Confirm', active: false },
    { id: 'release', label: 'Release', active: false },
    { id: 'logs', label: 'Logs', active: true },
  ]

  const mockLogs: TransactionLog[] = [
    {
      id: '1',
      timestamp: new Date('2025-01-02T10:30:00'),
      action: 'Purchase Created',
      status: 'success',
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
      status: 'success',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      from: '0x456b789a012c345d678e901f234567890abcdef1',
      to: '0x742d35Cc6f34D84C44Da98B954EedeAC495271d0',
      amount: '0.5 ETH',
      gasUsed: '45,000'
    },
    {
      id: '3',
      timestamp: new Date('2025-01-02T14:22:00'),
      action: 'Funds Released',
      status: 'pending',
      txHash: '0x789012345678901234567890123456789012345678901234567890123456789',
      from: '0x742d35Cc6f34D84C44Da98B954EedeAC495271d0',
      to: '0x456b789a012c345d678e901f234567890abcdef1',
      amount: '0.5 ETH',
      gasUsed: '32,000'
    }
  ]

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!purchaseId) return

    setIsLoading(true)
    setError('')
    
    try {
      const purchaseLogs = await getPurchaseLogs(purchaseId)
      setLogs(purchaseLogs)
    } catch (error) {
      setError(`Error fetching logs: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-dark-400 bg-dark-500/10 border-dark-500/30'
    }
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const openEtherscan = (txHash: string) => {
    window.open(`https://etherscan.io/tx/${txHash}`, '_blank')
  }

  // --- Summary helpers ---
  const parseAmount = (amount?: string): { value: number; unit: string } | null => {
    if (!amount) return null
    const cleaned = amount.replace(/,/g, '').trim()
    const match = cleaned.match(/^([0-9]*\.?[0-9]+)\s*([A-Za-z$€¥₿Ξ]+)?/)
    if (!match) return null
    const value = parseFloat(match[1])
    const unit = match[2] || ''
    if (Number.isNaN(value)) return null
    return { value, unit }
  }

  const summarizeLogs = (items: TransactionLog[]) => {
    const total = items.length
    const pending = items.filter((l) => l.status === 'pending').length
    const completed = items.filter((l) => l.status !== 'pending').length
    const successes = items.filter((l) => l.status === 'success').length
    const successRatePct = completed > 0 ? ((successes / completed) * 100) : null

    const volumes: Record<string, number> = {}
    for (const it of items) {
      // count only confirmed (successful) transfers towards volume
      if (it.status !== 'success' || !it.amount) continue
      const parsed = parseAmount(it.amount)
      if (!parsed) continue
      const key = parsed.unit || 'UNITS'
      volumes[key] = (volumes[key] || 0) + parsed.value
    }
    const volumeDisplay = Object.entries(volumes)
      .map(([unit, val]) => `${val.toLocaleString(undefined, { maximumFractionDigits: 6 })}${unit ? ` ${unit}` : ''}`)
      .join(' + ')

    return { total, pending, successRatePct, volumeDisplay }
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen pt-20 pb-12"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Transaction Logs
            </h1>
            <p className="text-secondary-600 dark:text-dark-300">
              View detailed transaction history and blockchain events
            </p>
          </div>

          {/* Transaction Steps */}
          <PurchaseStepsNavigation steps={purchaseSteps} />

          {/* Search Form */}
          <div
            className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8 mb-8"
          >
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                  Purchase ID
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      Enter the purchase ID to view all related blockchain transactions and events.
                    </div>
                  </div>
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={purchaseId}
                    onChange={(e) => setPurchaseId(e.target.value)}
                    placeholder="0x1234567890abcdef1234567890abcdef12345678"
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 font-mono text-sm"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !purchaseId}
                    className="px-6 py-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-slate-800/30 dark:border-white/30 border-t-slate-800 dark:border-t-white rounded-full animate-spin" />
                    ) : (
                      <SearchIcon />
                    )}
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* Logs Display */}
          {logs.length > 0 && (
            <div
              className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8"
            >
              {/* Summary */}
              {(() => {
                const s = summarizeLogs(logs)
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-slate-100 dark:bg-dark-700/30 border border-primary-500/20 rounded-xl">
                      <span className="text-secondary-600 dark:text-dark-400 text-xs uppercase">Success Rate</span>
                      <p className="text-secondary-900 dark:text-white text-xl font-semibold mt-1">{s.successRatePct === null ? '—' : `${s.successRatePct.toFixed(1)}%`}</p>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-dark-700/30 border border-primary-500/20 rounded-xl">
                      <span className="text-secondary-600 dark:text-dark-400 text-xs uppercase">Outstanding Incomplete</span>
                      <p className="text-secondary-900 dark:text-white text-xl font-semibold mt-1">{s.pending}</p>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-dark-700/30 border border-primary-500/20 rounded-xl">
                      <span className="text-secondary-600 dark:text-dark-400 text-xs uppercase">Total Transactions</span>
                      <p className="text-secondary-900 dark:text-white text-xl font-semibold mt-1">{s.total}</p>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-dark-700/30 border border-primary-500/20 rounded-xl">
                      <span className="text-secondary-600 dark:text-dark-400 text-xs uppercase">Total Volume</span>
                      <p className="text-secondary-900 dark:text-white text-xl font-semibold mt-1">{s.volumeDisplay || '—'}</p>
                    </div>
                  </div>
                )
              })()}
              <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-6">Transaction History</h2>
              
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div
                    key={log.id}
                    className="p-6 bg-slate-100 dark:bg-dark-700/30 border border-primary-500/20 rounded-xl hover:bg-slate-200 dark:hover:bg-dark-700/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                          {log.status.toUpperCase()}
                        </div>
                        <h3 className="text-secondary-900 dark:text-white font-medium">{log.action}</h3>
                      </div>
                      <span className="text-secondary-600 dark:text-dark-400 text-sm">
                        {log.timestamp.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-secondary-600 dark:text-dark-400">From:</span>
                        <p className="text-secondary-900 dark:text-white font-mono">{truncateAddress(log.from)}</p>
                      </div>
                      <div>
                        <span className="text-secondary-600 dark:text-dark-400">To:</span>
                        <p className="text-secondary-900 dark:text-white font-mono">{truncateAddress(log.to)}</p>
                      </div>
                      {log.amount && (
                        <div>
                          <span className="text-secondary-600 dark:text-dark-400">Amount:</span>
                          <p className="text-secondary-900 dark:text-white font-medium">{log.amount}</p>
                        </div>
                      )}
                      {log.gasUsed && (
                        <div>
                          <span className="text-secondary-600 dark:text-dark-400">Gas Used:</span>
                          <p className="text-secondary-900 dark:text-white">{log.gasUsed}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-primary-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-secondary-600 dark:text-dark-400 text-sm">Transaction Hash:</span>
                          <p className="text-secondary-900 dark:text-white font-mono text-sm">{truncateAddress(log.txHash)}</p>
                        </div>
                        <button
                          onClick={() => openEtherscan(log.txHash)}
                          className="flex items-center space-x-2 px-3 py-1 bg-primary-100 dark:bg-primary-500/20 hover:bg-primary-200 dark:hover:bg-primary-500/30 text-primary-700 dark:text-primary-400 rounded-lg transition-colors duration-200"
                        >
                          <span className="text-sm">View on Etherscan</span>
                          <ExternalLinkIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Information Section */}
          <div
            className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Log Types */}
            <div className="p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">Event Types</h3>
              <div className="space-y-2 text-sm text-secondary-600 dark:text-dark-300">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Purchase Created - Initial escrow setup</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Seller Confirmation - Collateral locked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Funds Released - Payment completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>Purchase Aborted - Transaction cancelled</span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">Need Help?</h3>
              <div className="space-y-3 text-sm text-secondary-600 dark:text-dark-300">
                <p>All transactions are recorded on the blockchain for transparency</p>
                <p>Click &quot;View on Etherscan&quot; to see detailed blockchain data</p>
                <p>Pending transactions may take a few minutes to confirm</p>
                <p>Contact support if you notice any discrepancies</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}
