import { Interface, type InterfaceAbi } from 'ethers'
import {
  ParinumCloneArbitrum__factory,
  ParinumCloneBSC__factory,
  ParinumCloneBase__factory,
  ParinumCloneEthereum__factory,
  ParinumCloneLinea__factory,
  ParinumCloneOptimism__factory,
  ParinumClonePolygon__factory,
  ParinumCloneUnichain__factory,
  ParinumFactoryArbitrum__factory,
  ParinumFactoryBSC__factory,
  ParinumFactoryBase__factory,
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
  deploymentBlock?: number
}

const getAddress = (chainId: number) => {
  const addresses = (deploymentAddresses as Record<string, { Factory: string; Clone: string }>)[chainId.toString()]
  return addresses ? { factory: addresses.Factory, clone: addresses.Clone } : { factory: '', clone: '' }
}

const getEnvAddressOverride = (chainId: number, envKey?: EnvKey) => {
  const byChainId = process.env[`NEXT_PUBLIC_PARINUM_FACTORY_${chainId}`]?.trim()
  const byEnvKey = envKey ? process.env[`NEXT_PUBLIC_PARINUM_FACTORY_${envKey}`]?.trim() : undefined
  const generic = process.env.NEXT_PUBLIC_PARINUM_FACTORY?.trim()
  const factory = byChainId || byEnvKey || generic

  const cloneByChainId = process.env[`NEXT_PUBLIC_PARINUM_CLONE_${chainId}`]?.trim()
  const cloneByEnvKey = envKey ? process.env[`NEXT_PUBLIC_PARINUM_CLONE_${envKey}`]?.trim() : undefined
  const cloneGeneric = process.env.NEXT_PUBLIC_PARINUM_CLONE?.trim()
  const clone = cloneByChainId || cloneByEnvKey || cloneGeneric

  const deploymentOverrideRaw =
    process.env[`NEXT_PUBLIC_PARINUM_DEPLOYMENT_BLOCK_${chainId}`] ||
    (envKey ? process.env[`NEXT_PUBLIC_PARINUM_DEPLOYMENT_BLOCK_${envKey}`] : undefined)
  const deploymentBlock = deploymentOverrideRaw ? Number(deploymentOverrideRaw) : undefined

  return {
    factory: factory || '',
    clone: clone || '',
    deploymentBlock,
  }
}

export const getCoreContractAddresses = (chainId: number) => {
  const addresses = (deploymentAddresses as Record<string, any>)[chainId.toString()]
  if (!addresses) return null
  return {
    ico: addresses?.PRMICO || '',
    prm: addresses?.PRM || '',
    rewardsPool: addresses?.RewardsPool || '',
    governor: addresses?.Governor || '',
    timelock: addresses?.Timelock || ''
  }
}


export const parinumNetworks: Record<number, ParinumNetworkConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    nativeSymbol: 'ETH',
    envKey: 'ETHEREUM',
    factoryAddress: getAddress(1).factory,
    cloneAddress: getAddress(1).clone,
    factoryAbi: ParinumFactoryEthereum__factory.abi,
    cloneAbi: ParinumCloneEthereum__factory.abi,
    deploymentBlock: 24160000,
  },
  56: {
    chainId: 56,
    name: 'BSC',
    nativeSymbol: 'BNB',
    envKey: 'BSC',
    factoryAddress: getAddress(56).factory,
    cloneAddress: getAddress(56).clone,
    factoryAbi: ParinumFactoryBSC__factory.abi,
    cloneAbi: ParinumCloneBSC__factory.abi,
    deploymentBlock: 74492406,
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    nativeSymbol: 'ETH',
    envKey: 'ARBITRUM',
    factoryAddress: getAddress(42161).factory,
    cloneAddress: getAddress(42161).clone,
    factoryAbi: ParinumFactoryArbitrum__factory.abi,
    cloneAbi: ParinumCloneArbitrum__factory.abi,
    deploymentBlock: 290000000,
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    nativeSymbol: 'ETH',
    envKey: 'BASE',
    factoryAddress: getAddress(8453).factory,
    cloneAddress: getAddress(8453).clone,
    factoryAbi: ParinumFactoryBase__factory.abi,
    cloneAbi: ParinumCloneBase__factory.abi,
    deploymentBlock: 25000000,
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    nativeSymbol: 'MATIC',
    envKey: 'POLYGON',
    factoryAddress: getAddress(137).factory,
    cloneAddress: getAddress(137).clone,
    factoryAbi: ParinumFactoryPolygon__factory.abi,
    cloneAbi: ParinumClonePolygon__factory.abi,
    deploymentBlock: 66000000,
  },
  59144: {
    chainId: 59144,
    name: 'Linea',
    nativeSymbol: 'ETH',
    envKey: 'LINEA',
    factoryAddress: getAddress(59144).factory,
    cloneAddress: getAddress(59144).clone,
    factoryAbi: ParinumFactoryLinea__factory.abi,
    cloneAbi: ParinumCloneLinea__factory.abi,
    deploymentBlock: 14000000,
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    nativeSymbol: 'ETH',
    envKey: 'OPTIMISM',
    factoryAddress: getAddress(10).factory,
    cloneAddress: getAddress(10).clone,
    factoryAbi: ParinumFactoryOptimism__factory.abi,
    cloneAbi: ParinumCloneOptimism__factory.abi,
    deploymentBlock: 130000000,
  },
  130: {
    chainId: 130,
    name: 'Unichain',
    nativeSymbol: 'ETH',
    envKey: 'UNICHAIN',
    factoryAddress: getAddress(130).factory,
    cloneAddress: getAddress(130).clone,
    factoryAbi: ParinumFactoryUnichain__factory.abi,
    cloneAbi: ParinumCloneUnichain__factory.abi,
    deploymentBlock: 0,
  },
  31337: {
    chainId: 31337,
    name: 'Local Ethereum',
    nativeSymbol: 'ETH',
    envKey: 'ETHEREUM',
    factoryAddress: getAddress(1).factory,
    cloneAddress: getAddress(1).clone,
    factoryAbi: ParinumFactoryEthereum__factory.abi,
    cloneAbi: ParinumCloneEthereum__factory.abi,
    deploymentBlock: 24160000,
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
    deploymentBlock: 45000000,
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
    deploymentBlock: 290000000,
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
    deploymentBlock: 25000000,
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
    deploymentBlock: 66000000,
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
    deploymentBlock: 14000000,
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
    deploymentBlock: 130000000,
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
    deploymentBlock: 0,
  },
}

export const supportedParinumChainIds = Object.keys(parinumNetworks).map((id) =>
  Number(id)
)

export const getParinumNetworkConfig = (chainId?: number | null) => {
  if (!chainId) return undefined
  const base = parinumNetworks[chainId]
  if (!base) return undefined

  const overrides = getEnvAddressOverride(chainId, base.envKey)

  return {
    ...base,
    factoryAddress: overrides.factory || base.factoryAddress,
    cloneAddress: overrides.clone || base.cloneAddress,
    deploymentBlock:
      overrides.deploymentBlock !== undefined ? overrides.deploymentBlock : base.deploymentBlock,
  }
}

export const getParinumFactoryInterface = (chainId: number) => {
  const cfg = getParinumNetworkConfig(chainId)
  return cfg ? new Interface(cfg.factoryAbi) : undefined
}
