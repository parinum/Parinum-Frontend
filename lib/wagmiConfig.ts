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
    mainnet,
    bsc,
    arbitrum,
    base,
    polygon,
    linea,
    optimism,
    unichain,
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [linea.id]: http(),
    [optimism.id]: http(),
    [unichain.id]: http(),
  },
  ssr: true,
})
