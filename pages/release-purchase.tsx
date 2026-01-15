import { useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import PurchaseStepsNavigation from '@/components/PurchaseStepsNavigation'
import { useRouter } from 'next/router'
import { releasePurchase, getPurchaseDetails, type PurchaseDetails } from '@/lib/functions'
import PurchaseDetailsCard from '@/components/PurchaseDetailsCard'

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

export default function ReleasePurchase() {
  const [purchaseId, setPurchaseId] = useState('')
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const router = useRouter()

  const purchaseSteps = [
    { id: 'create', label: 'Create', active: false },
    { id: 'abort', label: 'Abort', active: false },
    { id: 'confirm', label: 'Confirm', active: false },
    { id: 'release', label: 'Release', active: true },
    { id: 'logs', label: 'Logs', active: false },
  ]

  const handleGetDetails = async () => {
    if (showDetails) {
      setShowDetails(false)
      return
    }

    if (!purchaseId) {
      setMessage('Please enter a purchase ID')
      return
    }
    setIsLoading(true)
    setMessage('')
    try {
      const result = await getPurchaseDetails(purchaseId)
      if (result.success && result.data) {
        setPurchaseDetails(result.data)
      } else {
        setMessage(result.error || 'Purchase not found')
        setPurchaseDetails(null)
      }
      setShowDetails(true)
    } catch (e) {
      setMessage(`Error fetching details: ${e}`)
      setPurchaseDetails(null)
      setShowDetails(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    try {
      const result = await releasePurchase(purchaseId)
      if (result.success) {
        setMessage('Funds released successfully!')
        setIsSuccess(true)
      } else {
        setMessage(`Error: ${result.error}`)
        console.log('Release Purchase Error:', result.error)
        setIsSuccess(false)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
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
              Release Purchase
            </h1>
            <p className="text-secondary-600 dark:text-dark-300">
              Buyers can release funds to complete the transaction
            </p>
          </div>

          {/* Transaction Steps */}
          <PurchaseStepsNavigation steps={purchaseSteps} />

          {/* Main Form */}
          <div
            className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase ID */}
              <div className="space-y-3">
                <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                  Purchase ID
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      Only buyers can release purchases. Both parties receive their collateral back and the price amount is sent to the seller.
                    </div>
                  </div>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={purchaseId}
                    onChange={(e) => setPurchaseId(e.target.value)}
                    placeholder="0x1234567890abcdef1234567890abcdef12345678"
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors duration-200 font-mono text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGetDetails}
                    disabled={isLoading}
                    className="px-6 py-3 bg-slate-200 dark:bg-dark-700 text-slate-800 dark:text-white font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-dark-600 transition-colors whitespace-nowrap"
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>

              {showDetails && <PurchaseDetailsCard details={purchaseDetails} purchaseId={purchaseId} />}


              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !purchaseId}
                className="w-full px-6 py-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-800/30 dark:border-white/30 border-t-slate-800 dark:border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Release Funds</span>
                )}
              </button>
            </form>
          </div>

          {/* Status Message */}
          {message && (
            <div className="mt-8 p-4 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-2xl backdrop-blur-sm">
              <p className="text-secondary-600 dark:text-slate-400 font-mono text-sm break-all">{message}</p>
            </div>
          )}

          {/* Release Guidelines */}
          <div
            className="mt-8 p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-2xl backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">Release Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-secondary-600 dark:text-dark-300">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-secondary-900 dark:text-white text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white mb-1">Buyer Action</p>
                  <p>Only the buyer can release funds to complete the transaction</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-secondary-900 dark:text-white text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white mb-1">Verify Product</p>
                  <p>Buyer should only release funds on satisfactory receipt of the product</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-secondary-900 dark:text-white text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white mb-1">Automatic Distribution</p>
                  <p>Funds and collateral are automatically distributed to both parties</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}
