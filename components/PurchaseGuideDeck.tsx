import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AbortPurchaseView,
  ConfirmPurchaseView,
  CreatePurchaseView,
  ReleasePurchaseView,
} from '@/components/PurchaseFlowViews'
import type { PurchaseDetails } from '@/lib/functions'
import EthIcon from 'cryptocurrency-icons/svg/color/eth.svg'
import UsdcIcon from 'cryptocurrency-icons/svg/color/usdc.svg'

export const guideStepOrder = ['create', 'confirm', 'release', 'abort'] as const

export type GuideStepId = (typeof guideStepOrder)[number]

type Scene = {
  target: string
  caption: string
}

type CursorTarget = {
  left: string
  top: string
}

type CursorPosition = {
  left: number
  top: number
}

type SlideDefinition = {
  id: GuideStepId
  stepNumber: number
  role: string
  title: string
  pageTitle: string
  pageDescription: string
  accent: string
  activeStepClasses: string
  activeStepRoleClasses: string
  actionButtonClasses: string
  realPageHref: string
  realPageLabel: string
  scenes: Scene[]
  targets: Record<string, CursorTarget>
}

const purchaseSteps = {
  create: [
    { id: 'create', label: 'Create', active: true },
    { id: 'abort', label: 'Abort', active: false },
    { id: 'confirm', label: 'Confirm', active: false },
    { id: 'release', label: 'Release', active: false },
    { id: 'logs', label: 'Logs', active: false },
  ],
  confirm: [
    { id: 'create', label: 'Create', active: false },
    { id: 'abort', label: 'Abort', active: false },
    { id: 'confirm', label: 'Confirm', active: true },
    { id: 'release', label: 'Release', active: false },
    { id: 'logs', label: 'Logs', active: false },
  ],
  release: [
    { id: 'create', label: 'Create', active: false },
    { id: 'abort', label: 'Abort', active: false },
    { id: 'confirm', label: 'Confirm', active: false },
    { id: 'release', label: 'Release', active: true },
    { id: 'logs', label: 'Logs', active: false },
  ],
  abort: [
    { id: 'create', label: 'Create', active: false },
    { id: 'abort', label: 'Abort', active: true },
    { id: 'confirm', label: 'Confirm', active: false },
    { id: 'release', label: 'Release', active: false },
    { id: 'logs', label: 'Logs', active: false },
  ],
}

