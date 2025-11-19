import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '@/components/Layout'
import PurchaseStepsNavigation from '@/components/PurchaseStepsNavigation'
import { useRouter } from 'next/router'
import { createPurchase } from '@/lib/functions'
import Image, { type StaticImageData } from 'next/image'
import EthIcon from 'cryptocurrency-icons/svg/white/eth.svg'
import DaiIcon from 'cryptocurrency-icons/svg/white/dai.svg'
import WbtcIcon from 'cryptocurrency-icons/svg/white/wbtc.svg'
import UsdcIcon from 'cryptocurrency-icons/svg/white/usdc.svg'

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

export default function CreatePurchase() {
  const [seller, setSeller] = useState('')
  const [price, setPrice] = useState('')
  const [collateral, setCollateral] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [message, setMessage] = useState('Create Purchase for ID')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState('Select Token')
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const tokens: Token[] = [
    { symbol: 'ETH', address: '0', icon: EthIcon },
    { symbol: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f', icon: DaiIcon },
    { symbol: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', icon: WbtcIcon },
    { symbol: 'USDC', address: '0xa0b86a33e6441f8c4c3cd6c96af9d2d1b52d9485', icon: UsdcIcon },
  ]

  const purchaseSteps = [
    { id: 'create', label: 'Create', active: true },
    { id: 'abort', label: 'Abort', active: false },
    { id: 'confirm', label: 'Confirm', active: false },
    { id: 'release', label: 'Release', active: false },
    { id: 'logs', label: 'Logs', active: false },
  ]

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
    
    try {
      const result = await createPurchase(seller, price, collateral, tokenAddress)
      if (result.success) {
        setMessage(`Purchase ID: ${result.purchaseId}`)
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
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Create Secure Purchase
            </h1>
            <p className="text-dark-300">
              Set up a secure escrow transaction with built-in buyer protection
            </p>
          </div>

          {/* Transaction Steps */}
          <PurchaseStepsNavigation steps={purchaseSteps} />

          {/* Main Form */}
          <div className="bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seller Address */}
              <div className="space-y-3">
                <label className="flex items-center text-white font-medium">
                  Seller Address
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      The seller address is the Ethereum address of the seller. It is used to identify the recipient of the funds in the transaction.
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  placeholder="0x1234567890abcdef1234567890abcdef12345678"
                  className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 font-mono text-sm"
                  required
                />
              </div>

              {/* Token Selection */}
              <div className="space-y-3">
                <label className="flex items-center text-white font-medium">
                  Token
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      The ERC20 token address is the unique identifier for the token contract on the Ethereum blockchain.
                    </div>
                  </div>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 flex items-center justify-between"
                  >
                    <span>{selectedToken}</span>
                    <ChevronDownIcon />
                  </button>
                  
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scaleY: 0, transformOrigin: "top" }}
                        animate={{ opacity: 1, scaleY: 1, transformOrigin: "top" }}
                        exit={{ opacity: 0, scaleY: 0, transformOrigin: "top" }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-primary-500/30 rounded-xl shadow-xl z-20 overflow-hidden"
                      >
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          type="button"
                          onClick={() => selectToken(token)}
                          className="w-full px-4 py-3 text-left hover:bg-dark-700/50 transition-colors duration-200 flex items-center space-x-3"
                        >
                          <Image src={token.icon} alt={`${token.symbol} icon`} width={20} height={20} />
                          <span className="text-white">{token.symbol}</span>
                        </button>
                      ))}
                      <div className="p-3 border-t border-primary-500/20">
                        <input
                          type="text"
                          placeholder="Custom ERC20 token address"
                          onChange={(e) => {
                            const value = e.target.value
                            setTokenAddress(value)
                            setSelectedToken(value ? value.slice(0, 10) + '...' : 'Select Token')
                          }}
                          className="w-full px-3 py-2 bg-dark-700/50 border border-primary-500/30 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
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
                  <label className="flex items-center text-white font-medium">
                    Price
                    <div className="group relative ml-2">
                      <InfoIcon />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
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
                    className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center text-white font-medium">
                    Collateral
                    <div className="group relative ml-2">
                      <InfoIcon />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
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
                    className="w-full px-4 py-3 bg-dark-700/50 border border-primary-500/30 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              {/* Purchase ID Display */}
              <div className="space-y-3">
                <label className="flex items-center text-white font-medium">
                  Purchase ID
                  <div className="group relative ml-2">
                    <InfoIcon />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      The Purchase ID is a unique identifier generated when a purchase is created. It represents the smart contract address for this specific transaction.
                    </div>
                  </div>
                </label>
                <div className="px-4 py-3 bg-dark-700/30 border border-primary-500/20 rounded-xl">
                  <p className="text-dark-300 font-mono text-sm break-all">{message}</p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Purchase...</span>
                  </>
                ) : (
                  <span>Create Purchase</span>
                )}
              </button>
            </form>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-slate-800/20 to-slate-700/20 border border-slate-500/20 rounded-xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-dark-300">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium text-white mb-1">Create Purchase</p>
                  <p>Set up the transaction details and generate a unique purchase ID</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-secondary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium text-white mb-1">Seller Confirms</p>
                  <p>Seller locks collateral and confirms they can fulfill the order</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium text-white mb-1">Safe Exchange</p>
                  <p>Funds are held in escrow until buyer confirms receipt</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
