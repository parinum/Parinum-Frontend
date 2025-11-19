import { useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import PurchaseStepsNavigation from '@/components/PurchaseStepsNavigation'
import { useRouter } from 'next/router'
import { releasePurchase } from '@/lib/functions'

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
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Release Purchase
            </h1>
            <p className="text-dark-300">
              Buyers can release funds to complete the transaction
            </p>
          </div>

          {/* Transaction Steps */}
          <PurchaseStepsNavigation steps={purchaseSteps} />

          {/* Main Form */}
          <div
            className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase ID */}
              <div className="space-y-3">
                <label className="flex items-center text-white font-medium">
                  Purchase ID
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      Only buyers can release purchases. Both parties receive their collateral back and the price amount is sent to the seller.
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  value={purchaseId}
                  onChange={(e) => setPurchaseId(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors duration-200"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <div
                  className="w-full"
                >
                  <button
                    type="submit"
                    disabled={isLoading || !purchaseId}
                    className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 hover:from-slate-700 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-slate-500/25"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Release Funds'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Status Message */}
          {message && (
            <div className="mt-8 p-4 bg-gradient-to-r from-slate-800/20 to-slate-700/20 border border-slate-500/20 rounded-xl backdrop-blur-sm">
              <p className="text-slate-400 font-mono text-sm break-all">{message}</p>
            </div>
          )}

          {/* Release Guidelines */}
          <div
            className="mt-8 p-6 bg-gradient-to-r from-slate-800/20 to-slate-700/20 border border-slate-500/20 rounded-xl backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-white mb-3">Release Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-dark-300">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</div>
                <div>
                  <p className="font-medium text-white mb-1">Buyer Action</p>
                  <p>Only the buyer can release funds to complete the transaction</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">⟠</div>
                <div>
                  <p className="font-medium text-white mb-1">Automatic Distribution</p>
                  <p>Funds and collateral are automatically distributed to both parties</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
