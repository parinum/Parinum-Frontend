import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useRouter } from 'next/router'
import { 
  getStakeInfo, 
  getStakeInfoByIndex,
  claimRewardsandWithdrawStake,
  claimRewardsandResetStake,
  calculateStakeMultiplier 
} from '@/lib/functions'

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const UnlockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
)

interface MockStake {
  id: number
  amount: string
  stakeTime: number
  startTime: number
  multiplier: string
  rewards: string
  isAvailable: boolean
  timeRemaining: number
}

export default function StakeDashboard() {
  const [stakes, setStakes] = useState<MockStake[]>([])
  const [totalStake, setTotalStake] = useState('0')
  const [totalReward, setTotalReward] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchStakeData()
  }, [])

  const fetchStakeData = async () => {
    try {
      const { totalAmount, totalRewardAmount } = await getStakeInfo()
      setTotalStake(totalAmount)
      setTotalReward(totalRewardAmount)

      // Mock multiple stakes for demonstration
      const mockStakes: MockStake[] = [
        {
          id: 1,
          amount: '50.0',
          stakeTime: 2592000, // 30 days
          startTime: Date.now() - (25 * 24 * 60 * 60 * 1000), // 25 days ago
          multiplier: '1.05',
          rewards: '2.5',
          isAvailable: false,
          timeRemaining: 5 * 24 * 60 * 60 * 1000 // 5 days remaining
        },
        {
          id: 2,
          amount: '100.0',
          stakeTime: 7776000, // 90 days
          startTime: Date.now() - (95 * 24 * 60 * 60 * 1000), // 95 days ago
          multiplier: '1.15',
          rewards: '15.0',
          isAvailable: true,
          timeRemaining: 0
        },
        {
          id: 3,
          amount: '25.0',
          stakeTime: 604800, // 7 days
          startTime: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
          multiplier: '1.02',
          rewards: '0.5',
          isAvailable: false,
          timeRemaining: 5 * 24 * 60 * 60 * 1000 // 5 days remaining
        }
      ]
      setStakes(mockStakes)
    } catch (error) {
      console.error('Error fetching stake data:', error)
    }
  }

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'Available'
    
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000))
    const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h`
    return 'Soon'
  }

  const getStakeDurationLabel = (seconds: number): string => {
    const days = seconds / 86400
    if (days >= 365) return `${Math.round(days / 365)} year(s)`
    if (days >= 30) return `${Math.round(days / 30)} month(s)`
    if (days >= 7) return `${Math.round(days / 7)} week(s)`
    return `${Math.round(days)} day(s)`
  }

  const handleWithdrawStake = async (stakeId: number) => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const result = await claimRewardsandWithdrawStake()
      if (result.success) {
        setMessage(`Successfully withdrew stake #${stakeId} and claimed rewards!`)
        setIsSuccess(true)
        await fetchStakeData()
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Stake Management
            </h1>
            <p className="text-dark-300">
              Manage your existing stakes and track rewards
            </p>
          </motion.div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <LockIcon />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{stakes.length}</p>
                  <p className="text-sm text-dark-400">Active Stakes</p>
                </div>
              </div>
              <h3 className="text-dark-300 font-medium">Total Positions</h3>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <TrendingUpIcon />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{totalStake}</p>
                  <p className="text-sm text-dark-400">PRM</p>
                </div>
              </div>
              <h3 className="text-dark-300 font-medium">Total Staked</h3>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <TrendingUpIcon />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{totalReward}</p>
                  <p className="text-sm text-dark-400">PRM</p>
                </div>
              </div>
              <h3 className="text-dark-300 font-medium">Total Rewards</h3>
            </div>
          </motion.div>

          {/* Stakes List */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Stakes</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/create-stake')}
                className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-2 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-slate-700 hover:to-slate-800"
              >
                New Stake
              </motion.button>
            </div>

            {stakes.length === 0 ? (
              <div className="text-center py-12">
                <LockIcon />
                <h3 className="text-xl font-semibold text-white mt-4 mb-2">No Active Stakes</h3>
                <p className="text-dark-300 mb-6">Create your first stake to start earning rewards</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/create-stake')}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 hover:from-slate-700 hover:to-slate-800"
                >
                  Create First Stake
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                {stakes.map((stake) => (
                  <motion.div
                    key={stake.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: stake.id * 0.1 }}
                    className="bg-dark-700/30 border border-dark-600 rounded-xl p-6 hover:border-primary-500/30 transition-colors duration-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      {/* Stake Info */}
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${stake.isAvailable ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                            {stake.isAvailable ? <UnlockIcon /> : <LockIcon />}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">Stake #{stake.id}</h3>
                            <p className="text-sm text-dark-400">{stake.amount} PRM</p>
                          </div>
                        </div>
                      </div>

                      {/* Duration & Multiplier */}
                      <div className="text-center">
                        <p className="text-white font-medium">{getStakeDurationLabel(stake.stakeTime)}</p>
                        <p className="text-sm text-dark-400">{stake.multiplier}x multiplier</p>
                      </div>

                      {/* Rewards */}
                      <div className="text-center">
                        <p className="text-green-400 font-bold">{stake.rewards} PRM</p>
                        <p className="text-sm text-dark-400">Rewards</p>
                      </div>

                      {/* Time Remaining */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <ClockIcon />
                          <span className={`font-medium ${stake.isAvailable ? 'text-green-400' : 'text-yellow-400'}`}>
                            {formatTimeRemaining(stake.timeRemaining)}
                          </span>
                        </div>
                        <p className="text-sm text-dark-400">
                          {stake.isAvailable ? 'Ready' : 'Remaining'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleWithdrawStake(stake.id)}
                          disabled={!stake.isAvailable || isLoading}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            stake.isAvailable 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                              : 'bg-dark-600/50 text-dark-400 border border-dark-600 cursor-not-allowed'
                          }`}
                        >
                          {stake.isAvailable ? 'Withdraw' : 'Locked'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Status Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl border ${
                isSuccess 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}
            >
              <p className="text-center">{message}</p>
            </motion.div>
          )}

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 text-center space-x-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/withdraw-dividend')}
              className="bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-300 hover:from-slate-700 hover:to-slate-800"
            >
              Staking Dashboard
            </motion.button>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
