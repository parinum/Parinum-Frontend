import { useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import PurchaseStepsNavigation from '@/components/PurchaseStepsNavigation'
import { useRouter } from 'next/router'
import { confirmPurchase, getPurchaseDetails, type PurchaseDetails } from '@/lib/functions'
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

export default function ConfirmPurchase() {
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
    { id: 'confirm', label: 'Confirm', active: true },
    { id: 'release', label: 'Release', active: false },
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
      const result = await confirmPurchase(purchaseId)
      if (result.success) {
        setMessage('Purchase confirmed successfully!')
        setIsSuccess(true)
      } else {
        setMessage(`Error: ${result.error}`)
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
              Confirm Purchase
            </h1>
            <p className="text-secondary-600 dark:text-dark-300">
              Sellers confirm purchases by locking collateral to guarantee delivery
            </p>
          </div>

          {/* Transaction Steps */}
          <PurchaseStepsNavigation steps={purchaseSteps} />

          {/* Main Form */}
          <div
            className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase ID Input */}
              <div className="space-y-3">
                <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                  Purchase ID
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      Only sellers can confirm purchases. The seller sends the collateral amount, and only receives the funds after the buyer confirms receipt of goods.
                    </div>
                  </div>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={purchaseId}
                    onChange={(e) => setPurchaseId(e.target.value)}
                    placeholder="0x1234567890abcdef1234567890abcdef12345678"
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 font-mono text-sm"
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
                    <span>Confirming Purchase...</span>
                  </>
                ) : (
                  <span>Confirm Purchase</span>
                )}
              </button>
            </form>
          </div>

          {/* Status Message */}
          {message && (
            <div className="mt-8 p-4 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl backdrop-blur-sm">
              <p className="text-secondary-600 dark:text-slate-400 font-mono text-sm break-all">{message}</p>
            </div>
          )}

          {/* Information Cards */}
          <div
            className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* For Sellers */}
            <div className="p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center">
                <span className="w-2 h-2 bg-slate-500 rounded-full mr-3"></span>
                For Sellers
              </h3>
              <ul className="space-y-2 text-sm text-secondary-600 dark:text-dark-300">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  Lock collateral equal to the purchase amount
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  Funds are held in escrow until delivery
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  Receive payment after buyer confirms receipt
                </li>
              </ul>
            </div>

            {/* Security Features */}
            <div className="p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center">
                <span className="w-2 h-2 bg-slate-500 rounded-full mr-3"></span>
                Security Features
              </h3>
              <ul className="space-y-2 text-sm text-secondary-600 dark:text-dark-300">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  Smart contract escrow protection
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  Automated dispute resolution
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                  Collateral-backed guarantees
                </li>
              </ul>
            </div>
          </div>

          {/* Process Flow */}
          <div
            className="mt-8 p-6 bg-white/70 dark:bg-dark-800/30 backdrop-blur-sm border border-primary-500/20 rounded-xl"
          >
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Confirmation Process</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg mx-auto mb-3">
                  1
                </div>
                <h4 className="font-medium text-secondary-900 dark:text-white mb-2">Enter Purchase ID</h4>
                <p className="text-sm text-secondary-600 dark:text-dark-400">Provide the unique purchase identifier</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg mx-auto mb-3">
                  2
                </div>
                <h4 className="font-medium text-secondary-900 dark:text-white mb-2">Lock Collateral</h4>
                <p className="text-sm text-secondary-600 dark:text-dark-400">Secure the transaction with collateral</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg mx-auto mb-3">
                  3
                </div>
                <h4 className="font-medium text-secondary-900 dark:text-white mb-2">Fulfill Order</h4>
                <p className="text-sm text-secondary-600 dark:text-dark-400">Ship or deliver the product</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg mx-auto mb-3">
                  4
                </div>
                <h4 className="font-medium text-secondary-900 dark:text-white mb-2">Receive Payment</h4>
                <p className="text-sm text-secondary-600 dark:text-dark-400">Get paid after buyer confirmation</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}
