// Type declarations for Web3/MetaMask
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

export {}

// Allow importing SVGs as modules (for Next/Image static import)
declare module '*.svg' {
  const content: any
  export default content
}
