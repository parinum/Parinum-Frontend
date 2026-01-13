import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import { 
  buyPSCTokens, 
  claimPSCTokens, 
  getIcoInfo, 
  getAccountIcoInfo, 
  calculateIcoPrice,
  initProvider 
} from '@/lib/functions'
import { ethers } from 'ethers'

// Icons (removed dollar/coins icon per request)

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const TrendingUpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const GiftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
)

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-6 h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function PSCFunding() {
  const router = useRouter()
  
  // Form states
  const [ethAmount, setEthAmount] = useState('')
  const [multiplier, setMultiplier] = useState(1.0)
  const [estimatedPSC, setEstimatedPSC] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // ICO data states
  const [icoInfo, setIcoInfo] = useState({
    poolPSC: '0',
    poolETH: '0',
    deploymentTime: '0',
    timeLimit: '0',
    weightedETHRaised: '0',
    soldAmount: '0'
  })
  
  const [accountInfo, setAccountInfo] = useState({
    contribution: '0',
    weightedContribution: '0',
    ethReceived: '0',
    pscWithdrawn: '0'
  })
  
  const [userAccount, setUserAccount] = useState('')
  const [icoEnded, setIcoEnded] = useState(false)

  // Fetch ICO information
  const fetchIcoInfo = async () => {
    try {
      const info = await getIcoInfo()
      setIcoInfo(info)
      
      // Check if ICO has ended
      const currentTime = Math.floor(Date.now() / 1000)
      const endTime = parseInt(info.deploymentTime) + parseInt(info.timeLimit)
      setIcoEnded(currentTime > endTime)
    } catch (error) {
      console.error('Error fetching ICO info:', error)
    }
  }

  // Fetch account information
  const fetchAccountInfo = async () => {
    try {
      const { account } = await initProvider()
      setUserAccount(account)
      
      if (account) {
        const info = await getAccountIcoInfo(account)
        setAccountInfo(info)
      }
    } catch (error) {
      console.error('Error fetching account info:', error)
    }
  }

  // Calculate estimated PRM tokens (UI label only; backend still returns PSC value)
  useEffect(() => {
    const calculateTokens = async () => {
      if (ethAmount && parseFloat(ethAmount) > 0) {
        const pscAmount = await calculateIcoPrice(ethAmount)
        // Apply multiplier to estimation
        const multiplied = parseFloat(pscAmount) * multiplier
        setEstimatedPSC(multiplied.toString())
      } else {
        setEstimatedPSC('0')
      }
    }
    calculateTokens()
  }, [ethAmount, multiplier])

  // Initial data fetch
  useEffect(() => {
    fetchIcoInfo()
    fetchAccountInfo()
  }, [])

  // Handle buy PSC tokens
  const handleBuyTokens = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setMessage('Please enter a valid ETH amount')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const result = await buyPSCTokens(ethers.ZeroAddress, ethAmount)
      
      if (result.success) {
        setMessage(`Successfully purchased PSC tokens! Transaction: ${result.txHash}`)
        setEthAmount('')
        // Refresh data
        fetchIcoInfo()
        fetchAccountInfo()
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle claim PSC tokens
  const handleClaimTokens = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const result = await claimPSCTokens()
      
      if (result.success) {
        setMessage(`Successfully claimed PSC tokens! Transaction: ${result.txHash}`)
        fetchAccountInfo()
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate progress percentage
  const progressPercentage = icoInfo.poolETH !== '0' 
    ? Math.min((parseFloat(icoInfo.weightedETHRaised) / parseFloat(icoInfo.poolETH)) * 100, 100) 
    : 0

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!icoInfo.deploymentTime || !icoInfo.timeLimit) return 'Loading...'
    
    const currentTime = Math.floor(Date.now() / 1000)
    const endTime = parseInt(icoInfo.deploymentTime) + parseInt(icoInfo.timeLimit)
    const remaining = endTime - currentTime
    
    if (remaining <= 0) return 'ICO Ended'
    
    const days = Math.floor(remaining / (24 * 60 * 60))
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60))
    
    return `${days}d ${hours}h remaining`
  }

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            {/* Removed header icon per request */}
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              PRM Token Funding
            </h1>
            <p className="text-xl text-secondary-600 dark:text-dark-300 max-w-3xl mx-auto">
              Participate in the PRM Initial Coin Offering and help build the future of decentralized payments
            </p>
          </motion.div>

          {/* ICO Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="p-6 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-xl">
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">ETH Raised</h3>
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {parseFloat(icoInfo.weightedETHRaised).toFixed(2)} ETH
              </p>
              <p className="text-sm text-secondary-600 dark:text-dark-300 mt-1">Total contribution</p>
            </div>

            <div className="p-6 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-xl">
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">Time Left</h3>
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatTimeRemaining()}</p>
              <p className="text-sm text-secondary-600 dark:text-dark-300 mt-1">
                {icoEnded ? 'Claiming period active' : 'Funding period active'}
              </p>
            </div>

            <div className="p-6 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-xl">
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">Token Pool</h3>
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                40,000,000 PRM
              </p>
              <p className="text-sm text-secondary-600 dark:text-dark-300 mt-1">Available for distribution</p>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buy Tokens Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="p-8 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-2xl"
            >
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6">
                {icoEnded ? 'ICO Ended - Claim Your Tokens' : 'Buy PRM Tokens'}
              </h2>

              {!icoEnded ? (
                <form onSubmit={handleBuyTokens} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 dark:text-dark-300 mb-2">
                      ETH Amount
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={ethAmount}
                      onChange={(e) => setEthAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-slate-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-200"
                      placeholder="0.0"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                       <label className="flex items-center text-sm font-medium text-secondary-600 dark:text-dark-300">
                        Multiplier
                        <div className="group relative flex items-center ml-2">
                          <InfoIcon className="w-4 h-4 text-slate-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl text-xs text-secondary-600 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-justify">
                            Early contributors can choose to use a multiplier which increases their weighted contribution in exchange for a longer lock-up period (linear relationship). A 1x multiplier will have no lockup period, whereas a 1.8x multiplier will have a 144 day lock up period.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-200 dark:border-t-slate-600"></div>
                          </div>
                        </div>
                      </label>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1"
                        max="1.8"
                        step="0.1"
                        value={multiplier}
                        onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                        className="w-full cursor-pointer accent-slate-500"
                      />
                       <input
                        type="number"
                        min="1"
                        max="1.8"
                        step="0.1"
                        value={multiplier}
                        onChange={(e) => {
                          let val = parseFloat(e.target.value);
                          if(isNaN(val)) val = 1;
                          if (val > 1.8) val = 1.8;
                          if (val < 1) val = 1;
                          setMultiplier(val);
                        }}
                        className="w-20 px-3 py-2 bg-slate-100 dark:bg-dark-700/50 border border-slate-500/30 rounded-xl text-secondary-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-slate-500/50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !ethAmount}
                    className="w-full px-6 py-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Buy PRM Tokens</span>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-800/20 border border-slate-500/20 rounded-xl">
                    <p className="text-dark-300 mb-4">
                      The ICO funding period has ended. You can now claim your PRM tokens based on your contribution.
                    </p>
                    <div className="text-sm space-y-1">
                      <p>Your contribution: <span className="text-white font-semibold">{parseFloat(accountInfo.contribution).toFixed(4)} ETH</span></p>
                      <p>Weighted contribution: <span className="text-white font-semibold">{parseFloat(accountInfo.weightedContribution).toFixed(4)} ETH</span></p>
                      <p>PRM withdrawn: <span className="text-white font-semibold">{parseFloat(accountInfo.pscWithdrawn).toFixed(2)} PRM</span></p>
                    </div>
                  </div>

                  <button
                    onClick={handleClaimTokens}
                    disabled={isLoading || parseFloat(accountInfo.contribution) === 0}
                    className="w-full px-6 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Claiming...</span>
                      </>
                    ) : (
                      <>
                        <GiftIcon />
                        <span>Claim PRM Tokens</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>

            {/* Information Panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              {/* Your Participation */}
              <div className="p-6 bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Your Participation</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-300">Connected Account:</span>
                    <span className="text-white font-mono text-xs">
                      {userAccount ? `${userAccount.slice(0, 6)}...${userAccount.slice(-4)}` : 'Not connected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">Your Contribution:</span>
                    <span className="text-white font-semibold">{parseFloat(accountInfo.contribution).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">Weighted Contribution:</span>
                    <span className="text-white font-semibold">{parseFloat(accountInfo.weightedContribution).toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">PRM Claimed:</span>
                    <span className="text-white font-semibold">{parseFloat(accountInfo.pscWithdrawn).toFixed(2)} PRM</span>
                  </div>
                </div>
              </div>

              {/* ICO Information */}
              <div className="p-6 bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">ICO Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-300">ETH Target:</span>
                    <span className="text-white font-semibold">{parseFloat(icoInfo.poolETH).toFixed(0)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-300">ETH Raised:</span>
                    <span className="text-white font-semibold">{parseFloat(icoInfo.weightedETHRaised).toFixed(2)} ETH</span>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="p-6 bg-slate-800/20 border border-slate-500/20 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Important Notes</h3>
                <ul className="space-y-2 text-sm text-dark-300">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                    <span>Early contributors receive weighted bonuses</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                    <span>Tokens can be claimed after the funding period ends</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                    <span>Vesting schedule will be linear over one year</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Status Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 bg-slate-800/20 border border-slate-500/20 rounded-xl backdrop-blur-sm"
            >
              <p className="text-slate-400 font-mono text-sm break-all">{message}</p>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  )
}
