import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { ReleasePurchaseView } from '@/components/PurchaseFlowViews'
import { releasePurchase, getPurchaseDetails, type PurchaseDetails } from '@/lib/functions'

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  useEffect(() => {
    const id = router.query.id
    if (typeof id === 'string' && id) setPurchaseId(id)
  }, [router.query.id])

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

    setIsSuccess(false)
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
        setShowDetails(true)
      } else {
        setMessage(result.error || 'Purchase not found')
        setPurchaseDetails(null)
      }
    } catch (e) {
      setMessage(`Error fetching details: ${e}`)
      setPurchaseDetails(null)
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
        // On-chain state just changed; drop the now-stale pre-action details card
        setPurchaseDetails(null)
        setShowDetails(false)
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
          <ReleasePurchaseView
            purchaseSteps={purchaseSteps}
            purchaseId={purchaseId}
            onPurchaseIdChange={(value) => {
              setPurchaseId(value)
              setPurchaseDetails(null)
              setShowDetails(false)
              setMessage('')
              setIsSuccess(false)
            }}
            purchaseDetails={purchaseDetails}
            showDetails={showDetails}
            message={message}
            isSuccess={isSuccess}
            isLoading={isLoading}
            onToggleDetails={handleGetDetails}
            onSubmit={handleSubmit}
            headerAction={
              <Link
                href="/how-to-purchase?step=release"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
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
