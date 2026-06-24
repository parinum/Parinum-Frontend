import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { CreatePurchaseView } from '@/components/PurchaseFlowViews'
import { createPurchase } from '@/lib/functions'
import { getParinumNetworkConfig } from '@/lib/parinum'
import type { StaticImageData } from 'next/image'
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

const COINGECKO_IDS: Record<string, string> = {
  'ETH': 'ethereum',
  'WETH': 'weth',
  'BTC': 'bitcoin',
  'WBTC': 'wrapped-bitcoin',
  'USDC': 'usd-coin',
  'USDC.e': 'usd-coin',
  'USDT': 'tether',
  'DAI': 'dai',
  'BNB': 'binancecoin',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
}

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
  const [priceUsd, setPriceUsd] = useState('')
  const [collateralUsd, setCollateralUsd] = useState('')
  const [tokenPrice, setTokenPrice] = useState<number | null>(null)
  
  const [priceInputMode, setPriceInputMode] = useState<'TOKEN' | 'USD'>('TOKEN')
  const [collateralInputMode, setCollateralInputMode] = useState<'TOKEN' | 'USD'>('TOKEN')

  useEffect(() => {
    const fetchPrice = async () => {
      const geckoId = COINGECKO_IDS[selectedToken] || COINGECKO_IDS[selectedToken.replace('.e', '')]
      if (geckoId) {
        try {
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`)
          const data = await res.json()
          if (data[geckoId]?.usd) {
            setTokenPrice(data[geckoId].usd)
          }
        } catch (error) {
          console.error('Error fetching price:', error)
          setTokenPrice(null)
        }
      } else {
        setTokenPrice(null)
      }
    }
    fetchPrice()
  }, [selectedToken])

  useEffect(() => {
    if (tokenPrice) {
      if (price) {
        const val = parseFloat(price)
        if (!isNaN(val)) setPriceUsd((val * tokenPrice).toFixed(2))
      }
      if (collateral) {
        const val = parseFloat(collateral)
        if (!isNaN(val)) setCollateralUsd((val * tokenPrice).toFixed(2))
      }
    }
  }, [collateral, price, tokenPrice])

  const handlePriceChange = (val: string) => {
    if (priceInputMode === 'TOKEN') {
      setPrice(val)
      if (val === '') {
        setPriceUsd('')
        return
      }
      if (tokenPrice) {
        const p = parseFloat(val)
        if (!isNaN(p)) {
          setPriceUsd((p * tokenPrice).toFixed(2))
        }
      }
    } else {
      setPriceUsd(val)
      if (val === '') {
        setPrice('')
        return
      }
      if (tokenPrice && tokenPrice > 0) {
        const p = parseFloat(val)
        if (!isNaN(p)) {
          const tokenAmount = p / tokenPrice
          setPrice(tokenAmount > 1 ? tokenAmount.toFixed(4) : tokenAmount.toFixed(8))
        }
      }
    }
  }

  const handleCollateralChange = (val: string) => {
    if (collateralInputMode === 'TOKEN') {
      setCollateral(val)
      if (val === '') {
        setCollateralUsd('')
        return
      }
      if (tokenPrice) {
        const p = parseFloat(val)
        if (!isNaN(p)) {
          setCollateralUsd((p * tokenPrice).toFixed(2))
        }
      }
    } else {
      setCollateralUsd(val)
      if (val === '') {
        setCollateral('')
        return
      }
      if (tokenPrice && tokenPrice > 0) {
        const p = parseFloat(val)
        if (!isNaN(p)) {
          const tokenAmount = p / tokenPrice
          setCollateral(tokenAmount > 1 ? tokenAmount.toFixed(4) : tokenAmount.toFixed(8))
        }
      }
    }
  }

  const togglePriceMode = () => {
    setPriceInputMode(prev => prev === 'TOKEN' ? 'USD' : 'TOKEN')
  }

  const toggleCollateralMode = () => {
    setCollateralInputMode(prev => prev === 'TOKEN' ? 'USD' : 'TOKEN')
  }

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
        // Reset the form so the user can't accidentally re-submit the same escrow
        setSeller('')
        setPrice('')
        setCollateral('')
        setPriceUsd('')
        setCollateralUsd('')
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
          <CreatePurchaseView
            purchaseSteps={purchaseSteps}
            seller={seller}
            onSellerChange={setSeller}
            selectedToken={selectedToken}
            selectedTokenIcon={selectedTokenObj?.icon}
            tokens={tokens}
            dropdownRef={dropdownRef}
            isDropdownOpen={isDropdownOpen}
            onToggleDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
            onSelectToken={selectToken}
            onCustomTokenChange={(value) => {
              setTokenAddress(value)
              setSelectedToken(value ? value.slice(0, 10) + '...' : 'Select Token')
            }}
            price={price}
            priceUsd={priceUsd}
            collateral={collateral}
            collateralUsd={collateralUsd}
            priceInputMode={priceInputMode}
            collateralInputMode={collateralInputMode}
            onPriceChange={handlePriceChange}
            onCollateralChange={handleCollateralChange}
            onTogglePriceMode={togglePriceMode}
            onToggleCollateralMode={toggleCollateralMode}
            tokenPrice={tokenPrice}
            message={message}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            headerAction={
              <Link
                href="/how-to-purchase?step=create"
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-500/15 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              >
                <InfoIcon />
                <span>Open walkthrough</span>
              </Link>
            }
          />
        </div>
      </motion.div>
    </Layout>
  )
}