const slides: Record<GuideStepId, SlideDefinition> = {
  create: {
    id: 'create',
    stepNumber: 1,
    role: 'Buyer wallet',
    title: 'Create the purchase contract',
    pageTitle: 'Create Secure Purchase',
    pageDescription: 'Buyers start the escrow by selecting a token, setting the price, and locking price plus collateral.',
    accent: 'from-blue-500 to-cyan-500',
    activeStepClasses: 'border-blue-200 bg-blue-50 text-blue-950 shadow-sm dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-100',
    activeStepRoleClasses: 'text-blue-700 dark:text-blue-200/80',
    actionButtonClasses: 'bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400',
    realPageHref: '/create-purchase',
    realPageLabel: 'Open Create Purchase',
    scenes: [
      { target: 'seller', caption: 'Paste the seller wallet address first so the purchase knows who can confirm and receive the payout.' },
      { target: 'token', caption: 'Choose the token on the active network. The guide mirrors the same token picker layout as the live page.' },
      { target: 'price', caption: 'Enter the purchase price. In the real page, the user can switch between token and USD input modes.' },
      { target: 'collateral', caption: 'Add the collateral amount. This is what makes the escrow double-sided and discourages bad behavior.' },
      { target: 'submit', caption: 'When the form is complete, the buyer signs the create transaction to deploy the purchase contract.' },
      { target: 'message', caption: 'After the transaction succeeds, the purchase ID appears here. Share that ID with the seller for the confirm step.' },
    ],
    targets: {
      seller: { left: '84%', top: '13%' },
      token: { left: '84%', top: '26%' },
      price: { left: '42%', top: '40%' },
      collateral: { left: '88%', top: '40%' },
      submit: { left: '86%', top: '67%' },
      message: { left: '86%', top: '56%' },
    },
  },
  confirm: {
    id: 'confirm',
    stepNumber: 2,
    role: 'Seller wallet',
    title: 'Confirm and lock seller collateral',
    pageTitle: 'Confirm Purchase',
    pageDescription: 'Sellers review the purchase ID, inspect the details, and sign only if they can fulfill the order.',
    accent: 'from-violet-500 to-fuchsia-500',
    activeStepClasses: 'border-violet-200 bg-violet-50 text-violet-950 shadow-sm dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-100',
    activeStepRoleClasses: 'text-violet-700 dark:text-violet-200/80',
    actionButtonClasses: 'bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-500 dark:text-white dark:hover:bg-violet-400',
    realPageHref: '/confirm-purchase',
    realPageLabel: 'Open Confirm Purchase',
    scenes: [
      { target: 'purchaseId', caption: 'Paste the purchase ID that the buyer sends after creation.' },
      { target: 'showDetails', caption: 'Use Show Details to review the token, price, addresses, and current state before signing.' },
      { target: 'details', caption: 'This mirrored card represents the on-chain purchase details the seller should inspect carefully.' },
      { target: 'submit', caption: 'If everything looks correct, the seller signs the confirmation transaction and locks their collateral.' },
      { target: 'message', caption: 'The success message confirms the purchase has entered the confirmed state and is ready for delivery.' },
    ],
    targets: {
      purchaseId: { left: '58%', top: '13%' },
      showDetails: { left: '87%', top: '13%' },
      details: { left: '86%', top: '35%' },
      submit: { left: '86%', top: '51%' },
      message: { left: '86%', top: '63%' },
    },
  },
  release: {
    id: 'release',
    stepNumber: 3,
    role: 'Buyer wallet',
    title: 'Release after delivery is complete',
    pageTitle: 'Release Purchase',
    pageDescription: 'The buyer returns to the purchase ID after delivery and releases the escrow only when the order is complete.',
    accent: 'from-emerald-500 to-teal-500',
    activeStepClasses: 'border-emerald-200 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-100',
    activeStepRoleClasses: 'text-emerald-700 dark:text-emerald-200/80',
    actionButtonClasses: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-500 dark:text-white dark:hover:bg-emerald-400',
    realPageHref: '/release-purchase',
    realPageLabel: 'Open Release Purchase',
    scenes: [
      { target: 'purchaseId', caption: 'Re-enter the same purchase ID so the buyer is acting on the correct confirmed contract.' },
      { target: 'showDetails', caption: 'Review the current purchase details one more time before releasing the funds.' },
      { target: 'submit', caption: 'Release is the buyer approval step. It tells the contract to distribute payment and collateral automatically.' },
      { target: 'message', caption: 'The final message confirms the funds have been released and the trade is complete.' },
    ],
    targets: {
      purchaseId: { left: '58%', top: '13%' },
      showDetails: { left: '87%', top: '13%' },
      submit: { left: '86%', top: '39%' },
      message: { left: '86%', top: '51%' },
    },
  },
  abort: {
    id: 'abort',
    stepNumber: 4,
    role: 'Buyer or seller wallet',
    title: 'Abort when the trade cannot continue',
    pageTitle: 'Abort Purchase',
    pageDescription: 'The buyer can abort the purchase after committing funds but before the seller confirms his acceptance of the transaction.',
    accent: 'from-amber-500 to-orange-500',
    activeStepClasses: 'border-amber-200 bg-amber-50 text-amber-950 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-100',
    activeStepRoleClasses: 'text-amber-700 dark:text-amber-200/80',
    actionButtonClasses: 'bg-amber-500 text-slate-950 hover:bg-amber-400 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400',
    realPageHref: '/abort-purchase',
    realPageLabel: 'Open Abort Purchase',
    scenes: [
      { target: 'purchaseId', caption: 'Start with the purchase ID so the cancellation applies to the correct escrow.' },
      { target: 'showDetails', caption: 'Open the purchase details first so both parties can verify the escrow state before cancelling.' },
      { target: 'submit', caption: 'Submit the abort transaction only when the purchase is still in a cancellable state.' },
      { target: 'message', caption: 'The mirrored result shows the expected refund path: funds are returned and the trade does not continue.' },
    ],
    targets: {
      purchaseId: { left: '58%', top: '12%' },
      showDetails: { left: '87%', top: '12%' },
      submit: { left: '86%', top: '49%' },
      message: { left: '86%', top: '89%' },
    },
  },
}

