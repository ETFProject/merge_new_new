/**
 * Contract addresses and configuration for Flow EVM Testnet
 * 
 * IMPORTANT: These addresses should match the deployed contracts
 * Source: deployment-flow-etf-working.json
 */

export const FLOW_EVM_TESTNET_CHAIN_ID = 545;

export const CONTRACT_ADDRESSES = {
  // Core ETF contracts (ACTIVE DEPLOYMENT)
  etfVault: "0xb41Eebc041d8eFDB38dB7e5a6f1b1CC295702C2b",
  assetFactory: "0x00908d528c53ca7d802ddc91e3b38b9a6095c680", 
  eip7702Implementation: "0x2e3746fAfba8e075612aD00e06B55ef21C055F79",
  
  // Agent wallet
  agentWallet: "0xb067fB16AFcABf8A8974a35CbCee243B8FDF0EA1",
} as const;

export const ASSET_ADDRESSES = {
  // Test tokens on Flow EVM Testnet (ACTIVE DEPLOYMENT)
  WFLOW: "0x9a7623494c986b443a26f79bf3e715bb1763f610",
  USDC: "0x4608acb5aef179f2d89d2643368e6cd16a0761c0", 
  WETH: "0xf5935f7557f82ea203228947bb574a64393a72ed",
  ankrFLOW: "0xda54ac65cf7d1d51bfefc2f7c1c881b86010b168",
  TRUMP: "0xb664eab8e811b3a4af872d01b75ccbdc4d28fd2d",
} as const;

export const NETWORK_CONFIG = {
  chainId: FLOW_EVM_TESTNET_CHAIN_ID,
  name: "Flow EVM Testnet",
  nativeCurrency: {
    name: "Flow",
    symbol: "FLOW", 
    decimals: 18,
  },
  rpcUrls: [
    "https://testnet.evm.nodes.onflow.org",
    "https://twilight-thrumming-putty.flow-testnet.quiknode.pro/3cb85c88012d5976c57427e2448457210054d84b/",
  ],
  blockExplorers: [
    {
      name: "Flow EVM Testnet Explorer",
      url: "https://evm-testnet.flowscan.io",
    },
  ],
} as const;

/**
 * Utility function to get explorer URL for an address
 */
export function getExplorerUrl(address: string, type: 'address' | 'tx' = 'address'): string {
  return `${NETWORK_CONFIG.blockExplorers[0].url}/${type}/${address}`;
}

/**
 * Utility function to validate if an address exists in our deployment
 */
export function isValidContractAddress(address: string): boolean {
  const allAddresses = [
    ...Object.values(CONTRACT_ADDRESSES),
    ...Object.values(ASSET_ADDRESSES),
  ];
  return allAddresses.includes(address as unknown as string);
}
