import { motion } from 'framer-motion'
import { useState } from 'react'

// Feature icons
const SecurityIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const SpeedIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const DecentralizedIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
)

const ScalabilityIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
)

const IntegrationIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const AnalyticsIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0)

  const features = [
    {
      icon: SecurityIcon,
      title: "Advanced Security",
      subtitle: "Military-grade encryption",
      description: "Multi-signature wallets, smart contract audits, and end-to-end encryption ensure your funds are always protected.",
      details: [
        "Multi-signature wallet security",
        "Smart contract audited by leading firms",
        "End-to-end encryption for all transactions",
        "Cold storage for maximum protection"
      ],
      color: "from-slate-600 to-slate-700"
    },
    {
      icon: SpeedIcon,
      title: "Lightning Speed",
      subtitle: "Sub-second processing",
      description: "Experience instant transactions with our optimized blockchain infrastructure and Layer 2 scaling solutions.",
      details: [
        "Sub-second transaction confirmation",
        "Layer 2 scaling technology",
        "Optimized gas fee management",
        "Real-time transaction tracking"
      ],
      color: "from-slate-500 to-slate-600"
    },
    {
      icon: DecentralizedIcon,
      title: "True Decentralization",
      subtitle: "No single point of failure",
      description: "Built on a fully decentralized network with distributed governance and community-driven development.",
      details: [
        "Distributed network architecture",
        "Community governance system",
        "Open-source development",
        "Transparent operation protocols"
      ],
      color: "from-slate-700 to-slate-800"
    },
    {
      icon: ScalabilityIcon,
      title: "Infinite Scalability",
      subtitle: "Grows with your needs",
      description: "Handle millions of transactions per second with our innovative sharding and parallel processing technology.",
      details: [
        "Horizontal scaling capabilities",
        "Sharding technology implementation",
        "Parallel transaction processing",
        "Auto-scaling infrastructure"
      ],
      color: "from-slate-600 to-slate-700"
    },
    {
      icon: IntegrationIcon,
      title: "Easy Integration",
      subtitle: "Developer-friendly APIs",
  description: "Integrate Parinum into your applications with our comprehensive SDKs and developer tools.",
      details: [
        "RESTful API with full documentation",
        "SDKs for all major languages",
        "Webhook support for real-time updates",
        "Sandbox environment for testing"
      ],
      color: "from-slate-500 to-slate-600"
    },
    {
      icon: AnalyticsIcon,
      title: "Advanced Analytics",
      subtitle: "Real-time insights",
      description: "Get detailed insights into your transactions with our powerful analytics dashboard and reporting tools.",
      details: [
        "Real-time transaction monitoring",
        "Comprehensive reporting suite",
        "Custom analytics dashboards",
        "Export capabilities for compliance"
      ],
      color: "from-slate-700 to-slate-800"
    }
  ]

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-secondary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6"
          >
            Features
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-white mb-6"
          >
            Built for the Future of
            <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent"> Finance</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-dark-300 max-w-3xl mx-auto"
          >
            Discover the powerful features that make Parinum a robust escrow and collateral platform on the EVM.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              onMouseEnter={() => setActiveFeature(index)}
              className={`group relative p-8 rounded-2xl border border-primary-500/20 bg-dark-800/30 backdrop-blur-sm hover:bg-dark-800/50 transition-all duration-500 cursor-pointer ${
                activeFeature === index ? 'ring-2 ring-primary-500/50 transform scale-105' : ''
              }`}
            >
              {/* Feature Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon />
              </div>

              {/* Feature Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-primary-400 text-sm font-medium mb-3">{feature.subtitle}</p>
                  <p className="text-dark-300 leading-relaxed">{feature.description}</p>
                </div>

                {/* Feature Details */}
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ 
                    opacity: activeFeature === index ? 1 : 0,
                    height: activeFeature === index ? 'auto' : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-primary-500/20">
                    <ul className="space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center text-dark-400 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-3" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-600/5 to-slate-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-2xl p-8 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to experience the future?
            </h3>
            <p className="text-dark-300 mb-6 max-w-2xl mx-auto">
              Build secure, escrowed flows backed by on-chain collateral with Parinum.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Building Today
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
