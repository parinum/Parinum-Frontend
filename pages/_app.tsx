import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import type { AppProps } from 'next/app'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { 
  RainbowKitProvider, 
  darkTheme,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
  trustWallet,
  ledgerWallet,
  phantomWallet,
  braveWallet,
  argentWallet,
  okxWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
      ],
    },
    {
      groupName: 'More',
      wallets: [
        trustWallet,
        phantomWallet,
        braveWallet,
        ledgerWallet,
        argentWallet,
        okxWallet,
      ],
    },
  ],
  {
    appName: 'Parinum',
    projectId,
  }
)

const config = createConfig({
  connectors,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
})

export default function App({ Component, pageProps, router }: AppProps) {
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    const handleRouteChange = () => {
      window.scrollTo(0, 0)
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: '#6366f1', borderRadius: 'medium' })}>
          <ThemeProvider>
            <AnimatePresence mode="wait" initial={false}>
              <Component {...pageProps} key={router.asPath} />
            </AnimatePresence>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'bg-dark-800 text-white border border-primary-500/20',
                style: {
                  background: '#1e293b',
                  color: '#ffffff',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                },
              }}
            />
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
