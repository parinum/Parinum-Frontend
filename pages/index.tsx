import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Layout from '@/components/Layout'
import HeroSection from '@/components/HeroSection'
import ParinumCards from '@/components/ParinumCards'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="min-h-screen"
      >
        <HeroSection />
        <ParinumCards />
      </motion.div>
    </Layout>
  )
}
