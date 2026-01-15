import React from 'react'
import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import EthIcon from 'cryptocurrency-icons/svg/color/eth.svg'

export const WalletButton = () => {
    return (
                <ConnectButton.Custom>
                  {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                      <div
                        {...(!ready && {
                          'aria-hidden': true,
                          style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <button
                                onClick={openConnectModal}
                                className="px-5 py-2 rounded-xl font-medium transition-all duration-300 shadow-lg navbar-wallet-btn hover:opacity-90"
                              >
                                Connect
                              </button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <button
                                onClick={openChainModal}
                                className="px-5 py-2 rounded-xl font-medium transition-all duration-300 bg-red-500/20 text-red-400 border border-red-500/30"
                              >
                                Wrong network ({chain.id})
                              </button>
                            );
                          }

                          return (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={openChainModal}
                                className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
                                title={chain.name}
                              >
                                {chain.hasIcon && (
                                  <div className="w-5 h-5 relative flex items-center justify-center">
                                    {(chain.id === 1 || chain.id === 31337 || chain.name === 'Ethereum' || chain.name === 'Local Ethereum') ? (
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
                                        />
                                      )
                                    )}
                                  </div>
                                )}
                              </button>
                              <button
                                onClick={openAccountModal}
                                className="px-4 py-2 rounded-xl font-medium transition-all duration-300 bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                              >
                                {account.displayName}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
    )
}
