import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import Parinum3D from '../icons/3d parinumn.png'

export default function ParinumCards() {
  const cards = [
    {
      title: 'Escrowed, collateralised payments',
      description: 'Funds are held in escrow and sellers lock collateral until delivery conditions are met.'
    },
    {
      title: 'Built on the EVM',
      description: 'Composable smart contracts with self-custody and on-chain enforcement across EVM networks.'
    },
    {
      title: 'On-chain transparency',
      description: 'End-to-end auditability with dispute resolution via verifiable logs and contract rules.'
    },
    {
      title: 'Multi-token support',
      description: 'Use ETH and ERC-20 tokens like DAI, WBTC, and USDC in escrow flows.'
    },
    {
      title: 'Participate in PRM ICO',
      description: 'Join the Parinum ecosystem. Click here to view the ICO details and buy PRM tokens.',
      span: true,
      href: '/prm-funding',
      cta: 'Buy PRM Tokens'
    }
  ]

  return (
    <section className="pt-2 pb-10 md:pt-4 md:pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                opacity: { duration: 0.5, delay: i * 0.05 },
                y: { duration: 0.5, delay: i * 0.05 },
                scale: { type: 'tween', duration: 0.12, ease: 'easeOut' }
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative overflow-hidden group rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300 will-change-transform ${
                c.span 
                  ? 'md:col-span-2 lg:col-span-4 bg-gradient-to-r from-white via-slate-50 to-slate-100 dark:from-gray-800 dark:via-gray-900 dark:to-black border-slate-200 dark:border-gray-700 hover:shadow-2xl hover:border-slate-300 dark:hover:border-gray-600' 
                  : 'bg-white/70 dark:bg-dark-800/40 border-primary-500/20 hover:bg-white/90 dark:hover:bg-dark-800/60 hover:shadow-xl'
              }`}
            >
              {c.href ? (
                <Link href={c.href} className="relative z-10 block p-8 h-full w-full flex flex-col md:flex-row items-center justify-between gap-8 group">
                  <div className="text-left flex-1 min-w-[200px]">
                    <h3 className="text-2xl md:text-3xl text-secondary-900 dark:text-white font-bold mb-3 tracking-tight">
                      {c.title}
                    </h3>
                    <p className="text-secondary-600 dark:text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl">
                      {c.description}
                    </p>
                  </div>

                  <motion.div 
                    className="relative w-56 h-56 md:w-80 md:h-80 flex-shrink-0 order-first md:order-none mb-6 md:mb-0"
                    animate={{ y: [0, -12, 0], rotate: [0, 2, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  >
                     <Image src={Parinum3D} alt="Parinum Token" fill className="object-contain drop-shadow-2xl" priority />
                  </motion.div>

                  <div className="flex-shrink-0">
                     <motion.span 
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 dark:text-gray-900 dark:bg-white dark:hover:bg-gray-50 transition-colors shadow-lg cursor-pointer"
                     >
                       {c.cta}
                       <svg className="ml-2 -mr-1 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                       </svg>
                     </motion.span>
                  </div>
                </Link>
              ) : (
                <div className="p-6 h-full w-full relative z-10">
                  <h3 className="text-secondary-900 dark:text-white font-semibold mb-2">{c.title}</h3>
                  <p className="text-secondary-600 dark:text-dark-300 text-sm leading-relaxed">{c.description}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