const mockPurchaseDetails: PurchaseDetails = {
  id: '0x9eF6A1D31b3f7A8E6b1931F3C4AA5C28fA9e0813',
  seller: '0x84e7f05bD4129f4B86A4Ab8717aC1f21C8C6c7f2',
  buyer: '0x7D2A58bD55075e5C7A87A56a8F5E3d0b8A17f1C3',
  price: '1200000000',
  collateral: '400000000',
  tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  status: 'created',
  timestamp: new Date('2026-03-14T12:00:00Z'),
}

const tutorialTokens = [
  { symbol: 'ETH', address: '0x0000000000000000000000000000000000000000', icon: EthIcon },
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', icon: UsdcIcon },
]

const emptyDropdownRef = { current: null }

const noopSubmit = (event: React.FormEvent) => {
  event.preventDefault()
}

export function isGuideStepId(step: string): step is GuideStepId {
  return guideStepOrder.includes(step as GuideStepId)
}

interface PurchaseGuideDeckProps {
  step: GuideStepId
  onStepChange: (step: GuideStepId) => void
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function highlightClasses(isActive: boolean) {
  return cx(
    'transition-all duration-300',
    isActive && 'ring-4 ring-sky-400/45 border-sky-400/60 shadow-[0_0_0_1px_rgba(56,189,248,0.4),0_20px_50px_rgba(56,189,248,0.18)]'
  )
}

function MockStepNavigation({ activeStep }: { activeStep: GuideStepId }) {
  return (
    <div className="relative flex flex-wrap justify-center gap-2 rounded-xl border border-primary-500/20 bg-white/50 p-2 backdrop-blur-sm dark:bg-dark-800/30">
      {purchaseSteps[activeStep].map((step) => (
        <div
          key={step.id}
          className={cx(
            'rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
            step.active
              ? 'bg-gradient-to-r from-primary-300 to-secondary-300 text-white shadow-lg dark:from-primary-700 dark:to-secondary-700'
              : 'text-secondary-600 dark:text-dark-400'
          )}
        >
          {step.label}
        </div>
      ))}
    </div>
  )
}

function MockLabel({ children }: { children: string }) {
  return <p className="mb-3 text-sm font-medium text-secondary-900 dark:text-white">{children}</p>
}

function MockField({
  label,
  value,
  placeholder,
  active,
  wide = false,
  aside,
}: {
  label: string
  value: string
  placeholder?: string
  active: boolean
  wide?: boolean
  aside?: string
}) {
  return (
    <div className={wide ? 'space-y-3' : ''}>
      <MockLabel>{label}</MockLabel>
      <div
        className={cx(
          'flex min-h-[56px] items-center justify-between rounded-xl border border-primary-500/30 bg-slate-100 px-4 py-3 text-sm text-secondary-900 dark:bg-dark-700/50 dark:text-white',
          highlightClasses(active)
        )}
      >
        <span className={value ? '' : 'text-secondary-400 dark:text-dark-400'}>{value || placeholder}</span>
        {aside ? <span className="text-xs text-secondary-500 dark:text-dark-300">{aside}</span> : null}
      </div>
    </div>
  )
}

function MockButton({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cx(
        'flex min-h-[58px] items-center justify-center rounded-xl bg-gradient-to-r from-slate-200 to-slate-300 px-6 py-4 text-sm font-semibold text-slate-800 shadow-lg dark:from-slate-600 dark:to-slate-700 dark:text-white',
        active && 'scale-[0.99] brightness-105',
        highlightClasses(active)
      )}
    >
      {label}
    </div>
  )
}

