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

const ClockIcon = () => (
  <svg className="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ChartBarIcon = () => (
  <svg className="w-12 h-12 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const LockOpenIcon = () => (
    <svg className="w-12 h-12 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  )

const UserGroupIcon = () => (
  <svg className="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const BanknotesIcon = () => (
  <svg className="w-12 h-12 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)


export default function HowToICO() {
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
              ICO Participation
            </h1>
          </motion.div>

          {/* Concept Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-dark-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center"
            >
              <div className="flex justify-center"><ClockIcon /></div>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">Time-Based Bonus</h3>
              <p className="text-secondary-600 dark:text-dark-400">
                A multiplier (starting at 1.8x) rewards earlier contributions with more tokens.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-dark-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center"
            >
              <div className="flex justify-center"><ChartBarIcon /></div>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">Vested Growth</h3>
              <p className="text-secondary-600 dark:text-dark-400">
                Tokens are vested linearly to align incentives and prevent immediate dumping.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-dark-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center"
            >
              <div className="flex justify-center"><LockOpenIcon /></div>
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">Auto Liquidity</h3>
              <p className="text-secondary-600 dark:text-dark-400">
                After the ICO finishes, liquidity is automatically created on Uniswap V3.
              </p>
            </motion.div>
          </div>

          {/* PRM Utility Section */}
          <div className="mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-bold text-center text-secondary-900 dark:text-white mb-10"
            >
              PRM Token Utility
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-dark-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-center"><UserGroupIcon /></div>
                <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">Governance</h3>
                <p className="text-secondary-600 dark:text-dark-400">
                  Holders of PRM can vote on governance proposals which drive Parinum growth and protocol direction.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-dark-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-center"><BanknotesIcon /></div>
                <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">Staking Rewards</h3>
                <p className="text-secondary-600 dark:text-dark-400">
                  Holders of PRM can also stake their tokens to earn a share of the fees generated by Parinum.
                </p>
              </motion.div>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute left-5 top-8 bottom-8 w-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />

            {/* Step 1: Connect & Prepare */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 md:gap-10"
            >
              <StepNumber number={1} />
              <div className="flex-1 group">
                <motion.div 
                  className="h-full bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">Connect & Prepare</h3>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium w-fit">
                      Wallet Setup
                    </span>
                  </div>
                  <p className="text-secondary-600 dark:text-dark-300">
                    Ensure you have a Web3-compatible wallet like MetaMask installed and sufficient ETH for your contribution plus gas fees.
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Step 2: Contribute ETH */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 md:gap-10"
            >
              <StepNumber number={2} />
              <Link href="/prm-funding" className="flex-1 group">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="h-full bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-purple-500"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-secondary-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Contribute ETH</h3>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded-full text-sm font-medium w-fit">
                      Deposit
                    </span>
                  </div>
                  <p className="text-secondary-600 dark:text-dark-300 mb-6">
                    Navigate to the funding page. Enter the amount of ETH you wish to invest. Your received PRM amount will be calculated based on the current <strong>Time-Based Multiplier</strong>.
                  </p>
                  <div className="text-purple-600 dark:text-purple-400 font-semibold flex items-center group-hover:underline">
                    Go to PRM Funding <ArrowRightIcon />
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Step 3: Claim Tokens */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6 md:gap-10"
            >
              <StepNumber number={3} />
               <Link href="/prm-funding" className="flex-1 group">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="h-full bg-white/50 dark:bg-dark-800/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 cursor-pointer shadow-sm hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-green-500"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-secondary-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Claim Tokens</h3>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-full text-sm font-medium w-fit">
                      Vesting
                    </span>
                  </div>
                  <p className="text-secondary-600 dark:text-dark-300 mb-2">
                    After the ICO concludes, your tokens will vest. A <strong>Cliff Period</strong> applies based on your multiplier, followed by linear release. Return to the dashboard to claim your PRM.
                  </p>
                  <p className="text-secondary-500 dark:text-dark-400 mb-6 text-sm">
                    Lock-up terms scale linearly with your multiplier. A standard 1x contribution has no cliff and vests over 180 days. 
                    The maximum 1.8x multiplier extends this to a 144-day cliff followed by a 324-day vesting period.
                  </p>
                   <div className="text-green-600 dark:text-green-400 font-semibold flex items-center group-hover:underline">
                    Check Dashboard <ArrowRightIcon />
                  </div>
                </motion.div>
              </Link>
            </motion.div>

          </div>
        </div>
      </div>
    </Layout>
  )
}

