import { motion } from 'framer-motion'
import Link from 'next/link'
 

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

const PlayIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

export default function HeroSection() {
  

  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-24 pb-4 md:pt-32 md:pb-6">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-slate-700/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-slate-800/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-slate-700/5 to-slate-800/5 rounded-full blur-3xl animate-pulse" />
      </div>

  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0">
        <div className="text-center">
          {/* Badge removed per request */}

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-slate-400 via-slate-500 to-slate-600 bg-clip-text text-transparent">
              Secure Payments
            </span>
            <br />
            with Parinum
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed"
          >
            Parinum enables collateralised escrow on the EVM. Self-custodial, transparent, and composable for real-world trades.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4 md:mb-6"
          >
            <Link href="/purchases">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-4 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 hero-primary-btn"
              >
                <span>Get Started</span>
                <ArrowRightIcon />
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 bg-black/50 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-black/70 transition-all duration-300 flex items-center space-x-2 hero-secondary-btn"
            >
              <PlayIcon />
              <span>Watch Demo</span>
            </motion.button>
          </motion.div>

          {/* Stats removed per request */}
        </div>
      </div>
    </section>
  )
}
