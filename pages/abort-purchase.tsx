import { useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import PurchaseStepsNavigation from '@/components/PurchaseStepsNavigation'
import { useRouter } from 'next/router'
import { abortPurchase } from '@/lib/functions'

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

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

export default function AbortPurchase() {
  const [purchaseId, setPurchaseId] = useState('')
  const [reason, setReason] = useState('')
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const router = useRouter()

  const purchaseSteps = [
    { id: 'create', label: 'Create', active: false },
    { id: 'abort', label: 'Abort', active: true },
    { id: 'confirm', label: 'Confirm', active: false },
    { id: 'release', label: 'Release', active: false },
    { id: 'logs', label: 'Logs', active: false },
  ]

  const abortReasons = [
    'Seller cannot fulfill the order',
    'Product specifications changed',
    'Shipping not available to location',
    'Payment issues',
    'Mutual agreement to cancel',
    'Other (please specify)'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    try {
      const result = await abortPurchase(purchaseId)
      if (result.success) {
        setMessage('Purchase aborted successfully. All funds have been returned.')
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
              Abort Purchase
            </h1>
            <p className="text-dark-300">
              Cancel a purchase and return all escrowed funds
            </p>
          </div>

          {/* Transaction Steps */}
          <PurchaseStepsNavigation steps={purchaseSteps} />

          {/* Main Form */}
          <div
            className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase ID Input */}
              <div className="space-y-3">
                <label className="flex items-center text-white font-medium">
                  Purchase ID
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      Both buyers and sellers can abort a purchase before confirmation. After confirmation, only mutual agreement or dispute resolution can cancel.
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  value={purchaseId}
                  onChange={(e) => setPurchaseId(e.target.value)}
                  placeholder="0x1234567890abcdef1234567890abcdef12345678"
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 font-mono text-sm"
                  required
                />
              </div>

              {/* Reason Selection */}
              <div className="space-y-3">
                <label className="text-white font-medium">
                  Reason for Cancellation
                </label>
                <div className="space-y-2">
                  {abortReasons.map((reasonOption, index) => (
                    <label key={index} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={reasonOption}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 w-4 h-4 text-red-500 bg-dark-700/50 border-red-500/30 focus:ring-red-500/50"
                        required
                      />
                      <span className="text-dark-300 text-sm">{reasonOption}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              {reason === 'Other (please specify)' && (
                <div className="space-y-3">
                  <label className="text-white font-medium">Additional Details</label>
                  <textarea
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Please provide more details about the reason for cancellation..."
                    className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 min-h-[100px] resize-vertical"
                    required
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Cancellation...</span>
                  </>
                ) : (
                  <span>Abort Purchase</span>
                )}
              </button>
            </form>
          </div>

          {/* Status Message */}
          {message && (
            <div className="mt-8 p-4 bg-gradient-to-r from-slate-800/20 to-slate-700/20 border border-slate-500/20 rounded-xl backdrop-blur-sm">
              <p className="text-slate-400 font-mono text-sm break-all">{message}</p>
            </div>
          )}

          {/* Important Information */}
          <div
            className="mt-8 p-6 bg-gradient-to-r from-slate-800/20 to-slate-700/20 border border-slate-500/20 rounded-xl backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <ExclamationIcon />
              <span className="ml-2">Important Information</span>
            </h3>
            <div className="space-y-2 text-sm text-dark-300">
              <p>⚠️ <strong>Cancellation Policy:</strong> All escrowed funds will be returned to their original owners.</p>
              <p>💰 <strong>Fund Distribution:</strong> Buyer's payment and seller's collateral (if any) will be automatically refunded.</p>
              <p>📝 <strong>Record Keeping:</strong> This cancellation will be recorded on the blockchain for transparency.</p>
              <p>🤝 <strong>Mutual Agreement:</strong> Both parties should agree to the cancellation when possible.</p>
            </div>
          </div>

          {/* Refund Process */}
          <div
            className="mt-8 p-6 bg-dark-800/30 backdrop-blur-sm border border-primary-500/20 rounded-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Refund Process</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Initiate Cancellation</h4>
                  <p className="text-sm text-dark-400">Submit cancellation request with reason</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Process Refund</h4>
                  <p className="text-sm text-dark-400">Smart contract automatically processes refunds</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Funds Returned</h4>
                  <p className="text-sm text-dark-400">All funds returned to original wallets</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