function MockStatus({ message, active }: { message: string; active: boolean }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-primary-500/20 bg-white/70 p-4 backdrop-blur-sm dark:bg-dark-800/50',
        highlightClasses(active)
      )}
    >
      <p className="break-all font-mono text-sm text-secondary-600 dark:text-slate-400">{message}</p>
    </div>
  )
}

function CreateMockPage({ sceneIndex, activeTarget }: { sceneIndex: number; activeTarget: string }) {
  const values = {
    seller: sceneIndex >= 0 ? '0x84e7f05bD4129f4B86A4Ab8717aC1f21C8C6c7f2' : '',
    token: sceneIndex >= 1 ? 'USDC' : '',
    price: sceneIndex >= 2 ? '1,200.00' : '',
    collateral: sceneIndex >= 3 ? '400.00' : '',
    message:
      sceneIndex >= 5
        ? 'Purchase ID: 0x9eF6A1D31b3f7A8E6b1931F3C4AA5C28fA9e0813 (tx: 0x70c9...4d1a)'
        : 'Purchase ID will appear here',
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="mb-4 text-3xl font-bold text-secondary-900 dark:text-white">Create Secure Purchase</h2>
      </div>
      <MockStepNavigation activeStep="create" />
      <div className="rounded-2xl border border-primary-500/20 bg-white/70 p-8 backdrop-blur-sm dark:bg-dark-800/50">
        <div className="space-y-6">
          <MockField label="Wallet ID" value={values.seller} placeholder="0x1234567890abcdef1234567890abcdef12345678" active={activeTarget === 'seller'} wide />
          <MockField label="Token" value={values.token} placeholder="Select Token" active={activeTarget === 'token'} aside={sceneIndex >= 1 ? 'Dropdown' : undefined} wide />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <MockField label="Price" value={values.price} placeholder="0.00" active={activeTarget === 'price'} aside="USDC" />
            <MockField label="Collateral" value={values.collateral} placeholder="0.00" active={activeTarget === 'collateral'} aside="USDC" />
          </div>
          <div className="space-y-3">
            <MockLabel>Purchase ID</MockLabel>
            <div className={cx('rounded-xl border border-primary-500/20 bg-slate-100 px-4 py-3 dark:bg-dark-700/30', highlightClasses(activeTarget === 'message'))}>
              <p className="break-all font-mono text-sm text-secondary-600 dark:text-dark-300">{values.message}</p>
            </div>
          </div>
          <MockButton label="Create Purchase" active={activeTarget === 'submit'} />
        </div>
      </div>
      <div className="rounded-2xl border border-primary-500/20 bg-white/70 p-6 backdrop-blur-sm dark:bg-dark-800/50">
        <h3 className="mb-3 text-lg font-semibold text-secondary-900 dark:text-white">How it works</h3>
        <div className="grid grid-cols-1 gap-4 text-sm text-secondary-600 dark:text-dark-300 md:grid-cols-3">
          <div>1. Buyer sets the seller, token, price, and collateral.</div>
          <div>2. The page returns a purchase ID after the transaction succeeds.</div>
          <div>3. That purchase ID is shared with the seller for confirmation.</div>
        </div>
      </div>
    </div>
  )
}

