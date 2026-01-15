import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { 
  buyPRMTokens, 
  claimPRMTokens, 
  getIcoInfo, 
  getAccountIcoInfo, 
  calculateIcoPrice,
  initProvider 
} from '@/lib/functions'
import { ethers } from 'ethers'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { getParinumNetworkConfig } from '@/lib/parinum'

// Icons (removed dollar/coins icon per request)

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const BookOpenIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

export default function PRMFunding() {
  const router = useRouter()
  
  // Form states
  const [ethAmount, setEthAmount] = useState('')
  const [multiplier, setMultiplier] = useState(1.0)
  const [estimatedPRM, setEstimatedPRM] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // ICO data states
  const [icoInfo, setIcoInfo] = useState({
    poolPRM: '0',
    poolETH: '0',
    deploymentTime: '0',
    timeLimit: '0',
    weightedETHRaised: '0',
    soldAmount: '0'
  })
  
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [accountInfo, setAccountInfo] = useState({
    contribution: '0',
    weightedContribution: '0',
    ethReceived: '0',
    prmWithdrawn: '0'
  })
  
  const [icoEnded, setIcoEnded] = useState(false)
  const [ethPrice, setEthPrice] = useState(0)
  const [isUsdMode, setIsUsdMode] = useState(false)
  const [usdAmountDisplay, setUsdAmountDisplay] = useState('')

  // Fetch ETH/Native Token Price
  useEffect(() => {
    const fetchPrice = async () => {
      const config = getParinumNetworkConfig(chainId)
      let coinId = 'ethereum'
      if (config?.nativeSymbol === 'BNB') coinId = 'binancecoin'
      if (config?.nativeSymbol === 'MATIC') coinId = 'matic-network'

      try {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`)
        const data = await response.json()
        if (data[coinId]?.usd) {
          setEthPrice(data[coinId].usd)
        }
      } catch (error) {
        console.error('Error fetching price:', error)
      }
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 60000)
    return () => clearInterval(interval)
  }, [chainId])

  const toggleUsdMode = () => {
    const newMode = !isUsdMode
    setIsUsdMode(newMode)
    if (newMode && ethPrice) {
      const p = parseFloat(ethAmount)
      setUsdAmountDisplay(!isNaN(p) ? (p * ethPrice).toFixed(2) : '')
    }
  }

  const handleAmountChange = (val: string) => {
    if (isUsdMode) {
      setUsdAmountDisplay(val)
      if (ethPrice && val) {
        const usd = parseFloat(val)
        if (!isNaN(usd)) {
          setEthAmount((usd / ethPrice).toFixed(18).replace(/\.?0+$/, ''))
        } else {
          setEthAmount('')
        }
      } else {
        setEthAmount('')
      }
    } else {
      setEthAmount(val)
    }
  }

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
  const fetchAccountInfo = useCallback(async () => {
    try {
      if (address) {
        const info = await getAccountIcoInfo(address)
        setAccountInfo(info)
      }
    } catch (error) {
      console.error('Error fetching account info:', error)
    }
  }, [address])

  // Calculate estimated PRM tokens (UI label only; backend still returns PRM value)
  useEffect(() => {
    const calculateTokens = async () => {
      if (ethAmount && parseFloat(ethAmount) > 0) {
        const prmAmount = await calculateIcoPrice(ethAmount)
        // Apply multiplier to estimation
        const multiplied = parseFloat(prmAmount) * multiplier
        setEstimatedPRM(multiplied.toString())
      } else {
        setEstimatedPRM('0')
      }
    }
    calculateTokens()
  }, [ethAmount, multiplier])

  // Initial data fetch
  useEffect(() => {
    fetchIcoInfo()
  }, [chainId])

  useEffect(() => {
    fetchAccountInfo()
  }, [fetchAccountInfo, chainId])

  // Handle buy PRM tokens
  const handleBuyTokens = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      setMessage('Please enter a valid ETH amount')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const result = await buyPRMTokens(ethers.ZeroAddress, ethAmount, multiplier)
      
      if (result.success) {
        setMessage(`Successfully purchased PRM tokens! Transaction: ${result.txHash}`)
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

  // Handle claim PRM tokens
  const handleClaimTokens = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const result = await claimPRMTokens()
      
      if (result.success) {
        setMessage(`Successfully claimed PRM tokens! Transaction: ${result.txHash}`)
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
    if (icoInfo.deploymentTime === '0') return { days: 0, hours: 0, text: 'Loading...' }

    const currentTime = Math.floor(Date.now() / 1000)
    const endTime = parseInt(icoInfo.deploymentTime) + parseInt(icoInfo.timeLimit)
    const remaining = endTime - currentTime
    
    if (remaining <= 0) return { days: 0, hours: 0, text: 'ICO Ended' }
    
    const days = Math.floor(remaining / (24 * 60 * 60))
    const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60))
    
    return { days, hours, text: `${days}d ${hours}h` }
  }

  const timeLeft = formatTimeRemaining()

  return (
    <Layout>
      {/* Network Check Popup */}
      {chainId && chainId !== 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-secondary-200 dark:border-dark-700 text-center"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-6">
              <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-3">
              Please change networks to Parinum
            </h3>
            
            <p className="text-secondary-600 dark:text-dark-300 mb-8">
              To participate in the funding, you must be connected to the Ethereum Mainnet.
            </p>
            
            <button
              onClick={() => switchChain?.({ chainId: 1 })}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-primary-500/30"
            >
              Switch Network
            </button>
          </motion.div>
        </div>
      )}
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
            
            <div className="mt-8 flex justify-center">
              <Link href="/how-to-ico">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 font-semibold rounded-xl transition-all duration-300 flex items-center space-x-2 hero-secondary-btn backdrop-blur-sm"
                >
                  <BookOpenIcon />
                  <span>Learn More</span>
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* ICO Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-xl relative group hover:border-slate-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">ETH Raised</h3>
                <div className="text-emerald-500 bg-emerald-100/50 dark:bg-emerald-900/30 p-2 rounded-lg">
                  <TrendingUpIcon />
                </div>
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
                {parseFloat(icoInfo.poolETH).toFixed(2)} <span className="text-lg text-secondary-500 font-normal">ETH</span>
              </p>
              {ethPrice > 0 && (
                <p className="text-xl font-bold text-secondary-900 dark:text-white mt-1">
                  { (parseFloat(icoInfo.poolETH) * ethPrice).toLocaleString(undefined, { maximumFractionDigits: 2 }) } <span className="text-base text-secondary-500 font-normal">USD</span>
                </p>
              )}
              <p className="text-sm text-secondary-600 dark:text-dark-300 mt-2">Total contribution</p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-xl relative group hover:border-slate-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">Time Left</h3>
                <div className="text-blue-500 bg-blue-100/50 dark:bg-blue-900/30 p-2 rounded-lg">
                  <ClockIcon />
                </div>
              </div>
              <div className="flex items-baseline space-x-1 mt-2">
                {typeof timeLeft === 'string' ? (
                  <p className="text-2xl font-bold text-secondary-900 dark:text-white">ICO Ended</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">{timeLeft.days}d</p>
                    <p className="text-xl text-secondary-500 dark:text-dark-300">{timeLeft.hours}h</p>
                  </>
                )}
              </div>
              <p className="text-sm text-secondary-600 dark:text-dark-300 mt-2">
                {icoEnded ? 'Claiming period active' : 'Funding period active'}
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-xl relative group hover:border-slate-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">Token Pool</h3>
                <div className="text-purple-500 bg-purple-100/50 dark:bg-purple-900/30 p-2 rounded-lg">
                  <GiftIcon />
                </div>
              </div>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white mt-2">
                {(40000000).toLocaleString()} <span className="text-lg text-secondary-500 font-normal">PRM</span>
              </p>
              <p className="text-sm text-secondary-600 dark:text-dark-300 mt-2">Available for distribution</p>
            </motion.div>
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
                    <div className="flex justify-between mb-2">
                       <label className="block text-sm font-medium text-secondary-600 dark:text-dark-300">
                         {getParinumNetworkConfig(chainId)?.nativeSymbol || 'ETH'} Amount {isUsdMode && '(USD)'}
                       </label>
                       {ethPrice > 0 && (
                          <button
                            type="button"
                            onClick={toggleUsdMode}
                            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium transition-colors"
                          >
                            {isUsdMode ? `Enter in ${getParinumNetworkConfig(chainId)?.nativeSymbol || 'ETH'}` : 'Enter in USD'}
                          </button>
                       )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={isUsdMode ? usdAmountDisplay : ethAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-slate-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-500/50 transition-all duration-200"
                        placeholder="0.0"
                        required
                      />
                      {ethPrice > 0 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-secondary-400 pointer-events-none">
                          ≈ {isUsdMode 
                              ? `${parseFloat(ethAmount || '0').toFixed(6)} ${getParinumNetworkConfig(chainId)?.nativeSymbol || 'ETH'}`
                              : `$${(parseFloat(ethAmount || '0') * ethPrice).toFixed(2)}`
                            }
                        </div>
                      )}
                    </div>
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
                      <p>PRM withdrawn: <span className="text-white font-semibold">{parseFloat(accountInfo.prmWithdrawn).toFixed(2)} PRM</span></p>
                    </div>
                  </div>

                  <button
                    onClick={handleClaimTokens}
                    disabled={isLoading || parseFloat(accountInfo.contribution) === 0}
                    className="w-full px-6 py-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
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
                    <span className="text-white font-semibold">{parseFloat(accountInfo.prmWithdrawn).toFixed(2)} PRM</span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-slate-500/20">
                    <span className="flex items-center text-dark-300">
                      PRM Now:
                      <div className="group relative flex items-center ml-2">
                        <InfoIcon className="w-4 h-4 text-slate-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl text-xs text-secondary-600 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-justify">
                          The PRM distributed to you will depend on the final weighted contribution to the ICO. For example, if your weighted contribution is 1 ETH and the total weighted contribution to the ICO is 100 ETH, you will receive 1% of the 40M tokens, which is 400k PRM tokens.
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-200 dark:border-t-slate-600"></div>
                        </div>
                      </div>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {(() => {
                        const myWeighted = parseFloat(accountInfo.weightedContribution)
                        const totalWeighted = parseFloat(icoInfo.weightedETHRaised)
                        const prmNow = totalWeighted > 0 ? (40000000 * (myWeighted / totalWeighted)) : 0
                        return prmNow.toLocaleString(undefined, { maximumFractionDigits: 2 })
                      })()} PRM
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="p-6 bg-slate-800/20 border border-slate-500/20 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Important Notes</h3>
                <ul className="space-y-2 text-sm text-dark-300">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                    <span>Early contributors receive optional weighted bonuses</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                    <span>Tokens can be claimed after the funding period ends</span>
                  </li>
                  <li className="pt-1">
                    <Link href="/how-to-ico" className="text-secondary-500 dark:text-slate-400 hover:text-secondary-700 dark:hover:text-slate-200 transition-colors underline decoration-slate-500/50 underline-offset-2">
                      Learn more about vesting terms
                    </Link>
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
