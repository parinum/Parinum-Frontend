import { motion } from 'framer-motion'
import Layout from '@/components/Layout'

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </svg>
)

export default function About() {
  const timeline = [
    {
      year: "2022",
      title: "Foundation",
  description: "Parinum was founded with a vision to bring escrowed, collateralised payments on-chain for real-world commerce."
    },
    {
      year: "2023",
      title: "Alpha Launch",
      description: "First alpha version launched with basic payment functionality and security features."
    },
    {
      year: "2024",
      title: "Series A",
      description: "Completed Series A funding round and expanded team to 50+ professionals."
    },
    {
      year: "2025",
      title: "Global Expansion",
      description: "Launched in 127 countries with full regulatory compliance and enterprise features."
    }
  ]

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder",
      bio: "Former VP of Engineering at Stripe, led payments infrastructure for 500M+ users.",
      image: "/api/placeholder/120/120"
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO & Co-Founder",
      bio: "Ex-Google blockchain engineer, expert in distributed systems and cryptography.",
      image: "/api/placeholder/120/120"
    },
    {
      name: "Dr. Amelia Watson",
      role: "Head of Security",
      bio: "Former cybersecurity lead at Pentagon, PhD in Computer Science from MIT.",
      image: "/api/placeholder/120/120"
    },
    {
      name: "David Kim",
      role: "Head of Product",
      bio: "Former Product Director at Coinbase, launched products used by 100M+ users.",
      image: "/api/placeholder/120/120"
    }
  ]

  const values = [
    {
      title: "Security First",
      description: "We prioritize security above all else, implementing military-grade encryption and rigorous security audits.",
      icon: "🔒"
    },
    {
      title: "Innovation",
      description: "We constantly push the boundaries of what's possible in blockchain and payment technology.",
      icon: "💡"
    },
    {
      title: "Transparency",
      description: "We believe in open communication and transparent operations with our users and partners.",
      icon: "🔍"
    },
    {
      title: "Accessibility",
      description: "We're building technology that's accessible to everyone, regardless of technical expertise.",
      icon: "🌍"
    }
  ]

  const stats = [
    { label: "Team Members", value: "75+" },
    { label: "Countries", value: "127" },
    { label: "Transactions", value: "1.2M+" },
    { label: "Uptime", value: "99.99%" }
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
              About Parinum
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Building the Future of
              <span className="bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent"> Digital Payments</span>
            </h1>
            <p className="text-xl text-dark-300 max-w-3xl mx-auto">
              We're on a mission to make secure, fast, and accessible digital payments 
              available to everyone, everywhere through the power of blockchain technology.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
          >
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-dark-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Mission & Vision */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20"
          >
            <div className="p-8 bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
              <p className="text-dark-300 leading-relaxed">
                To democratize access to secure, fast, and affordable digital payments by 
                leveraging blockchain technology. We believe that everyone deserves access 
                to financial tools that are transparent, secure, and user-friendly.
              </p>
            </div>
            <div className="p-8 bg-dark-800/50 backdrop-blur-sm border border-primary-500/20 rounded-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Our Vision</h2>
              <p className="text-dark-300 leading-relaxed">
                A world where digital payments are as simple as sending a text message, 
                as secure as a bank vault, and as accessible as the internet itself. 
                We're building the infrastructure for the next generation of finance.
              </p>
            </div>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div key={value.title} className="p-6 bg-dark-800/30 backdrop-blur-sm border border-primary-500/20 rounded-xl text-center">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                  <p className="text-dark-400 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-12">Our Journey</h2>
            <div className="space-y-8">
              {timeline.map((event, index) => (
                <div key={event.year} className="flex items-start space-x-8">
                  <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {event.year}
                  </div>
                  <div className="flex-grow p-6 bg-dark-800/30 backdrop-blur-sm border border-primary-500/20 rounded-xl">
                    <h3 className="text-xl font-semibold text-white mb-2">{event.title}</h3>
                    <p className="text-dark-300">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-20"
          >
            <h2 className="text-3xl font-bold text-white text-center mb-12">Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <div key={member.name} className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <UserIcon />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{member.name}</h3>
                  <p className="text-primary-400 font-medium mb-3">{member.role}</p>
                  <p className="text-dark-400 text-sm leading-relaxed">{member.bio}</p>
                  <div className="flex justify-center space-x-3 mt-4">
                    <a href="#" className="w-8 h-8 bg-dark-700 hover:bg-dark-600 rounded-full flex items-center justify-center text-dark-400 hover:text-white transition-colors duration-200">
                      <TwitterIcon />
                    </a>
                    <a href="#" className="w-8 h-8 bg-dark-700 hover:bg-dark-600 rounded-full flex items-center justify-center text-dark-400 hover:text-white transition-colors duration-200">
                      <LinkedInIcon />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-center bg-gradient-to-r from-slate-800/20 to-slate-700/20 border border-slate-500/20 rounded-2xl p-12 backdrop-blur-sm"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Join Our Mission</h2>
            <p className="text-dark-300 mb-8 max-w-2xl mx-auto">
              We're always looking for talented individuals who share our passion for 
              building the future of digital payments. Explore career opportunities and 
              become part of our growing team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                View Open Positions
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-dark-700 hover:bg-dark-600 text-white font-semibold rounded-xl transition-colors duration-200"
              >
                Contact Us
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  )
}
