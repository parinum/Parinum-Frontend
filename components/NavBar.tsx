import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ParinumLogo from '@/icons/parinum.svg'
import { useRouter } from 'next/router'

// Icons (simplified versions)
const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

interface NavBarProps {
  children?: React.ReactNode
}

export default function NavBar({ children }: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const connectWallet = async () => {
    try {
      // Wallet connection logic will be implemented later
      setIsWalletConnected(true)  
    } catch (error) {
      console.error("Failed to connect wallet", error)
    }
  }

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Purchases', href: '/purchases' },
    { name: 'Staking', href: '/withdraw-dividend' },
  { name: 'PRM', href: '/psc-funding' },
    { name: 'Governance', href: '/governance' },
  ]

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md shadow-lg' : 'backdrop-blur-sm'
      }`} style={{ backgroundColor: scrolled ? 'rgba(16, 28, 46, 0.95)' : 'rgba(16, 28, 46, 0.90)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-1 group">
              <Image src={ParinumLogo} alt="Parinum logo" width={36} height={36} priority />
              <span className="text-xl font-bold text-white font-sans">Parinum</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg hover:bg-white/10 ${
                    router.pathname === item.href
                      ? 'text-slate-300 bg-white/10'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Wallet Connection Button */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={connectWallet}
                className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 btn-glow ${
                  isWalletConnected
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-white shadow-lg navbar-wallet-btn'
                }`}
              >
                {isWalletConnected ? 'Connected' : 'Connect Wallet'}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden backdrop-blur-md border-t border-white/10" style={{ backgroundColor: 'rgba(16, 28, 46, 0.95)' }}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-lg transition-all duration-300 ${
                    router.pathname === item.href
                      ? 'text-slate-300 bg-white/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={connectWallet}
                className={`w-full mt-4 px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                  isWalletConnected
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-white navbar-wallet-btn'
                }`}
              >
                {isWalletConnected ? 'Connected' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        )}
      </nav>
      {children}
    </>
  )
}
