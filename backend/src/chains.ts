import { ParinumFactoryBSC__factory } from '@parinum/contracts/typechain-types/factories/contracts/ParinumFactoryChains.sol/ParinumFactoryBSC__factory'
import { ParinumFactoryEthereum__factory } from '@parinum/contracts/typechain-types/factories/contracts/ParinumFactoryChains.sol/ParinumFactoryEthereum__factory'
import { ParinumFactoryPolygon__factory } from '@parinum/contracts/typechain-types/factories/contracts/ParinumFactoryChains.sol/ParinumFactoryPolygon__factory'
import deploymentAddresses from '../../lib/deploymentAddresses.json'
import { env, getChainBatchSize, getChainFinalityBuffer, getRpcUrlList } from './env'
import type { IndexedChainConfig } from './types'

type ChainSeed = Omit<IndexedChainConfig, 'factoryAddress' | 'rpcUrls' | 'finalityBufferBlocks' | 'batchSize'> & {
  rpcEnvKeys: string[]
}

const explorerBaseUrls: Record<number, string> = {
  1: 'https://etherscan.io/address/',
  56: 'https://bscscan.com/address/',
  137: 'https://polygonscan.com/address/',
}

const seeds: ChainSeed[] = [
  {
    chainId: 1,
    name: 'Ethereum',
    envKey: 'ETHEREUM',
    nativeSymbol: 'ETH',
    factoryAbi: ParinumFactoryEthereum__factory.abi,
    deploymentBlock: 24160000,
    explorerAddressBaseUrl: explorerBaseUrls[1],
    rpcEnvKeys: ['PROFILE_INDEXER_RPC_URL_ETHEREUM', 'NEXT_PUBLIC_ETHEREUM_RPC_URL', 'NEXT_PUBLIC_MAINNET_RPC_URL', 'NEXT_PUBLIC_RPC_URL'],
  },
  {
    chainId: 56,
    name: 'BSC',
    envKey: 'BSC',
    nativeSymbol: 'BNB',
    factoryAbi: ParinumFactoryBSC__factory.abi,
    deploymentBlock: 74492406,
    explorerAddressBaseUrl: explorerBaseUrls[56],
    rpcEnvKeys: ['PROFILE_INDEXER_RPC_URL_BSC', 'NEXT_PUBLIC_BSC_RPC_URL', 'NEXT_PUBLIC_BINANCE_RPC_URL', 'NEXT_PUBLIC_RPC_URL_BSC', 'NEXT_PUBLIC_RPC_URL'],
  },
  {
    chainId: 137,
    name: 'Polygon',
    envKey: 'POLYGON',
    nativeSymbol: 'MATIC',
    factoryAbi: ParinumFactoryPolygon__factory.abi,
    deploymentBlock: 66000000,
    explorerAddressBaseUrl: explorerBaseUrls[137],
    rpcEnvKeys: ['PROFILE_INDEXER_RPC_URL_POLYGON', 'NEXT_PUBLIC_POLYGON_RPC_URL', 'NEXT_PUBLIC_MATIC_RPC_URL', 'NEXT_PUBLIC_RPC_URL_POLYGON', 'NEXT_PUBLIC_RPC_URL'],
  },
]

const getFactoryAddress = (chainId: number) => {
  const entry = (deploymentAddresses as Record<string, { Factory?: string }>)[String(chainId)]
  return entry?.Factory?.toLowerCase() || ''
}

export const getIndexedChains = (): IndexedChainConfig[] => {
  const enabled = env.enabledChainIds.length > 0 ? new Set(env.enabledChainIds) : null

  return seeds
    .filter((seed) => (enabled ? enabled.has(seed.chainId) : true))
    .map((seed) => ({
      chainId: seed.chainId,
      name: seed.name,
      envKey: seed.envKey,
      nativeSymbol: seed.nativeSymbol,
      factoryAbi: seed.factoryAbi,
      deploymentBlock: seed.deploymentBlock,
      explorerAddressBaseUrl: seed.explorerAddressBaseUrl,
      factoryAddress: getFactoryAddress(seed.chainId),
      rpcUrls: getRpcUrlList(seed.rpcEnvKeys),
      finalityBufferBlocks: getChainFinalityBuffer(seed.chainId),
      batchSize: getChainBatchSize(seed.chainId),
    }))
    .filter((chain) => chain.factoryAddress && chain.rpcUrls.length > 0)
}
