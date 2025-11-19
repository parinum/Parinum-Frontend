import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import NavBar from './NavBar'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
}

// Render background icons only on the client to avoid SSR mismatch
const BackgroundParinumIcons = dynamic(() => import('./BackgroundParinumIcons'), {
  ssr: false,
})

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-cyber-grid opacity-30" />
  {/* Static Parinum icon field (client-only to avoid SSR mismatch) */}
  <BackgroundParinumIcons />
        
        {/* Main Content */}
        <div className="relative z-10">
          <NavBar />
          <main>{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
