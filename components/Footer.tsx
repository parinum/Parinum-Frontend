import Link from 'next/link'
import Image from 'next/image'
import ParinumLogo from '@/icons/parinum.svg'
import ParinumDarkLogo from '@/icons/parinum dark.svg'
import { motion } from 'framer-motion'
import { useTheme } from './ThemeProvider'

const XIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const GitHubIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.300 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
)

const TelegramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42l10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l-.002.001l-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15l4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
  </svg>
)

export default function Footer() {
  const { resolvedTheme } = useTheme()
  // Links sections removed per request

  const socialLinks = [
    { name: 'X', href: 'https://x.com/parinumofficial', icon: XIcon },
    { name: 'Telegram', href: 'https://t.me/parinumofficial', icon: TelegramIcon },
    { name: 'GitHub', href: 'https://github.com/parinum/Parinum-Upgradeable', icon: GitHubIcon },
  ]

  return (
    <footer className="bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm border-t border-primary-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <Image 
                src={resolvedTheme === 'light' ? ParinumDarkLogo : ParinumLogo} 
                alt="Parinum logo" 
                width={28} 
                height={28} 
                priority 
              />
              <span className="ml-2.5 text-xl font-medium tracking-normal text-secondary-900 dark:text-white font-sans">Parinum</span>
            </div>
            <p className="text-secondary-600 dark:text-dark-400 mb-6 max-w-md">
              Secure, decentralized payment solutions powered by blockchain technology. 
              Building the future of financial transactions.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-slate-200 dark:bg-dark-800 hover:bg-primary-500 dark:hover:bg-primary-600 rounded-lg flex items-center justify-center text-secondary-600 dark:text-dark-400 hover:text-white dark:hover:text-white transition-all duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Sections removed */}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-500/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-secondary-500 dark:text-dark-400 text-sm mb-4 md:mb-0">
              © 2025 Parinum. All rights reserved.
            </div>
            <Link 
              href="/privacy-policy" 
              className="text-sm text-secondary-500 dark:text-dark-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/faq" 
              className="text-sm text-secondary-500 dark:text-dark-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
