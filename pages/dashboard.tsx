import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'

const WalletIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const ArrowUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
  </svg>
)

const ArrowDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
  </svg>
)

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const ReceiveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
  </svg>
)

interface Transaction {
  id: string
  type: 'send' | 'receive'
  amount: number
  currency: string
  address: string
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [balance, setBalance] = useState({
    eth: 2.4563,
    usd: 4567.89
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const recentTransactions: Transaction[] = [
    {
      id: '1',
      type: 'receive',
      amount: 0.5,
      currency: 'ETH',
      address: '0x742d...4e83',
      timestamp: new Date('2025-01-02T10:30:00'),
      status: 'completed'
    },
    {
      id: '2',
      type: 'send',
      amount: 1.2,
      currency: 'ETH',
      address: '0x123a...9f21',
      timestamp: new Date('2025-01-01T15:45:00'),
      status: 'completed'
    },
    {
      id: '3',
      type: 'receive',
      amount: 0.8,
      currency: 'ETH',
      address: '0x456b...2c34',
      timestamp: new Date('2024-12-31T09:15:00'),
      status: 'pending'
    }
  ]

  const portfolioData = [
    { name: 'ETH', balance: 2.4563, value: 4567.89, change: 5.2 },
    { name: 'USDC', balance: 1250.00, value: 1250.00, change: 0.1 },
  { name: 'PRM', balance: 10000, value: 850.00, change: 12.8 }
  ]

  if (!mounted) return null

  const connectWallet = () => {
    setIsConnected(true)
  }

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!isConnected ? (
            // Wallet Connection Section
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center py-20"
            >
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-8">
                  <WalletIcon />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">
                  Connect Your Wallet
                </h1>
                <p className="text-dark-300 mb-8">
                  Connect your wallet to access your Parinum dashboard and manage your digital assets.
                </p>
                <motion.button
                  onClick={connectWallet}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Connect Wallet
                </motion.button>
              </div>
            </motion.div>
          ) : (
            // Dashboard Content
            <div className="space-y-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex justify-between items-center"
              >
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                  <p className="text-dark-300">Manage your digital assets and transactions</p>
                </div>
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center space-x-2 transition-colors duration-200"
                  >
                    <SendIcon />
                    <span>Send</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl flex items-center space-x-2 transition-colors duration-200"
                  >
                    <ReceiveIcon />
                    <span>Receive</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Balance Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <div className="col-span-1 md:col-span-2 p-8 bg-gradient-to-br from-slate-800/20 to-slate-700/20 border border-slate-500/30 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Total Balance</h2>
                    <TrendingUpIcon />
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-white">${balance.usd.toLocaleString()}</div>
                    <div className="text-dark-300">{balance.eth} ETH</div>
                    <div className="flex items-center text-green-400 text-sm">
                      <ArrowUpIcon />
                      <span className="ml-1">+5.2% (24h)</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-dark-800/50 border border-primary-500/20 rounded-2xl backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full p-3 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-xl transition-colors duration-200">
                      Buy Crypto
                    </button>
                    <button className="w-full p-3 bg-secondary-600/20 hover:bg-secondary-600/30 text-secondary-400 rounded-xl transition-colors duration-200">
                      Stake Tokens
                    </button>
                    <button className="w-full p-3 bg-dark-600/50 hover:bg-dark-600/70 text-dark-300 rounded-xl transition-colors duration-200">
                      View Analytics
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Portfolio */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="p-8 bg-dark-800/50 border border-primary-500/20 rounded-2xl backdrop-blur-sm"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Portfolio</h2>
                <div className="space-y-4">
                  {portfolioData.map((asset, index) => (
                    <div key={asset.name} className="flex items-center justify-between p-4 bg-dark-700/30 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-bold">
                          {asset.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{asset.name}</div>
                          <div className="text-dark-400 text-sm">{asset.balance} {asset.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">${asset.value.toLocaleString()}</div>
                        <div className={`flex items-center text-sm ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {asset.change >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                          <span className="ml-1">{Math.abs(asset.change)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Transactions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="p-8 bg-dark-800/50 border border-primary-500/20 rounded-2xl backdrop-blur-sm"
              >
                <h2 className="text-xl font-semibold text-white mb-6">Recent Transactions</h2>
                <div className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-dark-700/30 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'receive' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {tx.type === 'receive' ? <ReceiveIcon /> : <SendIcon />}
                        </div>
                        <div>
                          <div className="text-white font-medium capitalize">{tx.type}</div>
                          <div className="text-dark-400 text-sm">{tx.address}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${tx.type === 'receive' ? 'text-green-400' : 'text-white'}`}>
                          {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.currency}
                        </div>
                        <div className="text-dark-400 text-sm">
                          {tx.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {tx.status}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
