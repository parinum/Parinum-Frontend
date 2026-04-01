import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { AbortPurchaseView } from '@/components/PurchaseFlowViews'
import { abortPurchase, getPurchaseDetails, type PurchaseDetails } from '@/lib/functions'

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function AbortPurchase() {
  const [purchaseId, setPurchaseId] = useState('')
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const purchaseSteps = [
    { id: 'create', label: 'Create', active: false },
    { id: 'abort', label: 'Abort', active: true },
    { id: 'confirm', label: 'Confirm', active: false },
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen pt-20 pb-12"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AbortPurchaseView
            purchaseSteps={purchaseSteps}
            purchaseId={purchaseId}
            onPurchaseIdChange={setPurchaseId}
            purchaseDetails={purchaseDetails}
            showDetails={showDetails}
            message={message}
            isLoading={isLoading}
            onToggleDetails={handleGetDetails}
            onSubmit={handleSubmit}
            headerAction={
              <Link
                href="/how-to-purchase?step=abort"
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-500/15 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
              >
                <InfoIcon />
                <span>Open walkthrough</span>
              </Link>
            }
          />
        </div>
      </motion.div>
    </Layout>
  )
}