function SlideMock({
  slideId,
  sceneIndex,
  activeTarget,
  typedSellerValue,
  typedPurchaseIdValue,
  typedPriceValue,
  typedCollateralValue,
  createDropdownOpen,
  createSelectedToken,
  detailsPanelOpen,
}: {
  slideId: GuideStepId
  sceneIndex: number
  activeTarget: string
  typedSellerValue: string
  typedPurchaseIdValue: string
  typedPriceValue: string
  typedCollateralValue: string
  createDropdownOpen: boolean
  createSelectedToken: string
  detailsPanelOpen: boolean
}) {
  if (slideId === 'create') {
    return (
      <CreatePurchaseView
        purchaseSteps={purchaseSteps.create}
        seller={typedSellerValue}
        onSellerChange={() => {}}
        selectedToken={sceneIndex >= 1 ? createSelectedToken : 'Select Token'}
        selectedTokenIcon={sceneIndex >= 1 && createSelectedToken === 'USDC' ? UsdcIcon : undefined}
        tokens={tutorialTokens}
        tokenAddress={tutorialTokens[1].address}
        dropdownRef={emptyDropdownRef}
        isDropdownOpen={createDropdownOpen}
        onToggleDropdown={() => {}}
        onSelectToken={() => {}}
        onCustomTokenChange={() => {}}
        price={sceneIndex >= 2 ? (sceneIndex === 2 ? typedPriceValue : '1200.00') : ''}
        priceUsd={sceneIndex >= 2 ? (sceneIndex === 2 ? typedPriceValue : '1200.00') : ''}
        collateral={sceneIndex >= 3 ? (sceneIndex === 3 ? typedCollateralValue : '400.00') : ''}
        collateralUsd={sceneIndex >= 3 ? (sceneIndex === 3 ? typedCollateralValue : '400.00') : ''}
        priceInputMode="TOKEN"
        collateralInputMode="TOKEN"
        onPriceChange={() => {}}
        onCollateralChange={() => {}}
        onTogglePriceMode={() => {}}
        onToggleCollateralMode={() => {}}
        tokenPrice={1}
        message={sceneIndex >= 5 ? 'Purchase ID: 0x9eF6A1D31b3f7A8E6b1931F3C4AA5C28fA9e0813 (tx: 0x70c9...4d1a)' : 'Purchase ID will appear here'}
        isLoading={false}
        onSubmit={noopSubmit}
        tutorialTarget={activeTarget}
        tutorialMode
      />
    )
  }

  if (slideId === 'confirm') {
    return (
      <ConfirmPurchaseView
        purchaseSteps={purchaseSteps.confirm}
        purchaseId={typedPurchaseIdValue}
        onPurchaseIdChange={() => {}}
        purchaseDetails={detailsPanelOpen ? mockPurchaseDetails : null}
        showDetails={detailsPanelOpen}
        message={sceneIndex >= 4 ? 'Purchase confirmed successfully!' : ''}
        isLoading={false}
        onToggleDetails={() => {}}
        onSubmit={noopSubmit}
        tutorialTarget={activeTarget}
        tutorialMode
      />
    )
  }

  if (slideId === 'release') {
    return (
      <ReleasePurchaseView
        purchaseSteps={purchaseSteps.release}
        purchaseId={typedPurchaseIdValue}
        onPurchaseIdChange={() => {}}
        purchaseDetails={detailsPanelOpen ? { ...mockPurchaseDetails, status: 'confirmed' } : null}
        showDetails={detailsPanelOpen}
        message={sceneIndex >= 3 ? 'Funds released successfully!' : ''}
        isLoading={false}
        onToggleDetails={() => {}}
        onSubmit={noopSubmit}
        tutorialTarget={activeTarget}
        tutorialMode
      />
    )
  }

  return (
    <AbortPurchaseView
      purchaseSteps={purchaseSteps.abort}
      purchaseId={typedPurchaseIdValue}
      onPurchaseIdChange={() => {}}
      purchaseDetails={detailsPanelOpen ? mockPurchaseDetails : null}
      showDetails={detailsPanelOpen}
      message={sceneIndex >= 3 ? 'Purchase aborted successfully. All funds have been returned.' : ''}
      isLoading={false}
      onToggleDetails={() => {}}
      onSubmit={noopSubmit}
      tutorialTarget={activeTarget}
      tutorialMode
    />
  )
}

