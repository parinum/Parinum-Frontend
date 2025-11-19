import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'

export default function App({ Component, pageProps, router }: AppProps) {
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
    <>
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
    </>
  )
}
