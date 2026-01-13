import { Interface, type InterfaceAbi } from 'ethers'
import {
  ParinumCloneArbitrum__factory,
  ParinumCloneAvalanche__factory,
  ParinumCloneBSC__factory,
  ParinumCloneBase__factory,
  ParinumCloneCronos__factory,
  ParinumCloneEthereum__factory,
  ParinumCloneLinea__factory,
  ParinumCloneOptimism__factory,
  ParinumClonePolygon__factory,
  ParinumCloneUnichain__factory,
  ParinumFactoryArbitrum__factory,
  ParinumFactoryAvalanche__factory,
  ParinumFactoryBSC__factory,
  ParinumFactoryBase__factory,
  ParinumFactoryCronos__factory,
  ParinumFactoryEthereum__factory,
  ParinumFactoryLinea__factory,
  ParinumFactoryOptimism__factory,
  ParinumFactoryPolygon__factory,
  ParinumFactoryUnichain__factory,
} from '@parinum/contracts/typechain-types'
import deploymentAddresses from './deploymentAddresses.json'

type EnvKey =
  | 'ETHEREUM'
  | 'BSC'
  | 'ARBITRUM'
  | 'BASE'
  | 'POLYGON'
  | 'AVALANCHE'
  | 'CRONOS'
  | 'LINEA'
  | 'OPTIMISM'
  | 'UNICHAIN'

export type ParinumNetworkConfig = {
  chainId: number
  name: string
  nativeSymbol: string
  envKey: EnvKey
  factoryAddress: string
  cloneAddress: string
  factoryAbi: InterfaceAbi
  cloneAbi: InterfaceAbi
}

const getAddress = (chainId: number) => {
  const addresses = (deploymentAddresses as Record<string, { Factory: string; Clone: string }>)[chainId.toString()]
  return addresses ? { factory: addresses.Factory, clone: addresses.Clone } : { factory: '', clone: '' }
}


export const parinumNetworks: Record<number, ParinumNetworkConfig> = {
  31337: {
    chainId: 31337,
    name: 'Local Ethereum',
    nativeSymbol: 'ETH',
    envKey: 'ETHEREUM',
    factoryAddress: getAddress(1).factory,
    cloneAddress: getAddress(1).clone,
    factoryAbi: ParinumFactoryEthereum__factory.abi,
    cloneAbi: ParinumCloneEthereum__factory.abi,
  },
  31338: {
    chainId: 31338,
    name: 'Local BSC',
    nativeSymbol: 'BNB',
    envKey: 'BSC',
    factoryAddress: getAddress(56).factory,
    cloneAddress: getAddress(56).clone,
    factoryAbi: ParinumFactoryBSC__factory.abi,
    cloneAbi: ParinumCloneBSC__factory.abi,
  },
  31339: {
    chainId: 31339,
    name: 'Local Arbitrum',
    nativeSymbol: 'ETH',
    envKey: 'ARBITRUM',
    factoryAddress: getAddress(42161).factory,
    cloneAddress: getAddress(42161).clone,
    factoryAbi: ParinumFactoryArbitrum__factory.abi,
    cloneAbi: ParinumCloneArbitrum__factory.abi,
  },
  31340: {
    chainId: 31340,
    name: 'Local Base',
    nativeSymbol: 'ETH',
    envKey: 'BASE',
    factoryAddress: getAddress(8453).factory,
    cloneAddress: getAddress(8453).clone,
    factoryAbi: ParinumFactoryBase__factory.abi,
    cloneAbi: ParinumCloneBase__factory.abi,
  },
  31341: {
    chainId: 31341,
    name: 'Local Polygon',
    nativeSymbol: 'MATIC',
    envKey: 'POLYGON',
    factoryAddress: getAddress(137).factory,
    cloneAddress: getAddress(137).clone,
    factoryAbi: ParinumFactoryPolygon__factory.abi,
    cloneAbi: ParinumClonePolygon__factory.abi,
  },
  31342: {
    chainId: 31342,
    name: 'Local Avalanche',
    nativeSymbol: 'AVAX',
    envKey: 'AVALANCHE',
    factoryAddress: getAddress(43114).factory,
    cloneAddress: getAddress(43114).clone,
    factoryAbi: ParinumFactoryAvalanche__factory.abi,
    cloneAbi: ParinumCloneAvalanche__factory.abi,
  },
  31343: {
    chainId: 31343,
    name: 'Local Cronos',
    nativeSymbol: 'CRO',
    envKey: 'CRONOS',
    factoryAddress: getAddress(25).factory,
    cloneAddress: getAddress(25).clone,
    factoryAbi: ParinumFactoryCronos__factory.abi,
    cloneAbi: ParinumCloneCronos__factory.abi,
  },
  31344: {
    chainId: 31344,
    name: 'Local Linea',
    nativeSymbol: 'ETH',
    envKey: 'LINEA',
    factoryAddress: getAddress(59144).factory,
    cloneAddress: getAddress(59144).clone,
    factoryAbi: ParinumFactoryLinea__factory.abi,
    cloneAbi: ParinumCloneLinea__factory.abi,
  },
  31345: {
    chainId: 31345,
    name: 'Local Optimism',
    nativeSymbol: 'ETH',
    envKey: 'OPTIMISM',
    factoryAddress: getAddress(10).factory,
    cloneAddress: getAddress(10).clone,
    factoryAbi: ParinumFactoryOptimism__factory.abi,
    cloneAbi: ParinumCloneOptimism__factory.abi,
  },
  31346: {
    chainId: 31346,
    name: 'Local Unichain',
    nativeSymbol: 'ETH',
    envKey: 'UNICHAIN',
    factoryAddress: getAddress(130).factory,
    cloneAddress: getAddress(130).clone,
    factoryAbi: ParinumFactoryUnichain__factory.abi,
    cloneAbi: ParinumCloneUnichain__factory.abi,
  },
}

export const supportedParinumChainIds = Object.keys(parinumNetworks).map((id) =>
  Number(id)
)

export const getParinumNetworkConfig = (chainId?: number | null) =>
  chainId ? parinumNetworks[chainId] : undefined

export const getParinumFactoryInterface = (chainId: number) => {
  const cfg = getParinumNetworkConfig(chainId)
  return cfg ? new Interface(cfg.factoryAbi) : undefined
}
