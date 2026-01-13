import { motion } from 'framer-motion'
import Layout from '@/components/Layout'

const ShieldCheckIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const ZapIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const GlobeIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
  </svg>
)

const CodeIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
)

const CpuChipIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

const ChartBarIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

export default function Features() {
  const features = [
    {
      icon: ShieldCheckIcon,
      title: "Enterprise Security",
      description: "Military-grade encryption and multi-signature protection",
      details: [
        "AES-256 end-to-end encryption",
        "Multi-signature wallet technology",
        "Cold storage integration",
        "Biometric authentication",
        "Smart contract audits by leading firms"
      ],
      color: "from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white"
    },
    {
      icon: ZapIcon,
      title: "Lightning Fast",
      description: "Sub-second transaction processing with optimized infrastructure",
      details: [
        "Layer 2 scaling solutions",
        "Parallel transaction processing",
        "Optimized gas fee management",
        "Real-time confirmation",
        "High-frequency trading support"
      ],
      color: "from-slate-100 to-slate-200 dark:from-slate-500 dark:to-slate-600 text-slate-800 dark:text-white"
    },
    {
      icon: GlobeIcon,
      title: "Global Reach",
      description: "Available worldwide with 24/7 support and localization",
      details: [
        "200+ countries supported",
        "Multi-currency processing",
        "Local compliance framework",
        "24/7 customer support",
        "Regulatory compliance built-in"
      ],
      color: "from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 text-slate-800 dark:text-white"
    },
    {
      icon: CodeIcon,
      title: "Developer Friendly",
      description: "Comprehensive APIs and SDKs for seamless integration",
      details: [
        "RESTful API with GraphQL support",
        "SDKs for 15+ programming languages",
        "Comprehensive documentation",
        "Sandbox environment",
        "Webhook support for real-time updates"
      ],
      color: "from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-800 dark:text-white"
    },
    {
      icon: CpuChipIcon,
      title: "Smart Automation",
      description: "AI-powered transaction optimization and fraud detection",
      details: [
        "Machine learning fraud detection",
        "Automated transaction routing",
        "Smart contract automation",
        "Risk assessment algorithms",
        "Predictive analytics dashboard"
      ],
      color: "from-slate-100 to-slate-200 dark:from-slate-500 dark:to-slate-600 text-slate-800 dark:text-white"
    },
    {
      icon: ChartBarIcon,
      title: "Advanced Analytics",
      description: "Real-time insights and comprehensive reporting tools",
      details: [
        "Real-time transaction monitoring",
        "Customizable reporting suite",
        "Business intelligence tools",
        "Export capabilities",
        "Compliance reporting automation"
      ],
      color: "from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 text-slate-800 dark:text-white"
    }
  ]

  const techSpecs = [
    { label: "Transaction Throughput", value: "100,000+ TPS" },
    { label: "Latency", value: "<100ms" },
    { label: "Uptime", value: "99.99%" },
    { label: "Security Level", value: "Bank Grade" },
    { label: "API Response Time", value: "<50ms" },
    { label: "Supported Blockchains", value: "15+" }
  ]

  return (
    <Layout>
      <div className="min-h-screen pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6">
              Platform Features
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Built for the
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent"> Future</span>
            </h1>
            <p className="text-xl text-dark-300 max-w-3xl mx-auto">
              Explore the building blocks behind Parinum—escrowed, collateralised payments on the EVM with self-custody.
            </p>
          </motion.div>

          {/* Technical Specifications */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-20"
          >
            {techSpecs.map((spec, index) => (
              <div key={spec.label} className="text-center p-6 bg-white/50 dark:bg-dark-800/30 backdrop-blur-sm border border-primary-500/20 rounded-xl">
                <div className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">{spec.value}</div>
                <div className="text-secondary-600 dark:text-dark-400 text-sm">{spec.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group p-8 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl hover:bg-white/90 dark:hover:bg-dark-800/70 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon />
                </div>
                
                <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-secondary-600 dark:text-dark-300 mb-6 leading-relaxed">{feature.description}</p>
                
                <ul className="space-y-3">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center text-secondary-600 dark:text-dark-400">
                      <div className="w-2 h-2 bg-primary-400 rounded-full mr-3 flex-shrink-0" />
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Integration Examples */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-white/40 to-slate-100/40 dark:from-slate-800/20 dark:to-slate-700/20 border border-primary-500/20 rounded-2xl p-8 backdrop-blur-sm"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-4">
                Easy Integration
              </h2>
              <p className="text-secondary-600 dark:text-dark-300 max-w-2xl mx-auto">
                Get started with Parinum in minutes with our simple APIs and comprehensive documentation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/70 dark:bg-dark-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">JavaScript SDK</h3>
                <div className="bg-slate-50 dark:bg-dark-900/50 rounded-lg p-4 font-mono text-sm text-green-600 dark:text-green-400">
                  <div className="text-secondary-500 dark:text-dark-500">{'// Install Parinum SDK'}</div>
                  <div className="text-blue-600 dark:text-blue-400">npm install</div> @parinum/sdk
                  <br /><br />
                  <div className="text-secondary-500 dark:text-dark-500">{'// Initialize client'}</div>
                  <div className="text-purple-600 dark:text-purple-400">const</div> parinum = <div className="text-yellow-600 dark:text-yellow-400">new</div> <div className="text-blue-600 dark:text-blue-400">Parinum</div>(apiKey)
                  <br />
                  <div className="text-purple-600 dark:text-purple-400">const</div> payment = <div className="text-purple-600 dark:text-purple-400">await</div> parinum.<div className="text-blue-600 dark:text-blue-400">createEscrow</div>({'{'}
                  <br />
                  &nbsp;&nbsp;amount: <div className="text-orange-600 dark:text-orange-400">100</div>,
                  <br />
                  &nbsp;&nbsp;currency: <div className="text-green-600 dark:text-green-400">&apos;USD&apos;</div>
                  <br />
                  {'}'})
                </div>
              </div>

              <div className="bg-white/70 dark:bg-dark-800/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">REST API</h3>
                <div className="bg-slate-50 dark:bg-dark-900/50 rounded-lg p-4 font-mono text-sm text-green-600 dark:text-green-400">
                  <div className="text-blue-600 dark:text-blue-400">POST</div> /api/v1/payments
                  <br />
                  <div className="text-yellow-600 dark:text-yellow-400">Authorization:</div> Bearer {'{'}token{'}'}
                  <br />
                  <div className="text-yellow-600 dark:text-yellow-400">Content-Type:</div> application/json
                  <br /><br />
                  {'{'}
                  <br />
                  &nbsp;&nbsp;<div className="text-blue-600 dark:text-blue-400">&quot;amount&quot;</div>: <div className="text-orange-600 dark:text-orange-400">100</div>,
                  <br />
                  &nbsp;&nbsp;<div className="text-blue-600 dark:text-blue-400">&quot;currency&quot;</div>: <div className="text-green-600 dark:text-green-400">&quot;USD&quot;</div>,
                  <br />
                  &nbsp;&nbsp;<div className="text-blue-600 dark:text-blue-400">&quot;recipient&quot;</div>: <div className="text-green-600 dark:text-green-400">&quot;0x...&quot;</div>
                  <br />
                  {'}'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