function FakeCursor({ target, pulseKey }: { target: CursorTarget; pulseKey: string }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-30 h-10 w-10"
      animate={{
        left: `calc(${target.left} - 20px)`,
        top: `calc(${target.top} - 18px)`,
      }}
      transition={{ type: 'spring', stiffness: 180, damping: 24, mass: 0.6 }}
    >
      <motion.div
        key={pulseKey}
        className="relative h-full w-full"
        animate={{ scale: [1, 0.68, 1], x: [0, 1.5, 0], y: [0, 3, 0] }}
        transition={{ duration: 0.36, times: [0, 0.42, 1], delay: 0.28, ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute bottom-0 right-0 h-5 w-5 rounded-full border border-sky-300/70 bg-sky-300/20"
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 0.9, 1.65], opacity: [0, 0.75, 0] }}
          transition={{ duration: 0.42, times: [0, 0.45, 1], delay: 0.32, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-sky-400/30 blur-[6px]"
          animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <svg viewBox="0 0 40 40" className="relative h-full w-full drop-shadow-[0_12px_22px_rgba(15,23,42,0.4)]">
          <defs>
            <linearGradient id="guide-cursor-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#dbeafe" />
            </linearGradient>
          </defs>
          <path
            d="M9 6.5c0-1.1 1.25-1.76 2.18-1.15l17.4 11.38c1.03.67.82 2.23-.35 2.61l-6.77 2.21 4.9 10.45c.42.9.02 1.98-.9 2.39l-2.19.98a1.8 1.8 0 0 1-2.37-.88l-4.9-10.46-5.06 4.84c-.84.81-2.24.22-2.24-.95V6.5Z"
            fill="url(#guide-cursor-fill)"
            stroke="#0f172a"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  )
}

function getFallbackCursorPosition(target: CursorTarget, container: HTMLDivElement): CursorPosition {
  const width = container.clientWidth
  const height = container.clientHeight

  return {
    left: (parseFloat(target.left) / 100) * width,
    top: (parseFloat(target.top) / 100) * height,
  }
}

function getMeasuredCursorPosition(targetElement: HTMLElement, container: HTMLDivElement): CursorPosition {
  const containerRect = container.getBoundingClientRect()
  const targetRect = targetElement.getBoundingClientRect()
  const anchor = targetElement.dataset.guideAnchor || 'center-right'
  const horizontalInset = Math.min(22, Math.max(12, targetRect.width * 0.12))
  const verticalInset = Math.min(18, Math.max(10, targetRect.height * 0.22))

  const left = targetRect.left - containerRect.left + targetRect.width - horizontalInset
  const top = anchor === 'top-right'
    ? targetRect.top - containerRect.top + verticalInset
    : targetRect.top - containerRect.top + targetRect.height / 2

  return { left, top }
}

