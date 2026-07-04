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
  polygon,
} from 'wagmi/chains'
import { fallback } from 'viem'

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim()
const hasWalletConnectProjectId = Boolean(
  walletConnectProjectId && walletConnectProjectId !== 'YOUR_PROJECT_ID'
)

const mainnetTransports = [
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL,
  'https://ethereum.publicnode.com',
  'https://eth.drpc.org',
].filter((value): value is string => Boolean(value && value.trim()))

const bscTransports = [
  process.env.NEXT_PUBLIC_BSC_RPC_URL,
  process.env.NEXT_PUBLIC_BINANCE_RPC_URL,
  process.env.NEXT_PUBLIC_RPC_URL_BSC,
  'https://bsc-mainnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5',
  'https://bsc-dataseed.binance.org',
  'https://bsc-dataseed1.binance.org',
].filter((value): value is string => Boolean(value && value.trim()))

const polygonTransports = [
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL,
  process.env.NEXT_PUBLIC_MATIC_RPC_URL,
  process.env.NEXT_PUBLIC_RPC_URL_POLYGON,
  'https://polygon.drpc.org',
].filter((value): value is string => Boolean(value && value.trim()))

const walletGroups = [
  {
    groupName: 'Popular',
    wallets: [
      metaMaskWallet,
      coinbaseWallet,
      braveWallet,
      phantomWallet,
    ],
  },
  {
    groupName: 'More',
    wallets: [argentWallet],
  },
]

if (hasWalletConnectProjectId) {
  walletGroups[0].wallets.push(walletConnectWallet, rainbowWallet)
  walletGroups[1].wallets.push(trustWallet, ledgerWallet, okxWallet)
}

const connectors = connectorsForWallets(
  walletGroups,
  {
    appName: 'Parinum',
    projectId: walletConnectProjectId ?? 'YOUR_PROJECT_ID',
  }
)

export const config = createConfig({
  connectors,
  chains: [
    mainnet,
    bsc,
    polygon,
  ],
  transports: {
    [mainnet.id]: fallback(mainnetTransports.map((url) => http(url))),
    [bsc.id]: fallback(bscTransports.map((url) => http(url))),
    [polygon.id]: fallback(polygonTransports.map((url) => http(url))),
  },
  multiInjectedProviderDiscovery: false,
  ssr: true,
})
