import { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
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
  const { pathname } = useRouter()
  const showDecorativeBackground = pathname === '/'

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(135deg, var(--bg-1) 0%, var(--bg-2) 50%, var(--bg-3) 100%)',
      }}
    >
      <div className="relative">
        {/* Background Pattern and logos only on the home page */}
        {showDecorativeBackground && (
          <>
            <div className="absolute inset-0 bg-cyber-grid opacity-30" />
            <BackgroundParinumIcons />
          </>
        )}

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
