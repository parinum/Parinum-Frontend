import { connectorsForWallets } from '@rainbow-me/rainbowkit'
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
import { createConfig, http } from 'wagmi'
import {
  mainnet,
  bsc,
  arbitrum,
  base,
  polygon,
  avalanche,
  cronos,
  linea,
  optimism,
  unichain,
} from 'wagmi/chains'

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

export const config = createConfig({
  connectors,
  chains: [
    { ...mainnet, id: 31337, name: 'Local Ethereum', rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } }, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { ...bsc, id: 31338, name: 'Local BSC', rpcUrls: { default: { http: ['http://127.0.0.1:8546'] } }, nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 } },
    { ...arbitrum, id: 31339, name: 'Local Arbitrum', rpcUrls: { default: { http: ['http://127.0.0.1:8547'] } }, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { ...base, id: 31340, name: 'Local Base', rpcUrls: { default: { http: ['http://127.0.0.1:8548'] } }, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { ...polygon, id: 31341, name: 'Local Polygon', rpcUrls: { default: { http: ['http://127.0.0.1:8549'] } }, nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } },
    { ...avalanche, id: 31342, name: 'Local Avalanche', rpcUrls: { default: { http: ['http://127.0.0.1:8550'] } }, nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 } },
    { ...cronos, id: 31343, name: 'Local Cronos', rpcUrls: { default: { http: ['http://127.0.0.1:8551'] } }, nativeCurrency: { name: 'CRO', symbol: 'CRO', decimals: 18 } },
    { ...linea, id: 31344, name: 'Local Linea', rpcUrls: { default: { http: ['http://127.0.0.1:8552'] } }, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { ...optimism, id: 31345, name: 'Local Optimism', rpcUrls: { default: { http: ['http://127.0.0.1:8553'] } }, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    { ...unichain, id: 31346, name: 'Local Unichain', rpcUrls: { default: { http: ['http://127.0.0.1:8554'] } }, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  ],
  transports: {
    [31337]: http('http://127.0.0.1:8545'),
    [31338]: http('http://127.0.0.1:8546'),
    [31339]: http('http://127.0.0.1:8547'),
    [31340]: http('http://127.0.0.1:8548'),
    [31341]: http('http://127.0.0.1:8549'),
    [31342]: http('http://127.0.0.1:8550'),
    [31343]: http('http://127.0.0.1:8551'),
    [31344]: http('http://127.0.0.1:8552'),
    [31345]: http('http://127.0.0.1:8553'),
    [31346]: http('http://127.0.0.1:8554'),
  },
  ssr: true,
})
