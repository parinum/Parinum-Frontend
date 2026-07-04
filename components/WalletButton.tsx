import React from 'react'
import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import EthIcon from 'cryptocurrency-icons/svg/color/eth.svg'

export const WalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted

        if (!ready) {
          return (
            <button
              type="button"
              disabled
              aria-busy="true"
              className="h-10 px-5 rounded-xl font-medium transition-all duration-300 shadow-lg navbar-wallet-btn opacity-70 cursor-wait inline-flex items-center whitespace-nowrap leading-none"
            >
              Loading wallet...
            </button>
          )
        }

        if (!account || !chain) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className="h-10 px-5 rounded-xl font-medium transition-all duration-300 shadow-lg navbar-wallet-btn hover:opacity-90 inline-flex items-center whitespace-nowrap leading-none"
            >
              Connect
            </button>
          )
        }

        if (chain.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className="h-10 px-5 rounded-xl font-medium transition-all duration-300 bg-red-500/20 text-red-400 border border-red-500/30 inline-flex items-center whitespace-nowrap leading-none"
            >
              Wrong network ({chain.id})
            </button>
          )
        }

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openChainModal}
              className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
              title={chain.name}
            >
              {chain.hasIcon && (
                <div className="w-5 h-5 relative flex items-center justify-center">
                  {chain.id === 1 || chain.id === 31337 || chain.name === 'Ethereum' || chain.name === 'Local Ethereum' ? (
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
                      <Image
                        alt={chain.name ?? 'Chain icon'}
                        src={chain.iconUrl}
                        width={20}
                        height={20}
                        className="rounded-full"
                        unoptimized
                      />
                    )
                  )}
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={openAccountModal}
              className="h-10 px-4 rounded-xl font-medium transition-all duration-300 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 inline-flex items-center whitespace-nowrap leading-none"
            >
              {account.displayName}
            </button>
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
