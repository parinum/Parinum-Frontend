import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
)

const CodeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
)

const RocketIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const BookIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

export default function CTASection() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubmitted(true)
      setTimeout(() => {
        setIsSubmitted(false)
        setEmail('')
      }, 3000)
    }
  }

  const features = [
    'Free API access with 10,000 monthly requests',
    'Comprehensive documentation and tutorials',
    'Community support and regular updates',
    'Sandbox environment for testing',
    'Developer tools and SDKs'
  ]

  const quickStartOptions = [
    {
      icon: RocketIcon,
      title: 'Quick Start',
      description: 'Get up and running in minutes with our guided setup',
      action: 'Start Now',
      href: '/quick-start',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: CodeIcon,
      title: 'API Documentation',
      description: 'Explore our comprehensive API reference and examples',
      action: 'View Docs',
      href: '/docs',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BookIcon,
      title: 'Learn & Build',
      description: 'Follow our step-by-step tutorials and guides',
      action: 'Start Learning',
      href: '/tutorials',
      color: 'from-purple-500 to-violet-500'
    }
  ]

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full bg-gradient-to-r from-primary-500/5 via-secondary-500/5 to-primary-500/5 blur-3xl" />
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-white/90 to-slate-100/90 dark:from-dark-800/80 dark:to-dark-900/80 backdrop-blur-sm border border-primary-500/30 rounded-3xl p-12 relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-3xl" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-400 text-sm font-medium mb-8"
              >
                <span className="w-2 h-2 bg-primary-400 rounded-full mr-2 animate-pulse" />
                Ready to get started?
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-bold text-secondary-900 dark:text-white mb-6"
              >
                Build the Future with
                <br />
                <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent">
                  Parinum Today
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-xl text-secondary-600 dark:text-dark-300 mb-10 max-w-3xl mx-auto"
              >
                Build escrowed, collateralised payment flows with a self-custodial, EVM-native toolkit.
              </motion.p>

              {/* Feature List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto"
              >
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center text-secondary-600 dark:text-dark-300">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <CheckIcon />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </motion.div>

              {/* Newsletter Signup */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
                className="max-w-md mx-auto mb-8"
              >
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 bg-white dark:bg-dark-800/50 border border-primary-500/30 rounded-xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
                    required
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    {isSubmitted ? (
                      <CheckIcon />
                    ) : (
                      <>
                        <span>Get Started</span>
                        <ArrowRightIcon />
                      </>
                    )}
                  </motion.button>
                </form>
                {isSubmitted && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-400 text-sm mt-3 text-center"
                  >
                    Thanks! We&apos;ll send you early access details soon.
                  </motion.p>
                )}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                viewport={{ once: true }}
                className="text-secondary-500 dark:text-dark-400 text-sm"
              >
                No spam, unsubscribe at any time. We respect your privacy.
              </motion.p>
            </div>
          </motion.div>
        </div>

        {/* Quick Start Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {quickStartOptions.map((option, index) => (
            <motion.div
              key={option.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <Link href={option.href}>
                <div className="h-full p-8 bg-white/70 dark:bg-dark-800/30 backdrop-blur-sm border border-primary-500/20 rounded-2xl hover:bg-white/90 dark:hover:bg-dark-800/50 hover:border-primary-500/40 transition-all duration-300 cursor-pointer">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${option.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <option.icon />
                  </div>

                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">{option.title}</h3>
                  <p className="text-secondary-600 dark:text-dark-300 mb-6 leading-relaxed">{option.description}</p>

                  <div className="flex items-center text-primary-600 dark:text-primary-400 font-medium group-hover:text-primary-500 dark:group-hover:text-primary-300 transition-colors duration-200">
                    <span>{option.action}</span>
                    <ArrowRightIcon />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Banner removed per rebrand/simplification */}
      </div>
    </section>
  )
}
