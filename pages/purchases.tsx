import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import { useRouter } from 'next/router'

// Removed shield icon per request

const PlusIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const DocumentTextIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const SmartContractIcon = () => (
  <svg 
    className="w-10 h-10 mb-3 text-white" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const TokenIcon = () => (
  <svg 
    className="w-10 h-10 mb-3 text-white" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const PadlockIcon = () => (
  <svg 
    className="w-10 h-10 mb-3 text-white" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const ShieldIcon = () => (
  <svg 
    className="w-10 h-10 mb-3 text-white" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

export default function Purchases() {
  const router = useRouter()

  const purchaseActions = [
    {
      id: 'create',
      title: 'Create Purchase',
      description: 'Start a new secure escrow transaction with buyer protection',
      icon: <PlusIcon />,
      color: 'from-slate-200 to-slate-300 dark:from-slate-500 dark:to-slate-600 text-slate-800 dark:text-white',
      hoverColor: 'hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700',
      shadowColor: 'hover:shadow-slate-500/25',
      href: '/create-purchase'
    },
    {
      id: 'confirm',
      title: 'Confirm Purchase',
      description: 'Sellers can confirm and lock collateral for buyer orders',
      icon: <CheckIcon />,
      color: 'from-slate-200 to-slate-300 dark:from-slate-500 dark:to-slate-600 text-slate-800 dark:text-white',
      hoverColor: 'hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700',
      shadowColor: 'hover:shadow-slate-500/25',
      href: '/confirm-purchase'
    },
    {
      id: 'release',
      title: 'Release Funds',
      description: 'Buyers can release escrowed funds to complete transactions',
      icon: <RefreshIcon />,
      color: 'from-slate-200 to-slate-300 dark:from-slate-500 dark:to-slate-600 text-slate-800 dark:text-white',
      hoverColor: 'hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700',
      shadowColor: 'hover:shadow-slate-500/25',
      href: '/release-purchase'
    },
    {
      id: 'abort',
      title: 'Abort Purchase',
      description: 'Cancel transactions and refund all parties securely',
      icon: <XIcon />,
      color: 'from-slate-200 to-slate-300 dark:from-slate-500 dark:to-slate-600 text-slate-800 dark:text-white',
      hoverColor: 'hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700',
      shadowColor: 'hover:shadow-slate-500/25',
      href: '/abort-purchase'
    },
    {
      id: 'logs',
      title: 'Transaction Logs',
      description: 'View detailed history and status of your transactions',
      icon: <DocumentTextIcon />,
      color: 'from-slate-200 to-slate-300 dark:from-slate-500 dark:to-slate-600 text-slate-800 dark:text-white',
      hoverColor: 'hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700',
      shadowColor: 'hover:shadow-slate-500/25',
      href: '/logs-purchase'
    }
  ]

  const features = [
    {
      title: 'Escrow Protection',
      description: 'Funds are held securely until both parties fulfill their obligations',
      icon: <ShieldIcon />
    },
    {
      title: 'Collateral System',
      description: 'Sellers lock collateral to guarantee delivery and build trust',
      icon: <PadlockIcon />
    },
    {
      title: 'Multi-Token Support',
      description: 'Support for ETH, DAI, WBTC, USDC and other ERC-20 tokens',
      icon: <TokenIcon />
    },
    {
      title: 'Transparent Logs',
      description: 'Complete transaction history with blockchain verification',
      icon: <SmartContractIcon />
    }
  ]

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Icon removed */}
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
              Secure Purchases
            </h1>
            <p className="text-xl text-secondary-600 dark:text-dark-300 max-w-3xl mx-auto">
              Create, manage, and track secure escrow transactions with built-in buyer and seller protection
            </p>
          </motion.div>

          {/* Purchase Actions Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            {purchaseActions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 * index } }}
                transition={{ type: 'tween', duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.995, transition: { duration: 0.08 } }}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(action.href);
                }}
                className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-6 cursor-pointer hover:border-primary-500/40 group hover:bg-white/90 dark:hover:bg-dark-800/70"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 bg-gradient-to-r ${action.color} rounded-xl`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {action.title}
                    </h3>
                    <p className="text-secondary-600 dark:text-dark-300 text-sm leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-dark-700/50 rounded-lg flex items-center justify-center group-hover:bg-primary-500/20">
                    <svg className="w-4 h-4 text-secondary-400 dark:text-dark-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4 } }}
            transition={{ type: 'tween', duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.997, transition: { duration: 0.08 } }}
            className="bg-white/70 dark:bg-dark-800/50 border border-primary-500/20 rounded-2xl p-8 mb-12 backdrop-blur-sm"
          >
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white text-center mb-8">Why Choose Parinum Purchases?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + (index * 0.1) }}
                  className="text-center"
                >
                  <div className="flex justify-center text-secondary-900 dark:text-white">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-secondary-600 dark:text-dark-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.6 } }}
            transition={{ type: 'tween', duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.997, transition: { duration: 0.08 } }}
            className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl p-8"
          >
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white text-center mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white text-xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">Create Purchase</h3>
                <p className="text-sm text-secondary-600 dark:text-dark-300">Buyer creates a purchase order with escrow funds and collateral requirements</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white text-xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">Seller Confirms</h3>
                <p className="text-sm text-secondary-600 dark:text-dark-300">Seller reviews and confirms the order by locking their collateral</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white text-xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">Delivery</h3>
                <p className="text-sm text-secondary-600 dark:text-dark-300">Seller delivers goods/services while funds remain safely in escrow</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 rounded-full flex items-center justify-center text-slate-800 dark:text-white text-xl font-bold mx-auto mb-4">4</div>
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">Release Funds</h3>
                <p className="text-sm text-secondary-600 dark:text-dark-300">Buyer confirms receipt and releases funds to complete the transaction</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Start CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-12"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                router.push('/create-purchase');
              }}
              className="bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white py-4 px-12 rounded-xl font-semibold text-lg transition-colors duration-300 hover:from-slate-300 hover:to-slate-400 dark:hover:from-slate-700 dark:hover:to-slate-800 shadow-lg hover:shadow-slate-500/25"
            >
              Create Your First Purchase
            </motion.button>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
