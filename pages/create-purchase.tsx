import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '@/components/Layout'
import PurchaseStepsNavigation from '@/components/PurchaseStepsNavigation'
import { createPurchase } from '@/lib/functions'
import { getParinumNetworkConfig } from '@/lib/parinum'
import Image, { type StaticImageData } from 'next/image'
import { ethers } from 'ethers'
import { useChainId } from 'wagmi'
import EthIcon from 'cryptocurrency-icons/svg/color/eth.svg'
import DaiIcon from 'cryptocurrency-icons/svg/color/dai.svg'
import WbtcIcon from 'cryptocurrency-icons/svg/color/wbtc.svg'
import UsdcIcon from 'cryptocurrency-icons/svg/color/usdc.svg'
import UsdtIcon from 'cryptocurrency-icons/svg/color/usdt.svg'
import BnbIcon from 'cryptocurrency-icons/svg/color/bnb.svg'
import MaticIcon from 'cryptocurrency-icons/svg/color/matic.svg'
import GenericIcon from 'cryptocurrency-icons/svg/color/generic.svg'

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

interface Token {
  symbol: string
  address: string
  icon: StaticImageData
}

// Token configurations
const ethTokens = [
  { symbol: 'ETH', address: ethers.ZeroAddress, icon: EthIcon },
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', icon: UsdcIcon },
  { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', icon: UsdtIcon },
  { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', icon: DaiIcon },
  { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', icon: WbtcIcon },
]
const bscTokens = [
  { symbol: 'BNB', address: ethers.ZeroAddress, icon: BnbIcon },
  { symbol: 'USDC', address: '0x8AC76A51CC950D9822D68B83FE1AD97B32CD580D', icon: UsdcIcon },
  { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', icon: UsdtIcon },
]
const arbTokens = [
  { symbol: 'ETH', address: ethers.ZeroAddress, icon: EthIcon },
  { symbol: 'USDC', address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831', icon: UsdcIcon },
  { symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', icon: UsdtIcon },
]
const baseTokens = [
  { symbol: 'ETH', address: ethers.ZeroAddress, icon: EthIcon },
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bDa02913', icon: UsdcIcon },
  { symbol: 'USDT', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', icon: UsdtIcon },
]
const polygonTokens = [
  { symbol: 'MATIC', address: ethers.ZeroAddress, icon: MaticIcon },
  { symbol: 'USDC.e', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', icon: UsdcIcon },
  { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', icon: UsdtIcon },
]
const lineaTokens = [
  { symbol: 'ETH', address: ethers.ZeroAddress, icon: EthIcon },
  { symbol: 'USDC', address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', icon: UsdcIcon },
  { symbol: 'USDT', address: '0xA219C472f336153807D306158287110C7291B74C', icon: UsdtIcon },
]
const optimismTokens = [
  { symbol: 'ETH', address: ethers.ZeroAddress, icon: EthIcon },
  { symbol: 'USDC', address: '0x0b2c639c533813f4aa9d7837caf62653d097ff85', icon: UsdcIcon },
  { symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce98778', icon: UsdtIcon },
]
const unichainTokens = [
  { symbol: 'ETH', address: ethers.ZeroAddress, icon: EthIcon },
  { symbol: 'USDC', address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6', icon: UsdcIcon },
  { symbol: 'USDT', address: ethers.ZeroAddress, icon: UsdtIcon }, // Placeholder for Unichain
]

const tokenOptionsByChain: Record<number, Token[]> = {
  1: ethTokens,
  31337: ethTokens, // Local Ethereum
  56: bscTokens,
  31338: bscTokens, // Local BSC
  42161: arbTokens,
  31339: arbTokens, // Local Arbitrum
  8453: baseTokens,
  31340: baseTokens, // Local Base
  137: polygonTokens,
  31341: polygonTokens, // Local Polygon
  59144: lineaTokens,
  31344: lineaTokens, // Local Linea
  10: optimismTokens,
  31345: optimismTokens, // Local Optimism
  130: unichainTokens,
  31346: unichainTokens, // Local Unichain
}

const getTokensForChain = (chainId: number) =>
  tokenOptionsByChain[chainId] || tokenOptionsByChain[1]

export default function CreatePurchase() {
  const chainId = useChainId()
  const [seller, setSeller] = useState('')
  const [price, setPrice] = useState('')
  const [collateral, setCollateral] = useState('')
  const defaultTokens = getTokensForChain(chainId)
  const [tokens, setTokens] = useState<Token[]>(defaultTokens)
  const [tokenAddress, setTokenAddress] = useState(
    defaultTokens[0]?.address || ethers.ZeroAddress
  )
  const [message, setMessage] = useState('Purchase ID will appear here')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState(
    defaultTokens[0]?.symbol || 'Select Token'
  )
  const [isLoading, setIsLoading] = useState(false)
  const [networkName, setNetworkName] = useState(
    getParinumNetworkConfig(chainId)?.name || 'Ethereum'
  )

  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Find the currently selected token object to display its icon
  const selectedTokenObj = tokens.find(t => t.symbol === selectedToken) || 
    (tokenAddress !== ethers.ZeroAddress ? tokens.find(t => t.address === tokenAddress) : tokens[0])

  const purchaseSteps = [
    { id: 'create', label: 'Create', active: true },
    { id: 'abort', label: 'Abort', active: false },
    { id: 'confirm', label: 'Confirm', active: false },
    { id: 'release', label: 'Release', active: false },
    { id: 'logs', label: 'Logs', active: false },
  ]

  useEffect(() => {
    const config = getParinumNetworkConfig(chainId)
    setNetworkName(config?.name || 'Unsupported network')

    const chainTokens = getTokensForChain(chainId)
    setTokens(chainTokens)
    if (chainTokens.length) {
      setSelectedToken(chainTokens[0].symbol)
      setTokenAddress(chainTokens[0].address)
    } else {
      setSelectedToken('Select Token')
      setTokenAddress(ethers.ZeroAddress)
    }
  }, [chainId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    try {
      const result = await createPurchase(seller, price, collateral, tokenAddress)
      if (result.success) {
        setMessage(
          `Purchase ID: ${result.purchaseId}${
            result.txHash ? ` (tx: ${result.txHash})` : ''
          }`
        )
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const selectToken = (token: Token) => {
    setTokenAddress(token.address)
    setSelectedToken(token.symbol)
    setIsDropdownOpen(false)
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
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Create Secure Purchase
            </h1>
          </div>

          {/* Transaction Steps */}
          <PurchaseStepsNavigation steps={purchaseSteps} />

          {/* Main Form */}
          <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seller Address */}
              <div className="space-y-3">
                <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                  Wallet ID
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-secondary-800 dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-200 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      The seller address is the Ethereum address of the seller. It is used to identify the recipient of the funds in the transaction.
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  placeholder="0x1234567890abcdef1234567890abcdef12345678"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 font-mono text-sm"
                  required
                />
              </div>

              {/* Token Selection */}
              <div className="space-y-3">
                <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                  Token
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-secondary-800 dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-200 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      The ERC20 token address is the unique identifier for the token contract on the Ethereum blockchain.
                    </div>
                  </div>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                       {selectedTokenObj && (
                        <Image 
                          src={selectedTokenObj.icon} 
                          alt={`${selectedTokenObj.symbol} icon`} 
                          width={24} 
                          height={24} 
                        />
                       )}
                       <span className="font-medium">{selectedToken}</span>
                    </div>
                    <ChevronDownIcon />
                  </button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scaleY: 0, transformOrigin: "top" }}
                        animate={{ opacity: 1, scaleY: 1, transformOrigin: "top" }}
                        exit={{ opacity: 0, scaleY: 0, transformOrigin: "top" }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-800 border border-primary-500/30 rounded-xl shadow-xl z-20 overflow-hidden"
                      >
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          type="button"
                          onClick={() => selectToken(token)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-dark-700/50 transition-colors duration-200 flex items-center space-x-3"
                        >
                          <Image src={token.icon} alt={`${token.symbol} icon`} width={20} height={20} />
                          <span className="text-secondary-900 dark:text-white">{token.symbol}</span>
                        </button>
                      ))}
                      <div className="p-3 border-t border-secondary-200 dark:border-primary-500/20">
                        <input
                          type="text"
                          placeholder="Custom ERC20 token address"
                          onChange={(e) => {
                            const value = e.target.value
                            setTokenAddress(value)
                            setSelectedToken(value ? value.slice(0, 10) + '...' : 'Select Token')
                          }}
                          className="w-full px-3 py-2 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-lg text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
                        />
                      </div>
                    </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Price and Collateral */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                    Price
                    <div className="group relative ml-2">
                      <InfoIcon />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        The price is the amount at which the product is sold.
                      </div>
                    </div>
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.001"
                    min="0"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                    Collateral
                    <div className="group relative ml-2">
                      <InfoIcon />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                        The collateral is the amount locked up to ensure a safe transaction.
                      </div>
                    </div>
                  </label>
                  <input
                    type="number"
                    value={collateral}
                    onChange={(e) => setCollateral(e.target.value)}
                    placeholder="0.00"
                    step="0.001"
                    min="0"
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Purchase ID Display */}
              <div className="space-y-3">
                <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                  Purchase ID
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      The Purchase ID is a unique identifier generated when a purchase is created. It represents the smart contract address for this specific transaction.
                    </div>
                  </div>
                </label>
                <div className="px-4 py-3 bg-slate-100 dark:bg-dark-700/30 border border-primary-500/20 rounded-xl">
                  <p className="text-secondary-600 dark:text-dark-300 font-mono text-sm break-all">{message}</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !seller || !price || !collateral}
                className="w-full px-6 py-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-800/30 dark:border-white/30 border-t-slate-800 dark:border-t-white rounded-full animate-spin" />
                    <span>Creating Purchase...</span>
                  </>
                ) : (
                  <span>Create Purchase</span>
                )}
              </button>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-2xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-secondary-600 dark:text-dark-300">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white mb-1">Create Purchase</p>
                  <p>Set up the transaction details and generate a unique purchase ID</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white mb-1">Seller Confirms</p>
                  <p>Seller locks collateral and confirms they can fulfill the order</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium text-secondary-900 dark:text-white mb-1">Safe Exchange</p>
                  <p>Exchange happens securely with no risk to either party</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}
