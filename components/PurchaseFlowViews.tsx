import type { ReactNode, RefObject } from 'react'
import Image, { type StaticImageData } from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import PurchaseStepsNavigation from '@/components/PurchaseStepsNavigation'
import PurchaseDetailsCard from '@/components/PurchaseDetailsCard'
import type { PurchaseDetails } from '@/lib/functions'

export interface PurchaseToken {
  symbol: string
  address: string
  icon: StaticImageData
}

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

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

type PurchaseStep = {
  id: string
  label: string
  active: boolean
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function guideRing(_active?: boolean) {
  return ''
}

function guideTargetProps(targetId: string, tutorialMode?: boolean, anchor: 'center-right' | 'top-right' = 'center-right') {
  return tutorialMode
    ? {
        'data-guide-target': targetId,
        'data-guide-anchor': anchor,
      }
    : {}
}

interface CreatePurchaseViewProps {
  purchaseSteps: PurchaseStep[]
  seller: string
  onSellerChange: (value: string) => void
  selectedToken: string
  selectedTokenIcon?: StaticImageData
  tokens: PurchaseToken[]
  dropdownRef: RefObject<HTMLDivElement>
  isDropdownOpen: boolean
  onToggleDropdown: () => void
  onSelectToken: (token: PurchaseToken) => void
  onCustomTokenChange: (value: string) => void
  price: string
  priceUsd: string
  collateral: string
  collateralUsd: string
  priceInputMode: 'TOKEN' | 'USD'
  collateralInputMode: 'TOKEN' | 'USD'
  onPriceChange: (value: string) => void
  onCollateralChange: (value: string) => void
  onTogglePriceMode: () => void
  onToggleCollateralMode: () => void
  tokenPrice: number | null
  message: string
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  headerAction?: ReactNode
  tutorialTarget?: string
  tutorialMode?: boolean
}

export function CreatePurchaseView({
  purchaseSteps,
  seller,
  onSellerChange,
  selectedToken,
  selectedTokenIcon,
  tokens,
  dropdownRef,
  isDropdownOpen,
  onToggleDropdown,
  onSelectToken,
  onCustomTokenChange,
  price,
  priceUsd,
  collateral,
  collateralUsd,
  priceInputMode,
  collateralInputMode,
  onPriceChange,
  onCollateralChange,
  onTogglePriceMode,
  onToggleCollateralMode,
  tokenPrice,
  message,
  isLoading,
  onSubmit,
  headerAction,
  tutorialTarget,
  tutorialMode = false,
}: CreatePurchaseViewProps) {
  return (
    <>
      {!tutorialMode ? (
        <div className="mb-8 flex flex-col items-center justify-center gap-3 text-center md:flex-row md:gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white">
            Create Secure Purchase
          </h1>
          {headerAction}
        </div>
      ) : null}

      {!tutorialMode ? <PurchaseStepsNavigation steps={purchaseSteps} /> : null}

      <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8">
        <form onSubmit={onSubmit} className={cx('space-y-6', tutorialMode && 'pointer-events-none')}>
          <div className={cx('space-y-3 rounded-2xl transition-all duration-300', guideRing(tutorialTarget === 'seller'))}>
            <label className="flex items-center text-secondary-900 dark:text-white font-medium">
              Seller Address
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
              onChange={(e) => onSellerChange(e.target.value)}
              placeholder="0x1234567890abcdef1234567890abcdef12345678"
              {...guideTargetProps('seller', tutorialMode)}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 font-mono text-sm"
              required
            />
          </div>

          <div className={cx('space-y-3 rounded-2xl transition-all duration-300', guideRing(tutorialTarget === 'token'))}>
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
                onClick={onToggleDropdown}
                {...guideTargetProps('token', tutorialMode)}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  {selectedTokenIcon ? <Image src={selectedTokenIcon} alt={`${selectedToken} icon`} width={24} height={24} /> : null}
                  <span className="font-medium">{selectedToken}</span>
                </div>
                <ChevronDownIcon />
              </button>

              <AnimatePresence>
                {isDropdownOpen ? (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0, transformOrigin: 'top' }}
                    animate={{ opacity: 1, scaleY: 1, transformOrigin: 'top' }}
                    exit={{ opacity: 0, scaleY: 0, transformOrigin: 'top' }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-800 border border-primary-500/30 rounded-xl shadow-xl z-20 overflow-hidden"
                  >
                    {tokens.map((token) => (
                      <button
                        key={token.symbol}
                        type="button"
                        onClick={() => onSelectToken(token)}
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
                        onChange={(e) => onCustomTokenChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-lg text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-primary-500/50 text-sm"
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cx('space-y-3 rounded-2xl transition-all duration-300', guideRing(tutorialTarget === 'price'))}>
              <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                Price
                <div className="group relative ml-2">
                  <InfoIcon />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    The price is the amount at which the product is sold.
                  </div>
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={priceInputMode === 'TOKEN' ? price : priceUsd}
                  onChange={(e) => onPriceChange(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  min="0"
                  {...guideTargetProps('price', tutorialMode)}
                  className="w-full pl-4 pr-24 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  {priceInputMode === 'TOKEN' && tokenPrice ? <span className="text-xs text-secondary-500 dark:text-dark-300">≈ ${priceUsd || '0.00'}</span> : null}
                  {priceInputMode === 'USD' && tokenPrice ? <span className="text-xs text-secondary-500 dark:text-dark-300">≈ {price || '0.00'} {selectedToken}</span> : null}
                  <button type="button" onClick={onTogglePriceMode} className="px-2 py-1 bg-white dark:bg-dark-800 rounded-lg border border-primary-500/20 text-xs font-medium text-secondary-900 dark:text-white hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors">
                    {priceInputMode === 'TOKEN' ? selectedToken : 'USD'}
                    <span className="ml-1 opacity-50">⇅</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={cx('space-y-3 rounded-2xl transition-all duration-300', guideRing(tutorialTarget === 'collateral'))}>
              <label className="flex items-center text-secondary-900 dark:text-white font-medium">
                Collateral
                <div className="group relative ml-2">
                  <InfoIcon />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    The collateral is the amount locked up to ensure a safe transaction.
                  </div>
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={collateralInputMode === 'TOKEN' ? collateral : collateralUsd}
                  onChange={(e) => onCollateralChange(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  min="0"
                  {...guideTargetProps('collateral', tutorialMode)}
                  className="w-full pl-4 pr-24 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                  {collateralInputMode === 'TOKEN' && tokenPrice ? <span className="text-xs text-secondary-500 dark:text-dark-300">≈ ${collateralUsd || '0.00'}</span> : null}
                  {collateralInputMode === 'USD' && tokenPrice ? <span className="text-xs text-secondary-500 dark:text-dark-300">≈ {collateral || '0.00'} {selectedToken}</span> : null}
                  <button type="button" onClick={onToggleCollateralMode} className="px-2 py-1 bg-white dark:bg-dark-800 rounded-lg border border-primary-500/20 text-xs font-medium text-secondary-900 dark:text-white hover:bg-slate-50 dark:hover:bg-dark-700 transition-colors">
                    {collateralInputMode === 'TOKEN' ? selectedToken : 'USD'}
                    <span className="ml-1 opacity-50">⇅</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={cx('space-y-3 rounded-2xl transition-all duration-300', guideRing(tutorialTarget === 'message'))}>
            <label className="flex items-center text-secondary-900 dark:text-white font-medium">
              Purchase ID
              <div className="group relative ml-2">
                <InfoIcon />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  The Purchase ID is a unique identifier generated when a purchase is created. It represents the smart contract address for this specific transaction.
                </div>
              </div>
            </label>
            <div {...guideTargetProps('message', tutorialMode, 'top-right')} className="px-4 py-3 bg-slate-100 dark:bg-dark-700/30 border border-primary-500/20 rounded-xl">
              <p className="text-secondary-600 dark:text-dark-300 font-mono text-sm break-all">{message}</p>
            </div>
          </div>

          <div className={cx('rounded-2xl transition-all duration-300', guideRing(tutorialTarget === 'submit'))}>
            <button
              type="submit"
              disabled={isLoading || !seller || !price || !collateral}
              {...guideTargetProps('submit', tutorialMode)}
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
          </div>
        </form>
      </div>

      {!tutorialMode ? (
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
      ) : null}
    </>
  )
}

interface PurchaseIdActionViewProps {
  title: string
  description: string
  headerAction?: ReactNode
  purchaseSteps: PurchaseStep[]
  purchaseId: string
  onPurchaseIdChange: (value: string) => void
  showDetails: boolean
  onToggleDetails: () => void
  details: PurchaseDetails | null
  message: string
  isSuccess?: boolean
  isLoading: boolean
  isSubmitDisabled: boolean
  submitLabel: string
  loadingLabel: string
  onSubmit: (e: React.FormEvent) => void
  tooltip: string
  tutorialTarget?: string
  tutorialMode?: boolean
  infoSection?: React.ReactNode
}

function PurchaseIdActionView({
  title,
  description,
  headerAction,
  purchaseSteps,
  purchaseId,
  onPurchaseIdChange,
  showDetails,
  onToggleDetails,
  details,
  message,
  isSuccess = false,
  isLoading,
  isSubmitDisabled,
  submitLabel,
  loadingLabel,
  onSubmit,
  tooltip,
  tutorialTarget,
  tutorialMode = false,
  infoSection,
}: PurchaseIdActionViewProps) {
  return (
    <>
      {!tutorialMode ? (
        <div className="mb-8 text-center">
          <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white">{title}</h1>
            {headerAction}
          </div>
          <p className="mt-4 text-secondary-600 dark:text-dark-300">{description}</p>
        </div>
      ) : null}

      {!tutorialMode ? <PurchaseStepsNavigation steps={purchaseSteps} /> : null}

      <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8">
        <form onSubmit={onSubmit} className={cx('space-y-6', tutorialMode && 'pointer-events-none')}>
          <div className="space-y-3">
            <label className="flex items-center text-secondary-900 dark:text-white font-medium">
              Purchase ID
              <div className="group relative ml-2">
                <InfoIcon />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  {tooltip}
                </div>
              </div>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={purchaseId}
                onChange={(e) => onPurchaseIdChange(e.target.value)}
                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                {...guideTargetProps('purchaseId', tutorialMode)}
                className={cx('min-w-0 flex-1 px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 font-mono text-sm', guideRing(tutorialTarget === 'purchaseId'))}
                required
              />
              <button
                type="button"
                onClick={onToggleDetails}
                disabled={isLoading}
                {...guideTargetProps('showDetails', tutorialMode)}
                className={cx('w-full px-6 py-3 bg-slate-200 dark:bg-dark-700 text-slate-800 dark:text-white font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-dark-600 transition-colors sm:w-auto sm:whitespace-nowrap', guideRing(tutorialTarget === 'showDetails'))}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
          </div>

          {showDetails && details ? <div {...guideTargetProps('details', tutorialMode, 'top-right')} className={cx('rounded-2xl transition-all duration-300', guideRing(tutorialTarget === 'details'))}><PurchaseDetailsCard details={details} purchaseId={purchaseId} /></div> : null}

          <div className={cx('rounded-2xl transition-all duration-300', guideRing(tutorialTarget === 'submit'))}>
            <button
              type="submit"
              disabled={isLoading || isSubmitDisabled}
              {...guideTargetProps('submit', tutorialMode)}
              className="w-full px-6 py-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-800/30 dark:border-white/30 border-t-slate-800 dark:border-t-white rounded-full animate-spin" />
                  <span>{loadingLabel}</span>
                </>
              ) : (
                <span>{submitLabel}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {message ? <div className={cx('mt-8 rounded-xl backdrop-blur-sm transition-all duration-300', guideRing(tutorialTarget === 'message'))}><div {...guideTargetProps('message', tutorialMode, 'top-right')} className="p-4 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl"><p className={cx('font-mono text-sm break-all', isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>{message}</p></div></div> : null}

      {infoSection}
    </>
  )
}

interface ConfirmPurchaseViewProps {
  purchaseSteps: PurchaseStep[]
  purchaseId: string
  onPurchaseIdChange: (value: string) => void
  purchaseDetails: PurchaseDetails | null
  showDetails: boolean
  message: string
  isSuccess?: boolean
  isLoading: boolean
  onToggleDetails: () => void
  onSubmit: (e: React.FormEvent) => void
  headerAction?: ReactNode
  tutorialTarget?: string
  tutorialMode?: boolean
}

export function ConfirmPurchaseView(props: ConfirmPurchaseViewProps) {
  return (
    <PurchaseIdActionView
      title="Confirm Purchase"
      description="Sellers confirm purchases by locking collateral to guarantee delivery"
      details={props.purchaseDetails}
      isSubmitDisabled={!props.purchaseId}
      submitLabel="Confirm Purchase"
      loadingLabel="Confirming Purchase..."
      tooltip="Only sellers can confirm purchases. The seller sends the collateral amount, and only receives the funds after the buyer confirms receipt of goods."
      infoSection={
        props.tutorialMode ? null : (
          <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center">
                  <span className="w-2 h-2 bg-slate-500 rounded-full mr-3"></span>
                  For Sellers
                </h3>
                <ul className="space-y-2 text-sm text-secondary-600 dark:text-dark-300">
                  <li className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>Lock collateral equal to the purchase amount</li>
                  <li className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>Funds are held in escrow until delivery</li>
                  <li className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>Receive payment after buyer confirms receipt</li>
                </ul>
              </div>
              <div className="p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center">
                  <span className="w-2 h-2 bg-slate-500 rounded-full mr-3"></span>
                  Security Features
                </h3>
                <ul className="space-y-2 text-sm text-secondary-600 dark:text-dark-300">
                  <li className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>Smart contract escrow protection</li>
                  <li className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>Automated dispute resolution</li>
                  <li className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span>Collateral-backed guarantees</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 p-6 bg-white/70 dark:bg-dark-800/30 backdrop-blur-sm border border-primary-500/20 rounded-xl">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Confirmation Process</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center"><div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg mx-auto mb-3">1</div><h4 className="font-medium text-secondary-900 dark:text-white mb-2">Enter Purchase ID</h4><p className="text-sm text-secondary-600 dark:text-dark-400">Provide the unique purchase identifier</p></div>
                <div className="text-center"><div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg mx-auto mb-3">2</div><h4 className="font-medium text-secondary-900 dark:text-white mb-2">Lock Collateral</h4><p className="text-sm text-secondary-600 dark:text-dark-400">Secure the transaction with collateral</p></div>
                <div className="text-center"><div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg mx-auto mb-3">3</div><h4 className="font-medium text-secondary-900 dark:text-white mb-2">Fulfill Order</h4><p className="text-sm text-secondary-600 dark:text-dark-400">Ship or deliver the product</p></div>
                <div className="text-center"><div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg mx-auto mb-3">4</div><h4 className="font-medium text-secondary-900 dark:text-white mb-2">Receive Payment</h4><p className="text-sm text-secondary-600 dark:text-dark-400">Get paid after buyer confirmation</p></div>
              </div>
            </div>
          </>
        )
      }
      {...props}
    />
  )
}

interface ReleasePurchaseViewProps extends ConfirmPurchaseViewProps {}

export function ReleasePurchaseView(props: ReleasePurchaseViewProps) {
  return (
    <PurchaseIdActionView
      title="Release Purchase"
      description="Buyers can release funds to complete the transaction"
      details={props.purchaseDetails}
      isSubmitDisabled={!props.purchaseId}
      submitLabel="Release Funds"
      loadingLabel="Processing..."
      tooltip="Only buyers can release purchases. Both parties receive their collateral back and the price amount is sent to the seller."
      infoSection={
        props.tutorialMode ? null : (
          <div className="mt-8 p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-2xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3">Release Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-secondary-600 dark:text-dark-300">
              <div className="flex items-start space-x-3"><div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-secondary-900 dark:text-white text-sm font-bold flex-shrink-0">1</div><div><p className="font-medium text-secondary-900 dark:text-white mb-1">Buyer Action</p><p>Only the buyer can release funds to complete the transaction</p></div></div>
              <div className="flex items-start space-x-3"><div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-secondary-900 dark:text-white text-sm font-bold flex-shrink-0">2</div><div><p className="font-medium text-secondary-900 dark:text-white mb-1">Verify Product</p><p>Buyer should only release funds on satisfactory receipt of the product</p></div></div>
              <div className="flex items-start space-x-3"><div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-secondary-900 dark:text-white text-sm font-bold flex-shrink-0">3</div><div><p className="font-medium text-secondary-900 dark:text-white mb-1">Automatic Distribution</p><p>Funds and collateral are automatically distributed to both parties</p></div></div>
            </div>
          </div>
        )
      }
      {...props}
    />
  )
}

interface AbortPurchaseViewProps {
  purchaseSteps: PurchaseStep[]
  purchaseId: string
  onPurchaseIdChange: (value: string) => void
  purchaseDetails: PurchaseDetails | null
  showDetails: boolean
  message: string
  isSuccess?: boolean
  isLoading: boolean
  onToggleDetails: () => void
  onSubmit: (e: React.FormEvent) => void
  headerAction?: ReactNode
  tutorialTarget?: string
  tutorialMode?: boolean
}

export function AbortPurchaseView({
  purchaseSteps,
  purchaseId,
  onPurchaseIdChange,
  purchaseDetails,
  showDetails,
  message,
  isSuccess = false,
  isLoading,
  onToggleDetails,
  onSubmit,
  headerAction,
  tutorialTarget,
  tutorialMode = false,
}: AbortPurchaseViewProps) {
  return (
    <>
      {!tutorialMode ? (
        <div className="mb-8 text-center">
          <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white">Abort Purchase</h1>
            {headerAction}
          </div>
          <p className="mt-4 text-secondary-600 dark:text-dark-300">Cancel a purchase and return all escrowed funds</p>
        </div>
      ) : null}

      {!tutorialMode ? <PurchaseStepsNavigation steps={purchaseSteps} /> : null}

      <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8">
        <form onSubmit={onSubmit} className={cx('space-y-6', tutorialMode && 'pointer-events-none')}>
          <div className="space-y-3">
            <label className="flex items-center text-secondary-900 dark:text-white font-medium">
              Purchase ID
              <div className="group relative ml-2">
                <InfoIcon />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 p-3 bg-white dark:bg-dark-900 border border-primary-500/30 rounded-lg text-sm text-secondary-600 dark:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  Both buyers and sellers can abort a purchase before confirmation. After confirmation, only mutual agreement or dispute resolution can cancel.
                </div>
              </div>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={purchaseId}
                onChange={(e) => onPurchaseIdChange(e.target.value)}
                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                {...guideTargetProps('purchaseId', tutorialMode)}
                className={cx('min-w-0 flex-1 px-4 py-3 bg-slate-100 dark:bg-dark-700/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200 font-mono text-sm', guideRing(tutorialTarget === 'purchaseId'))}
                required
              />
              <button type="button" onClick={onToggleDetails} disabled={isLoading} {...guideTargetProps('showDetails', tutorialMode)} className="w-full px-6 py-3 bg-slate-200 dark:bg-dark-700 text-slate-800 dark:text-white font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-dark-600 transition-colors sm:w-auto sm:whitespace-nowrap">
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
          </div>

          {showDetails && purchaseDetails ? <div {...guideTargetProps('details', tutorialMode, 'top-right')}><PurchaseDetailsCard details={purchaseDetails} purchaseId={purchaseId} /></div> : null}

          <div className={cx('rounded-2xl transition-all duration-300', guideRing(tutorialTarget === 'submit'))}>
            <button type="submit" disabled={isLoading || !purchaseId} {...guideTargetProps('submit', tutorialMode)} className="w-full px-6 py-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {isLoading ? (<><div className="w-5 h-5 border-2 border-slate-800/30 dark:border-white/30 border-t-slate-800 dark:border-t-white rounded-full animate-spin" /><span>Processing Cancellation...</span></>) : <span>Abort Purchase</span>}
            </button>
          </div>
        </form>
      </div>

      {message ? <div className={cx('mt-8 rounded-xl transition-all duration-300', guideRing(tutorialTarget === 'message'))}><div {...guideTargetProps('message', tutorialMode, 'top-right')} className="p-4 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl backdrop-blur-sm"><p className={cx('font-mono text-sm break-all', isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>{message}</p></div></div> : null}

      {!tutorialMode ? (
        <>
          <div className="mt-8 p-6 bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-xl backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-3 flex items-center"><ExclamationIcon /><span className="ml-2">Important Information</span></h3>
            <div className="space-y-2 text-sm text-secondary-600 dark:text-dark-300">
              <div className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span><p><strong>Cancellation Policy:</strong> All escrowed funds will be returned to their original owners.</p></div>
              <div className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span><p><strong>Fund Distribution:</strong> Buyer&apos;s payment and seller&apos;s collateral (if any) will be automatically refunded.</p></div>
              <div className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span><p><strong>Record Keeping:</strong> This cancellation will be recorded on the blockchain for transparency.</p></div>
              <div className="flex items-start"><span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-2 mt-2 flex-shrink-0"></span><p><strong>Mutual Agreement:</strong> Both parties should agree to the cancellation when possible.</p></div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-white/70 dark:bg-dark-800/30 backdrop-blur-sm border border-primary-500/20 rounded-xl">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Refund Process</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-4"><div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-secondary-900 dark:text-white text-sm font-bold flex-shrink-0">1</div><div><h4 className="font-medium text-secondary-900 dark:text-white mb-1">Initiate Cancellation</h4><p className="text-sm text-secondary-600 dark:text-dark-400">Submit cancellation request</p></div></div>
              <div className="flex items-start space-x-4"><div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-secondary-900 dark:text-white text-sm font-bold flex-shrink-0">2</div><div><h4 className="font-medium text-secondary-900 dark:text-white mb-1">Process Refund</h4><p className="text-sm text-secondary-600 dark:text-dark-400">Smart contract automatically processes refunds</p></div></div>
              <div className="flex items-start space-x-4"><div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-full flex items-center justify-center text-secondary-900 dark:text-white text-sm font-bold flex-shrink-0">3</div><div><h4 className="font-medium text-secondary-900 dark:text-white mb-1">Funds Returned</h4><p className="text-sm text-secondary-600 dark:text-dark-400">All funds returned to original wallets</p></div></div>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}