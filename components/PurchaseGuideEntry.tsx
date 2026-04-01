import Link from 'next/link'

interface PurchaseGuideEntryProps {
  step: 'create' | 'confirm' | 'release' | 'abort'
  role: 'Buyer' | 'Seller' | 'Buyer or Seller'
  title: string
  description: string
}

const accentStyles = {
  create: 'from-blue-500/15 to-cyan-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
  confirm: 'from-violet-500/15 to-fuchsia-500/10 border-violet-500/20 text-violet-700 dark:text-violet-300',
  release: 'from-emerald-500/15 to-teal-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  abort: 'from-amber-500/15 to-orange-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
}

export default function PurchaseGuideEntry({
  step,
  role,
  title,
  description,
}: PurchaseGuideEntryProps) {
  return (
    <div className={`mb-8 rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm ${accentStyles[step]}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
            <span className="rounded-full bg-white/70 px-3 py-1 text-secondary-900 dark:bg-dark-900/40 dark:text-white">
              Animated walkthrough
            </span>
            <span className="rounded-full border border-current/20 px-3 py-1">
              Active role: {role}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-secondary-700 dark:text-dark-300">{description}</p>
          </div>
        </div>
        <Link
          href={`/how-to-purchase?step=${step}`}
          className="inline-flex items-center justify-center rounded-xl bg-secondary-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-secondary-800 dark:bg-white dark:text-secondary-900 dark:hover:bg-slate-100"
        >
          Open walkthrough
        </Link>
      </div>
    </div>
  )
}