import { motion } from 'framer-motion'

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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98, transition: { type: 'tween', duration: 0.08, ease: 'easeOut' } }}
              className="p-6 rounded-xl border border-primary-500/20 bg-white/70 dark:bg-dark-800/40 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-dark-800/60 shadow-lg hover:shadow-xl transition-colors transition-shadow duration-200 will-change-transform"
            >
              <h3 className="text-secondary-900 dark:text-white font-semibold mb-2">{c.title}</h3>
              <p className="text-secondary-600 dark:text-dark-300 text-sm leading-relaxed">{c.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
