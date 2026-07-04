import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useChainId } from 'wagmi'
import Layout from '@/components/Layout'
import ProfilePurchaseCard from '@/components/ProfilePurchaseCard'
import { WalletButton } from '@/components/WalletButton'
import { getUserPurchases, getCachedUserPurchases, setCachedUserPurchases, type UserPurchase } from '@/lib/functions'
import { getBlockExplorer, getParinumNetworkConfig } from '@/lib/parinum'

type Tab = 'ongoing' | 'history'

type BackendProfilePurchase = Omit<UserPurchase, 'createdAt' | 'updatedAt'> & {
  chainId?: number
  createdAt: string
  updatedAt: string
  explorerUrl?: string
}

const backendEnabled = (process.env.NEXT_PUBLIC_PROFILE_BACKEND_ENABLED ?? 'true') === 'true'
const backendBaseUrl = process.env.NEXT_PUBLIC_PROFILE_BACKEND_URL?.trim().replace(/\/$/, '') || 'https://api.parinum.com'

const normalizeBackendPurchases = (items: BackendProfilePurchase[]): UserPurchase[] =>
  items.map((item) => ({
    purchaseId: item.purchaseId,
    role: item.role,
    counterparty: item.counterparty,
    price: item.price,
    collateral: item.collateral,
    tokenAddress: item.tokenAddress,
    symbol: item.symbol,
    status: item.status,
    category: item.category,
    action: item.action,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    txHash: item.txHash,
  }))

const fetchBackendPurchases = async (address: string, chainId: number, forceRefresh: boolean) => {
  if (!backendEnabled || !backendBaseUrl) return null

  const params = new URLSearchParams({ chainId: String(chainId), limit: '100' })
  if (forceRefresh) params.set('refresh', '1')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 8_000)

  try {
    const response = await fetch(`${backendBaseUrl}/profile/${address}/purchases?${params.toString()}`, {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Backend request failed with ${response.status}`)
    }

    const payload = (await response.json()) as { items?: BackendProfilePurchase[] }
    return normalizeBackendPurchases(Array.isArray(payload.items) ? payload.items : [])
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}

export default function Profile() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const explorer = getBlockExplorer(chainId)
  const networkName = getParinumNetworkConfig(chainId)?.name || 'this network'

  const [purchases, setPurchases] = useState<UserPurchase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('ongoing')

  const load = useCallback(
    async (forceRefresh: boolean) => {
      if (!address || !chainId) return
      setIsLoading(true)
      setError(null)
      try {
        let data: UserPurchase[]
        if (backendEnabled && backendBaseUrl) {
          const backendData = await fetchBackendPurchases(address, chainId, forceRefresh)
          if (!backendData) {
            throw new Error('Profile backend is enabled but unavailable. Please try again shortly.')
          }
          data = backendData
        } else {
          data = await getUserPurchases(address, forceRefresh)
        }
        setCachedUserPurchases(chainId, address, data)
        setPurchases(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load your purchases. Please try again.')
      } finally {
        setIsLoading(false)
        setHasLoaded(true)
      }
    },
    [address, chainId]
  )

  useEffect(() => {
    setHasLoaded(false)
    setError(null)
    // Hydrate instantly from the cross-reload cache, then refresh from the chain.
    setPurchases(getCachedUserPurchases(chainId, address) ?? [])
    if (address) load(false)
  }, [address, chainId, load])

  const ongoing = purchases.filter((p) => p.category === 'ongoing')
  const history = purchases.filter((p) => p.category === 'history')
  const visible = activeTab === 'ongoing' ? ongoing : history

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen pt-20 pb-12"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">Profile</h1>
            <p className="text-secondary-600 dark:text-dark-300">Your escrow purchases on {networkName}</p>
          </div>

          {!isConnected || !address ? (
            <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-10 text-center">
              <p className="text-secondary-700 dark:text-dark-200 mb-6">Connect your wallet to view your purchases.</p>
              <div className="flex justify-center">
                <WalletButton />
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-secondary-600 dark:text-dark-400 text-xs uppercase">Connected wallet</span>
                  <p className="text-secondary-900 dark:text-white font-mono">{`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
                  <p className="text-secondary-600 dark:text-dark-400 text-sm mt-1">{networkName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => load(true)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl shadow hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/40 rounded-2xl p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-red-700 dark:text-red-300 text-sm">Couldn&apos;t load your purchases. {error}</p>
                  <button
                    type="button"
                    onClick={() => load(true)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Try again
                  </button>
                </div>
              )}

              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-dark-700/40 border border-primary-500/20 rounded-xl mb-6 w-full sm:w-auto">
                {(['ongoing', 'history'] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-white dark:bg-dark-800 text-secondary-900 dark:text-white shadow'
                        : 'text-secondary-600 dark:text-dark-300 hover:text-secondary-900 dark:hover:text-white'
                    }`}
                  >
                    {tab === 'ongoing' ? `Ongoing (${ongoing.length})` : `History (${history.length})`}
                  </button>
                ))}
              </div>

              {isLoading && !hasLoaded ? (
                <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-10 text-center">
                  <div className="w-8 h-8 mx-auto border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4" />
                  <p className="text-secondary-600 dark:text-dark-300">Loading your purchases… this can take a moment.</p>
                </div>
              ) : visible.length > 0 ? (
                <div className="space-y-4">
                  {visible.map((purchase) => (
                    <ProfilePurchaseCard
                      key={purchase.purchaseId}
                      purchase={purchase}
                      explorerUrl={explorer.url}
                      explorerName={explorer.name}
                    />
                  ))}
                </div>
              ) : error ? null : (
                <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-10 text-center">
                  <p className="text-secondary-600 dark:text-dark-300">
                    {activeTab === 'ongoing' ? 'No ongoing purchases.' : 'No purchase history yet.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}
