import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

// Stat icons
const TransactionIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)

// Removed VolumeIcon per request

const CountriesIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const UptimeIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SecurityIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

function CountUp({ end, duration = 2000, prefix = '', suffix = '', decimals = 0 }: CountUpProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(end * easeOutQuart)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, isVisible])

  const formatNumber = (num: number) => {
    const rounded = Number(num.toFixed(decimals))
    return rounded.toLocaleString()
  }

  return (
    <div ref={ref} className="font-bold text-3xl md:text-4xl text-secondary-900 dark:text-white">
      {prefix}{formatNumber(count)}{suffix}
    </div>
  )
}

export default function StatsSection() {
  const stats = [
    {
      icon: TransactionIcon,
      value: 1250000,
      suffix: '+',
      label: 'Transactions Processed',
      description: 'Secure transactions completed',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: UsersIcon,
      value: 45000,
      suffix: '+',
      label: 'Active Users',
      description: 'Global community members',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: () => null,
      value: 580,
      suffix: 'M+',
      prefix: '$',
      label: 'Total Volume',
      description: 'In transaction value',
      color: 'from-purple-500 to-violet-500'
    },
    {
      icon: CountriesIcon,
      value: 127,
      suffix: '+',
      label: 'Countries Supported',
      description: 'Worldwide coverage',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: UptimeIcon,
      value: 99.9,
      suffix: '%',
      decimals: 1,
      label: 'Uptime Guarantee',
      description: 'Always available',
      color: 'from-teal-500 to-cyan-500'
    },
    {
      icon: SecurityIcon,
      value: 0,
      label: 'Security Breaches',
      description: 'Zero incidents to date',
      color: 'from-indigo-500 to-blue-500'
    }
  ]

  return (
    <section className="py-24 relative overflow-hidden bg-transparent dark:bg-dark-900/50">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
            Platform Statistics
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-secondary-900 dark:text-white mb-6"
          >
            Trusted by Millions
            <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent"> Worldwide</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-secondary-600 dark:text-dark-300 max-w-3xl mx-auto"
          >
            Our platform continues to grow and evolve, serving users across the globe 
            with unmatched security, speed, and reliability.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-8 rounded-2xl border border-primary-500/20 bg-white/70 dark:bg-dark-800/30 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-dark-800/50 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon />
              </div>

              {/* Stat Value */}
              <CountUp
                end={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.decimals}
              />

              {/* Label and Description */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">{stat.label}</h3>
                <p className="text-secondary-600 dark:text-dark-400 text-sm">{stat.description}</p>
              </div>

              {/* Hover Effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${stat.color.replace('to-', 'to-').replace('from-', 'from-')} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border border-primary-500/20 rounded-2xl p-8 backdrop-blur-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                Enterprise Grade Security
              </h3>
              <p className="text-secondary-600 dark:text-dark-300">
                Audited by top security firms and trusted by enterprises worldwide.
              </p>
            </div>
            
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
                <span className="text-sm text-secondary-600 dark:text-dark-400">99.9% Uptime</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                </div>
                <span className="text-sm text-secondary-600 dark:text-dark-400">SOC 2 Compliant</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span className="text-sm text-secondary-600 dark:text-dark-400">Audited Smart Contracts</span>
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="flex justify-center md:justify-end items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-secondary-900 dark:text-white font-medium">All Systems Operational</span>
              </div>
              <p className="text-secondary-600 dark:text-dark-400 text-sm">
                Real-time status monitoring and incident response
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
