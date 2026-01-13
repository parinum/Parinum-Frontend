import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import type { AppProps } from 'next/app'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'
import { 
  RainbowKitProvider, 
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmiConfig'

function ThemedRainbowKit({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const kitTheme = useMemo(
    () =>
      resolvedTheme === 'light'
        ? lightTheme({ accentColor: '#2563eb', borderRadius: 'medium' })
        : darkTheme({ accentColor: '#6366f1', borderRadius: 'medium' }),
    [resolvedTheme],
  )

  return <RainbowKitProvider theme={kitTheme}>{children}</RainbowKitProvider>
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  const toastStyle =
    resolvedTheme === 'light'
      ? {
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid rgba(15, 23, 42, 0.12)',
        }
      : {
          background: '#1e293b',
          color: '#ffffff',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'theme-surface text-sm',
        style: toastStyle,
      }}
    />
  )
}

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
        <ThemeProvider>
          <ThemedRainbowKit>
            <AnimatePresence mode="wait" initial={false}>
              <Component {...pageProps} key={router.asPath} />
            </AnimatePresence>
            <ThemedToaster />
          </ThemedRainbowKit>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