export default function PurchaseGuideDeck({ step, onStepChange }: PurchaseGuideDeckProps) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [replaySeed, setReplaySeed] = useState(0)
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null)
  const [typedSellerValue, setTypedSellerValue] = useState(mockPurchaseDetails.seller)
  const [typedPurchaseIdValue, setTypedPurchaseIdValue] = useState(mockPurchaseDetails.id)
  const [typedPriceValue, setTypedPriceValue] = useState('1200.00')
  const [typedCollateralValue, setTypedCollateralValue] = useState('400.00')
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [createSelectedToken, setCreateSelectedToken] = useState('USDC')
  const [detailsPanelOpen, setDetailsPanelOpen] = useState(false)
  const slideViewportRef = useRef<HTMLDivElement | null>(null)

  const slide = slides[step]
  const activeScene = slide.scenes[sceneIndex] || slide.scenes[0]
  const fallbackTarget = slide.targets[activeScene.target]
  const currentIndex = guideStepOrder.indexOf(step)

  useEffect(() => {
    let cancelled = false
    const timers: number[] = []

    setSceneIndex(0)
    setIsPlaying(true)

    slide.scenes.forEach((_, index) => {
      const timer = window.setTimeout(() => {
        if (!cancelled) {
          setSceneIndex(index)
        }
      }, 500 + index * 1700)
      timers.push(timer)
    })

    const doneTimer = window.setTimeout(() => {
      if (!cancelled) {
        setIsPlaying(false)
      }
    }, 500 + slide.scenes.length * 1700)
    timers.push(doneTimer)

    return () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [replaySeed, slide])

  useEffect(() => {
    const container = slideViewportRef.current

    if (!container) {
      return
    }

    let frame = 0
    let timeoutIds: number[] = []
    let resizeObserver: ResizeObserver | null = null

    const measure = () => {
      const targetElement = container.querySelector<HTMLElement>(`[data-guide-target="${activeScene.target}"]`)

      if (targetElement) {
        setCursorPosition(getMeasuredCursorPosition(targetElement, container))
        return
      }

      setCursorPosition(getFallbackCursorPosition(fallbackTarget, container))
    }

    const scheduleMeasure = () => {
      frame = window.requestAnimationFrame(() => {
        measure()
      })
    }

    scheduleMeasure()
    timeoutIds = [80, 220].map((delay) => window.setTimeout(measure, delay))

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(container)
    }

    window.addEventListener('resize', measure)

    return () => {
      window.cancelAnimationFrame(frame)
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
      resizeObserver?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [activeScene.target, fallbackTarget, sceneIndex, step])

  useEffect(() => {
    const fullSellerValue = mockPurchaseDetails.seller
    const fullPurchaseIdValue = mockPurchaseDetails.id
    const fullPriceValue = '1200.00'
    const fullCollateralValue = '400.00'
    const activeTypedScene =
      step === 'create' && activeScene.target === 'seller'
        ? { value: fullSellerValue, setValue: setTypedSellerValue }
        : step !== 'create' && activeScene.target === 'purchaseId'
          ? { value: fullPurchaseIdValue, setValue: setTypedPurchaseIdValue }
          : step === 'create' && activeScene.target === 'price'
            ? { value: fullPriceValue, setValue: setTypedPriceValue }
            : step === 'create' && activeScene.target === 'collateral'
              ? { value: fullCollateralValue, setValue: setTypedCollateralValue }
              : null

    if (activeScene.target !== 'seller') {
      setTypedSellerValue(fullSellerValue)
    }

    if (activeScene.target !== 'purchaseId') {
      setTypedPurchaseIdValue(fullPurchaseIdValue)
    }

    if (activeScene.target !== 'price') {
      setTypedPriceValue(fullPriceValue)
    }

    if (activeScene.target !== 'collateral') {
      setTypedCollateralValue(fullCollateralValue)
    }

    if (!activeTypedScene) {
      return
    }

    const { value: targetValue, setValue } = activeTypedScene

    setValue('')

    let index = 0
    let intervalId: number | undefined

    const startDelay = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1
        setValue(targetValue.slice(0, index))

        if (index >= targetValue.length) {
          if (intervalId) {
            window.clearInterval(intervalId)
          }
        }
      }, 18)
    }, 520)

    return () => {
      window.clearTimeout(startDelay)
      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [activeScene.target, replaySeed, step])

  useEffect(() => {
    setCreateDropdownOpen(false)
    setCreateSelectedToken('USDC')

    if (!(step === 'create' && activeScene.target === 'token')) {
      return
    }

    const openTimer = window.setTimeout(() => {
      setCreateDropdownOpen(true)
    }, 520)

    const settleTimer = window.setTimeout(() => {
      setCreateSelectedToken('USDC')
    }, 760)

    return () => {
      window.clearTimeout(openTimer)
      window.clearTimeout(settleTimer)
    }
  }, [activeScene.target, replaySeed, step])

  useEffect(() => {
    const supportsDetailsToggle = step === 'confirm' || step === 'release' || step === 'abort'

    if (!supportsDetailsToggle) {
      setDetailsPanelOpen(false)
      return
    }

    if (activeScene.target === 'purchaseId') {
      setDetailsPanelOpen(false)
      return
    }

    if (activeScene.target !== 'showDetails') {
      setDetailsPanelOpen(true)
      return
    }

    setDetailsPanelOpen(false)
    const revealTimer = window.setTimeout(() => {
      setDetailsPanelOpen(true)
    }, 220)

    return () => {
      window.clearTimeout(revealTimer)
    }
  }, [activeScene.target, replaySeed, step])

  const handleReplay = () => {
    setReplaySeed((value) => value + 1)
  }

  const handleBack = () => {
    if (currentIndex > 0) {
      onStepChange(guideStepOrder[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (currentIndex < guideStepOrder.length - 1) {
      onStepChange(guideStepOrder[currentIndex + 1])
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-dark-800/50">
          {guideStepOrder.map((item) => {
            const candidate = slides[item]
            const isActive = item === step
            return (
              <button
                key={item}
                type="button"
                onClick={() => onStepChange(item)}
                className={cx(
                  'w-full rounded-2xl border p-4 text-left transition-all',
                  isActive
                    ? candidate.activeStepClasses
                    : 'border-slate-200 bg-slate-50 text-secondary-700 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-dark-900/40 dark:text-dark-300 dark:hover:border-slate-600 dark:hover:bg-dark-900/60'
                )}
              >
                <div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] opacity-70">Step {candidate.stepNumber}</p>
                    <p className="mt-1 text-base font-semibold">{candidate.title}</p>
                  </div>
                </div>
                <p className={cx('mt-2 text-sm', isActive ? candidate.activeStepRoleClasses : 'text-secondary-500 dark:text-dark-400')}>
                  {candidate.role}
                </p>
              </button>
            )
          })}
        </div>

        <div className="space-y-4 rounded-[32px] border border-slate-200 bg-panel/70 p-4 shadow-sm backdrop-blur-sm dark:border-slate-700/50 md:p-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-700 dark:bg-dark-900/40 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{slide.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-600 dark:text-dark-300">{slide.pageDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReplay}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-white dark:border-slate-600 dark:text-dark-200 dark:hover:bg-dark-800"
              >
                {isPlaying ? 'Replaying...' : 'Replay animation'}
              </button>
              <Link
                href={slide.realPageHref}
                className={cx('rounded-xl px-4 py-2 text-sm font-semibold transition-colors', slide.actionButtonClasses)}
              >
                {slide.realPageLabel}
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-primary-500/15 bg-transparent p-0 dark:border-slate-700/40">
            <div ref={slideViewportRef} className="relative rounded-[28px] bg-transparent">
              <SlideMock
                slideId={step}
                sceneIndex={sceneIndex}
                activeTarget={activeScene.target}
                typedSellerValue={typedSellerValue}
                typedPurchaseIdValue={typedPurchaseIdValue}
                typedPriceValue={typedPriceValue}
                typedCollateralValue={typedCollateralValue}
                createDropdownOpen={createDropdownOpen}
                createSelectedToken={createSelectedToken}
                detailsPanelOpen={detailsPanelOpen}
              />
              {cursorPosition ? <FakeCursor target={{ left: `${cursorPosition.left}px`, top: `${cursorPosition.top}px` }} pulseKey={`${step}-${sceneIndex}-${activeScene.target}`} /> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-700 dark:bg-dark-900/40">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-secondary-500 dark:text-dark-400">Scene {sceneIndex + 1} of {slide.scenes.length}</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${step}-${sceneIndex}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-2 max-w-3xl text-base leading-7 text-secondary-700 dark:text-dark-200"
                  >
                    {activeScene.caption}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentIndex === 0}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-secondary-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-600 dark:text-dark-200 dark:hover:bg-dark-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIndex === guideStepOrder.length - 1}
                  className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-secondary-900 dark:hover:bg-slate-100"
                >
                  Next slide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}