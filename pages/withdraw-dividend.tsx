import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useRouter } from 'next/router'
import { 
  getStakeInfo, 
  claimRewardsandWithdrawStake, 
  claimRewardsandResetStake,
  calculateStakeMultiplier 
} from '@/lib/functions'

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

// Removed CoinsIcon per request

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function WithdrawDividend() {
  const [totalStake, setTotalStake] = useState('0')
  const [availableStake, setAvailableStake] = useState('0')
  const [totalReward, setTotalReward] = useState('0')
  const [availableReward, setAvailableReward] = useState('0')
  const [stakeTime, setStakeTime] = useState('0')
  const [multiplier, setMultiplier] = useState('1.00')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const router = useRouter()

  const fetchInfo = async () => {
    try {
      const { totalAmount, totalRewardAmount, availableAmount, availableRewardAmount } = await getStakeInfo()
      setTotalStake(totalAmount)
      setTotalReward(totalRewardAmount)
      setAvailableStake(availableAmount)
      setAvailableReward(availableRewardAmount)
    } catch (error) {
      console.log(`Error: ${error}`)
    }
  }

  useEffect(() => {
    fetchInfo()
  }, [])

  const handleStakeTimeChange = (value: string) => {
    setStakeTime(value)
    setMultiplier(calculateStakeMultiplier(Number(value)))
  }

  const handleWithdrawStake = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const result = await claimRewardsandWithdrawStake()
      if (result.success) {
        setMessage('Successfully withdrew stake and claimed rewards!')
        setIsSuccess(true)
        await fetchInfo()
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

  const handleResetStake = async () => {
    if (!stakeTime || Number(stakeTime) <= 0) {
      setMessage('Please select a valid stake time')
      setIsSuccess(false)
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      const result = await claimRewardsandResetStake(Number(stakeTime))
      if (result.success) {
        setMessage('Successfully reset stake and claimed rewards!')
        setIsSuccess(true)
        await fetchInfo()
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

  const stakeTimeOptions = [
    { label: '1 Day', value: 86400, description: 'Short term staking' },
    { label: '7 Days', value: 604800, description: 'Weekly staking' },
    { label: '30 Days', value: 2592000, description: 'Monthly staking' },
    { label: '90 Days', value: 7776000, description: 'Quarterly staking' },
    { label: '365 Days', value: 31536000, description: 'Annual staking' },
  ]

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Staking Dashboard
            </h1>
            <p className="text-xl text-dark-300 max-w-3xl mx-auto">
              Stake your PRM tokens to earn rewards and participate in protocol governance
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            <div className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                {/* Icon removed */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{totalStake}</p>
                  <p className="text-sm text-dark-400">PRM</p>
                </div>
              </div>
              <h3 className="text-dark-300 font-medium">Total Staked</h3>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <TrendingUpIcon />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{totalReward}</p>
                  <p className="text-sm text-dark-400">PRM</p>
                </div>
              </div>
              <h3 className="text-dark-300 font-medium">Total Rewards</h3>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                {/* Icon removed */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{availableStake}</p>
                  <p className="text-sm text-dark-400">PRM</p>
                </div>
              </div>
              <h3 className="text-dark-300 font-medium">Available to Withdraw</h3>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <TrendingUpIcon />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{availableReward}</p>
                  <p className="text-sm text-dark-400">PRM</p>
                </div>
              </div>
              <h3 className="text-dark-300 font-medium">Available Rewards</h3>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Withdraw Stake Section */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Withdraw Stake</h2>
              <div className="space-y-6">
                <div className="p-4 bg-dark-700/30 rounded-xl">
                  <p className="text-dark-300 mb-2">Available to withdraw:</p>
                  <p className="text-2xl font-bold text-white">{availableStake} PRM</p>
                  <p className="text-lg text-green-400">+ {availableReward} PRM rewards</p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleWithdrawStake}
                  disabled={isLoading || Number(availableStake) <= 0}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:from-slate-700 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Withdraw Stake & Claim Rewards'}
                </motion.button>
              </div>
            </motion.div>

            {/* Reset Stake Section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Reset Stake</h2>
              <div className="space-y-6">
                <div>
                  <label className="flex items-center text-white font-medium mb-3">
                    New Stake Duration
                    <div className="group relative ml-2">
                      <InfoIcon />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        Reset your stake with a new duration. You'll claim current rewards and start a new staking period.
                      </div>
                    </div>
                  </label>
                  <select
                    value={stakeTime}
                    onChange={(e) => handleStakeTimeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors duration-200"
                  >
                    <option value="">Select duration...</option>
                    {stakeTimeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>

                {stakeTime && (
                  <div className="p-4 bg-dark-700/30 rounded-xl">
                    <p className="text-dark-300 mb-1">Stake Multiplier:</p>
                    <p className="text-xl font-bold text-primary-400">{multiplier}x</p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleResetStake}
                  disabled={isLoading || !stakeTime}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:from-slate-700 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Reset Stake & Claim Rewards'}
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Status Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-8 p-4 rounded-xl border ${
                isSuccess 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <p className="text-center">{message}</p>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/create-stake')}
              className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-8 rounded-xl font-semibold text-lg transition-all duration-300 hover:from-slate-700 hover:to-slate-800 shadow-lg hover:shadow-slate-500/25"
            >
              Create New Stake
            </motion.button>
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 p-6 bg-gradient-to-r from-slate-800/20 to-slate-700/20 border border-slate-500/20 rounded-xl backdrop-blur-sm"
          >
            <h3 className="text-lg font-semibold text-white mb-3">Staking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-dark-300">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium text-white mb-1">Stake PRM Tokens</p>
                  <p>Lock your tokens for a specified period to earn rewards</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium text-white mb-1">Earn Multiplied Rewards</p>
                  <p>Longer stakes earn higher reward multipliers</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium text-white mb-1">Flexible Management</p>
                  <p>Withdraw or reset stakes when the time period completes</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
