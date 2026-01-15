import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ParinumLogo from '@/icons/parinum.svg'
import ParinumDarkLogo from '@/icons/parinum dark.svg'
import EthIcon from 'cryptocurrency-icons/svg/color/eth.svg'
import { useRouter } from 'next/router'
import { useTheme } from './ThemeProvider'
import { ConnectButton } from '@rainbow-me/rainbowkit'

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

const DotsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </svg>
)

const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
    <path strokeLinecap="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.657 6.657-1.414-1.414M7.757 7.757 6.343 6.343m12 0-1.414 1.414M7.757 16.243 6.343 17.657" />
  </svg>
)

const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
    />
  </svg>
)

const AutoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
    <path strokeLinecap="round" d="M8 9h8M9 13h6" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
  </svg>
)

interface NavBarProps {
  children?: React.ReactNode
}

export default function NavBar({ children }: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const { theme, resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Purchases', href: '/how-to-purchase' },
    { name: 'PRM', href: '/prm-funding' },
    { name: 'Staking', href: '/stake-dashboard' },
    { name: 'Governance', href: '/governance' },
  ]

  const appearanceOptions: { value: 'dark' | 'light' | 'system'; label: string; description: string; icon: JSX.Element }[] = [
    { value: 'dark', label: 'Dark', description: 'Dim surfaces, glowing accents', icon: <MoonIcon /> },
    { value: 'light', label: 'Light', description: 'Bright panels and soft borders', icon: <SunIcon /> },
    { value: 'system', label: 'Auto', description: 'Follow your device setting', icon: <AutoIcon /> },
  ]

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'backdrop-blur-md shadow-lg' : 'backdrop-blur-sm'
      }`} style={{ backgroundColor: scrolled ? 'var(--navbar-bg-strong)' : 'var(--navbar-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Image 
                src={resolvedTheme === 'light' ? ParinumDarkLogo : ParinumLogo} 
                alt="Parinum logo" 
                width={28} 
                height={28} 
                priority 
              />
              <span className="ml-2.5 text-xl font-medium tracking-normal text-secondary-900 dark:text-white font-sans">Parinum</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg nav-link ${
                    router.pathname === item.href ? 'is-active' : ''
                  }`}
                  aria-current={router.pathname === item.href ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              {/* Global settings */}
              <div className="relative" ref={settingsRef}>
                <button
                  type="button"
                  aria-label="Open settings"
                  onClick={() => setIsSettingsOpen((open) => !open)}
                  className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <DotsIcon />
                </button>

                {isSettingsOpen && (
                  <div className="absolute right-0 mt-3 w-72 rounded-xl theme-surface-strong backdrop-blur-md shadow-xl z-50">
                    <div className="px-4 pt-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Global settings
                    </div>
                    <div className="px-2 pb-3 space-y-1">
                      {appearanceOptions.map((option) => {
                        const isActive = theme === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setTheme(option.value)
                              setIsSettingsOpen(false)
                            }}
                            className={`flex items-center w-full justify-between px-3 py-2 rounded-lg transition-colors ${
                              isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3 text-left">
                              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                                {option.icon}
                              </span>
                              <div>
                                <div className="text-sm font-semibold">{option.label}</div>
                                <div className="text-xs text-gray-400">
                                  {option.value === 'system' ? `System · ${resolvedTheme} now` : option.description}
                                </div>
                              </div>
                            </div>
                            {isActive && <CheckIcon />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Wallet Connection Button */}
              <div className="hidden md:flex items-center">
                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                className="px-5 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg navbar-wallet-btn hover:opacity-90"
                              >
                                Connect
                              </button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                className="px-5 py-2 rounded-xl font-medium transition-all duration-300 bg-red-500/20 text-red-400 border border-red-500/30"
                              >
                                Wrong network ({chain.id})
                              </button>
                            );
                          }

                          return (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={openChainModal}
                                className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                                title={chain.name}
                              >
                                {chain.hasIcon && (
                                  <div className="w-5 h-5 relative flex items-center justify-center">
                                    {(chain.id === 1 || chain.id === 31337 || chain.name === 'Ethereum' || chain.name === 'Local Ethereum') ? (
                                      <Image
                                        src={EthIcon}
                                        alt={chain.name ?? 'Ethereum'}
                                        width={20}
                                        height={20}
                                        className="rounded-full"
                                        unoptimized
                                      />
                                    ) : (
                                      chain.iconUrl && (
                                        <img
                                          alt={chain.name ?? 'Chain icon'}
                                          src={chain.iconUrl}
                                          className="w-5 h-5 rounded-full"
                                        />
                                      )
                                    )}
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={openAccountModal}
                                className="px-4 py-2 rounded-xl font-medium transition-all duration-300 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                              >
                                {account.displayName}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-lg text-secondary-600 dark:text-gray-300 hover:text-secondary-900 dark:hover:text-white hover:bg-white/10 transition-all duration-300"
                  aria-expanded={isMenuOpen}
                  aria-label="Toggle navigation menu"
                >
                  {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden backdrop-blur-md border-t border-white/10" style={{ backgroundColor: 'var(--navbar-bg-strong)' }}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium rounded-lg nav-link ${
                    router.pathname === item.href ? 'is-active' : ''
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="mt-4 flex justify-center">
                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                className="px-5 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg navbar-wallet-btn hover:opacity-90"
                              >
                                Connect
                              </button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                className="px-5 py-2 rounded-xl font-medium transition-all duration-300 bg-red-500/20 text-red-400 border border-red-500/30"
                              >
                                Wrong network ({chain.id})
                              </button>
                            );
                          }

                          return (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={openChainModal}
                                className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                                title={chain.name}
                              >
                                {chain.hasIcon && (
                                  <div className="w-5 h-5 relative flex items-center justify-center">
                                    {(chain.id === 1 || chain.id === 31337 || chain.name === 'Ethereum' || chain.name === 'Local Ethereum') ? (
                                      <Image
                                        src={EthIcon}
                                        alt={chain.name ?? 'Ethereum'}
                                        width={20}
                                        height={20}
                                        className="rounded-full"
                                        unoptimized
                                      />
                                    ) : (
                                      chain.iconUrl && (
                                        <img
                                          alt={chain.name ?? 'Chain icon'}
                                          src={chain.iconUrl}
                                          className="w-5 h-5 rounded-full"
                                        />
                                      )
                                    )}
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={openAccountModal}
                                className="px-4 py-2 rounded-xl font-medium transition-all duration-300 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                              >
                                {account.displayName}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </div>
        )}
      </nav>
      {children}
    </>
  )
}
