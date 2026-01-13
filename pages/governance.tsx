import { motion } from 'framer-motion'
import Layout from '@/components/Layout'

const LockClosedIcon = () => (
  <svg 
    className="w-16 h-16 text-slate-400 mb-6" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1.5} 
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
    />
  </svg>
)

export default function Governance() {
  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <div className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-slate-500/20 rounded-3xl p-12 flex flex-col items-center">
            <LockClosedIcon />
            <h1 className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6">
              Governance Disabled
            </h1>
            <p className="text-xl text-secondary-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              Governance will be enabled at the end of the ICO.
            </p>
            <div className="mt-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-secondary-500 dark:text-slate-400 text-sm">
                Coming Soon
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  )
}
