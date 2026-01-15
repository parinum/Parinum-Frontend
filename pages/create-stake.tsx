import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useRouter } from 'next/router'
import { 
  createNewStake, 
  getStakeInfo, 
  calculateStakeMultiplier,
  getWalletBalance,
  connectWallet 
} from '@/lib/functions'

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

// Removed CoinsIcon per request

export default function CreateStake() {
  const [stakeAmount, setStakeAmount] = useState('')
  const [stakeTime, setStakeTime] = useState('')
  const [multiplier, setMultiplier] = useState('1.00')
  const [walletBalance, setWalletBalance] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Mock wallet balance for now
    setWalletBalance('1000.0')
  }, [])

  const handleStakeTimeChange = (value: string) => {
    setStakeTime(value)
    setMultiplier(calculateStakeMultiplier(Number(value)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (!stakeAmount || !stakeTime) {
      setMessage('Please fill in all fields')
      setIsSuccess(false)
      setIsLoading(false)
      return
    }

    if (Number(stakeAmount) <= 0) {
      setMessage('Stake amount must be greater than 0')
      setIsSuccess(false)
      setIsLoading(false)
      return
    }

    if (Number(stakeAmount) > Number(walletBalance)) {
      setMessage('Insufficient balance')
      setIsSuccess(false)
      setIsLoading(false)
      return
    }

    try {
      const result = await createNewStake(stakeAmount, Number(stakeTime))
      if (result.success) {
        setMessage(`Successfully created stake of ${stakeAmount} PRM for ${getStakeDurationLabel(Number(stakeTime))}!`)
        setIsSuccess(true)
        // Reset form
        setStakeAmount('')
        setStakeTime('')
        setMultiplier('1.00')
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

  const getStakeDurationLabel = (seconds: number): string => {
    const days = seconds / 86400
    if (days >= 365) return `${Math.round(days / 365)} year(s)`
    if (days >= 30) return `${Math.round(days / 30)} month(s)`
    if (days >= 7) return `${Math.round(days / 7)} week(s)`
    return `${Math.round(days)} day(s)`
  }

  const stakeTimeOptions = [
    { label: '1 Day', value: 86400, description: 'Short term staking', apy: '2%' },
    { label: '7 Days', value: 604800, description: 'Weekly staking', apy: '5%' },
    { label: '30 Days', value: 2592000, description: 'Monthly staking', apy: '8%' },
    { label: '90 Days', value: 7776000, description: 'Quarterly staking', apy: '12%' },
    { label: '365 Days', value: 31536000, description: 'Annual staking', apy: '18%' },
  ]

  const estimatedRewards = stakeAmount && stakeTime ? 
    (Number(stakeAmount) * (Number(multiplier) - 1)).toFixed(4) : '0'

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Create New Stake
            </h1>
            <p className="text-secondary-600 dark:text-dark-300">
              Stake your PRM tokens to earn rewards based on staking duration
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="lg:col-span-2 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Wallet Balance */}
                <div className="p-4 bg-slate-100 dark:bg-dark-700/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-600 dark:text-dark-300">Available Balance:</span>
                    <span className="text-xl font-bold text-secondary-900 dark:text-white">{walletBalance} PRM</span>
                  </div>
                </div>

                {/* Stake Amount */}
                <div className="space-y-3">
                  <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                    Stake Amount
                    <div className="group relative ml-2">
                      <InfoIcon />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        Enter the amount of PRM tokens you want to stake. Your tokens will be locked for the selected duration.
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 pr-16 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors duration-200"
                      required
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-secondary-400 dark:text-dark-400">
                      PRM
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {['25%', '50%', '75%', '100%'].map((percentage) => (
                      <button
                        key={percentage}
                        type="button"
                        onClick={() => setStakeAmount((Number(walletBalance) * Number(percentage.slice(0, -1)) / 100).toString())}
                        className="px-3 py-1 text-xs bg-slate-200 dark:bg-dark-700/50 text-secondary-600 dark:text-dark-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                      >
                        {percentage}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stake Duration */}
                <div className="space-y-3">
                  <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                    Stake Duration
                    <div className="group relative ml-2">
                      <InfoIcon />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        Longer staking periods offer higher multipliers and better rewards. Tokens are locked for the entire duration.
                      </div>
                    </div>
                  </label>
                  <select
                    value={stakeTime}
                    onChange={(e) => handleStakeTimeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors duration-200"
                    required
                  >
                    <option value="">Select staking duration...</option>
                    {stakeTimeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description} (~{option.apy} APY)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || !stakeAmount || !stakeTime}
                  className="w-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300 hover:from-slate-300 hover:to-slate-400 dark:hover:from-slate-700 dark:hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-slate-500/25"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-slate-800/30 dark:border-white/30 border-t-slate-800 dark:border-t-white rounded-full animate-spin"></div>
                      <span>Creating Stake...</span>
                    </div>
                  ) : (
                    'Create Stake'
                  )}
                </motion.button>

                {/* Status Message */}
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${
                      isSuccess 
                        ? 'bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400' 
                        : 'bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {isSuccess && <CheckIcon />}
                      <span>{message}</span>
                    </div>
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* Stake Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Preview Card */}
              <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Stake Preview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-dark-300">Amount:</span>
                    <span className="text-secondary-900 dark:text-white font-medium">{stakeAmount || '0'} PRM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-dark-300">Duration:</span>
                    <span className="text-secondary-900 dark:text-white font-medium">
                      {stakeTime ? getStakeDurationLabel(Number(stakeTime)) : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-dark-300">Multiplier:</span>
                    <span className="text-primary-600 dark:text-primary-400 font-bold">{multiplier}x</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-dark-600"></div>
                  <div className="flex justify-between">
                    <span className="text-secondary-600 dark:text-dark-300">Est. Bonus Rewards:</span>
                    <span className="text-green-600 dark:text-green-400 font-bold">{estimatedRewards} PRM</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/withdraw-dividend')}
                    className="w-full bg-slate-100 dark:bg-dark-700/50 text-secondary-900 dark:text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:bg-primary-100 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400 border border-slate-200 dark:border-dark-600 hover:border-primary-500/30"
                  >
                    View Staking Dashboard
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/stake-dashboard')}
                    className="w-full bg-slate-100 dark:bg-dark-700/50 text-secondary-900 dark:text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:bg-secondary-100 dark:hover:bg-secondary-500/20 hover:text-secondary-600 dark:hover:text-secondary-400 border border-slate-200 dark:border-dark-600 hover:border-secondary-500/30"
                  >
                    Manage Stakes
                  </motion.button>
                </div>
              </div>

              {/* Staking Tips */}
              <div className="bg-gradient-to-r from-slate-100/50 to-slate-200/50 dark:from-slate-800/20 dark:to-slate-700/20 border border-slate-500/20 rounded-xl p-4">
                <h4 className="text-secondary-900 dark:text-white font-medium mb-2">Staking Tips</h4>
                <ul className="text-sm text-secondary-600 dark:text-dark-300 space-y-1">
                  <li>• Longer stakes earn higher multipliers</li>
                  <li>• Rewards compound over time</li>
                  <li>• Stakes can be reset after completion</li>
                  <li>• Early withdrawal forfeits bonus rewards</li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/withdraw-dividend')}
              className="bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white py-3 px-8 rounded-xl font-semibold text-lg transition-all duration-300 hover:from-slate-300 hover:to-slate-400 dark:hover:from-slate-700 dark:hover:to-slate-800 shadow-lg hover:shadow-slate-500/25"
            >
              Back to Staking Dashboard
            </motion.button>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
