import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import Link from 'next/link'

const StepNumber = ({ number }: { number: number }) => (
  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
    {number}
  </div>
)

const ArrowRightIcon = () => (
  <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

const ShieldCheckIcon = () => (
  <svg className="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const LockClosedIcon = () => (
  <svg className="w-12 h-12 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const CurrencyDollarIcon = () => (
  <svg className="w-12 h-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default function HowToPurchase() {
  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
              How It Works
            </h1>
            <p className="text-xl text-secondary-600 dark:text-dark-300 max-w-2xl mx-auto">
              Parinum uses a double-sided collateral model to ensure trustless, secure transactions between buyers and sellers.
            </p>
          </motion.div>

          {/* Concept Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center"
            >
              <div className="flex justify-center"><ShieldCheckIcon /></div>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">Trustless</h3>
              <p className="text-secondary-600 dark:text-dark-400">
                No middleman required. Smart contracts handle the escrow logic automatically.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-dark-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center"
            >
              <div className="flex justify-center"><LockClosedIcon /></div>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">Collateralized</h3>
              <p className="text-secondary-600 dark:text-dark-400">
                Both parties lock collateral to incentivize honest behavior and fulfillment.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-dark-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center"
            >
              <div className="flex justify-center"><CurrencyDollarIcon /></div>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">Secure Payment</h3>
              <p className="text-secondary-600 dark:text-dark-400">
                Funds are only released when the buyer confirms receipt of the goods or service.
              </p>
            </motion.div>
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute left-5 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />

            {/* Step 1: Buyer Creates */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 md:gap-10"
            >
              <StepNumber number={1} />
              <Link href="/create-purchase" className="flex-1 group">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="h-full bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-blue-500"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-secondary-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Buyer Initiates Purchase</h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium w-fit">
                      Payment + Collateral
                    </span>
                  </div>
                  <p className="text-secondary-600 dark:text-dark-300 mb-6">
                    The buyer starts by configuring the purchase agreement. You&apos;ll need the seller&apos;s wallet address.
                    To ensure fairness, you will deposit the <strong>Purchase Price</strong> plus a <strong>Collateral Amount</strong>.
                  </p>
                  <div className="text-blue-600 dark:text-blue-400 font-semibold flex items-center group-hover:underline">
                    Go to Create Purchase <ArrowRightIcon />
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Step 2: Seller Confirms */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 md:gap-10"
            >
              <StepNumber number={2} />
              <Link href="/confirm-purchase" className="flex-1 group">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="h-full bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-purple-500"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-secondary-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Seller Confirms</h3>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full text-sm font-medium w-fit">
                      Collateral Deposit
                    </span>
                  </div>
                  <p className="text-secondary-600 dark:text-dark-300 mb-6">
                    The seller reviews the contract terms. To accept, the seller must also lock the <strong>Collateral Amount</strong>.
                    This state (&quot;Confirmed&quot;) signals that the order is active and the seller can proceed with delivery.
                  </p>
                  <div className="text-blue-600 dark:text-blue-400 font-semibold flex items-center group-hover:underline">
                    Go to Confirm Purchase <ArrowRightIcon />
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Step 3: Delivery & Release */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 md:gap-10"
            >
              <StepNumber number={3} />
              <Link href="/release-purchase" className="flex-1 group">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="h-full bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-green-500"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-secondary-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Delivery & Release</h3>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full text-sm font-medium w-fit">
                      Funds Distributed
                    </span>
                  </div>
                  <p className="text-secondary-600 dark:text-dark-300 mb-6">
                    Once the buyer receives the item or service, they unlock the funds. 
                    The smart contract sends the <strong>Payment + Collateral</strong> to the Seller, 
                    and returns the <strong>Collateral</strong> to the Buyer.
                  </p>
                  <div className="text-blue-600 dark:text-blue-400 font-semibold flex items-center group-hover:underline">
                    Go to Release Purchase <ArrowRightIcon />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Edge Cases */}
          <Link href="/abort-purchase" className="block mt-12 group">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               whileHover={{ scale: 1.02 }}
               viewport={{ once: true }}
               className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/20 cursor-pointer shadow-sm hover:shadow-md transition-all"
            >
               <h4 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2 group-hover:text-red-900 dark:group-hover:text-red-100 transition-colors">Change of Plans?</h4>
               <p className="text-red-700 dark:text-red-300">
                 If the seller hasn&apos;t confirmed yet, the buyer can <strong>Abort</strong> the purchase to retrieve their funds immediately. 
                 <br/>
                 <span className="font-semibold mt-2 inline-block group-hover:underline">
                   Go to Abort Page &rarr;
                 </span>
               </p>
            </motion.div>
          </Link>

        </div>
      </div>
    </Layout>
  )
}
