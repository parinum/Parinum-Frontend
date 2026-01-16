import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '@/components/Layout'

const SearchIcon = () => (
  <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: "General",
    question: "What is Parinum?",
    answer: "Parinum is a decentralized payment protocol designed to facilitate trust-minimized crypto transfers using smart contracts and bilateral collateralization. It allows secure exchanges without a trusted third party."
  },
  {
    category: "General",
    question: "Is Parinum free to use?",
    answer: "Yes! Parinum has zero protocol fees. You only pay the standard gas fees required by the blockchain network you are using."
  },
  {
    category: "Security",
    question: "How does the collateral system work?",
    answer: "To ensure safety, the seller locks a collateral amount in the smart contract. This collateral incentivizes the seller to deliver the goods or services. Once the buyer confirms receipt, the funds and collateral are released."
  },
  {
    category: "Security",
    question: "Who holds my funds?",
    answer: "Parinum is non-custodial. Your funds are held in a smart contract on the blockchain, not by Parinum or any central entity. Only the predetermined conditions in the contract can release the funds."
  },
  {
    category: "Usage",
    question: "Which networks satisfy Parinum?",
    answer: "Parinum supports multiple EVM-compatible chains including Ethereum, BSC, Arbitrum, Base, Polygon, Linea, Optimism, and Unichain."
  },
  {
    category: "Usage",
    question: "What tokens can I use?",
    answer: "You can use native tokens (like ETH, BNB, MATIC) and major ERC-20 tokens like USDC, USDT, DAI, and WBTC depending on the network."
  },
  {
    category: "Token",
    question: "What is the PRM token?",
    answer: "PRM is the governance token of the Parinum ecosystem. It allows holders to participate in protocol governance and decision-making processes."
  },
    {
    category: "Usage",
    question: "How do I dispute a transaction?",
    answer: "Parinum is designed to be trust-minimized through bilateral collateral. If a dispute arises, the protocol rules determine the outcome based on the actions taken (or not taken) by both parties, such as the seller failing to deliver or the buyer failing to confirm. Please refer to the documentation for specific dispute scenarios."
  }
]

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen pt-20 pb-12"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-secondary-600 dark:text-dark-300">
              Everything you need to know about the Parinum protocol.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative mb-12">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl text-secondary-900 dark:text-white placeholder-secondary-400 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all duration-200 shadow-sm"
            />
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/70 dark:bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="font-semibold text-secondary-900 dark:text-white pr-8">
                       <span className="text-xs font-mono text-primary-500 mr-2 uppercase tracking-wider">{faq.category}</span>
                       {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 text-secondary-500"
                    >
                      <ChevronDownIcon />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-6 pb-4 text-secondary-600 dark:text-dark-300 border-t border-primary-500/10 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-secondary-500 dark:text-dark-400">No matching questions found.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Layout>
  )
}
