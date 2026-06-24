import Link from 'next/link'
import { motion } from 'framer-motion'
import type { UserPurchase } from '@/lib/functions'

interface ProfilePurchaseCardProps {
  purchase: UserPurchase
  explorerUrl: string
  explorerName: string
}

const STATUS_STYLES: Record<UserPurchase['status'], { label: string; className: string }> = {
  'awaiting-confirmation': { label: 'Awaiting Confirmation', className: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
  'in-escrow': { label: 'In Escrow', className: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  completed: { label: 'Completed', className: 'text-green-400 bg-green-500/10 border-green-500/30' },
  aborted: { label: 'Aborted', className: 'text-red-400 bg-red-500/10 border-red-500/30' },
}

const ACTION_META: Record<'confirm' | 'release' | 'abort', { label: string; href: string }> = {
  confirm: { label: 'Confirm', href: '/confirm-purchase' },
  release: { label: 'Release Funds', href: '/release-purchase' },
  abort: { label: 'Abort', href: '/abort-purchase' },
}

const truncate = (address: string) => {
  if (!address) return 'N/A'
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function ProfilePurchaseCard({ purchase, explorerUrl, explorerName }: ProfilePurchaseCardProps) {
  const statusStyle = STATUS_STYLES[purchase.status]
  const action = purchase.action ? ACTION_META[purchase.action] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl"
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyle.className}`}>
            {statusStyle.label}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium border border-primary-500/30 text-secondary-700 dark:text-dark-200 bg-primary-500/5">
            You are the {purchase.role}
          </span>
        </div>
        <span className="text-secondary-600 dark:text-dark-400 text-sm whitespace-nowrap">
          {purchase.updatedAt.toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-secondary-600 dark:text-dark-400">Counterparty ({purchase.role === 'buyer' ? 'seller' : 'buyer'}):</span>
          <p className="text-secondary-900 dark:text-white font-mono">{truncate(purchase.counterparty)}</p>
        </div>
        <div>
          <span className="text-secondary-600 dark:text-dark-400">Price:</span>
          <p className="text-secondary-900 dark:text-white font-medium">{purchase.price} {purchase.symbol}</p>
        </div>
        <div>
          <span className="text-secondary-600 dark:text-dark-400">Collateral:</span>
          <p className="text-secondary-900 dark:text-white font-medium">{purchase.collateral} {purchase.symbol}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-primary-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-secondary-600 dark:text-dark-400 text-sm">Contract:</span>
          <p className="text-secondary-900 dark:text-white font-mono text-sm">{truncate(purchase.purchaseId)}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${explorerUrl}/address/${purchase.purchaseId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-primary-100 dark:bg-primary-500/20 hover:bg-primary-200 dark:hover:bg-primary-500/30 text-primary-700 dark:text-primary-400 rounded-lg transition-colors duration-200 text-sm"
          >
            View on {explorerName}
          </a>
          {action && (
            <Link
              href={`${action.href}?id=${purchase.purchaseId}`}
              className="px-4 py-2 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-lg shadow hover:shadow-lg transition-all duration-300 text-sm"
            >
              {action.label}
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}
