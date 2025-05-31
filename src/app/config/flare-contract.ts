// Flare Network ETF Manager Configuration
// Based on: https://github.com/ETFProject/ETF_Manager

// Flare Coston2 Testnet Configuration
export const FLARE_NETWORK_CONFIG = {
  chainId: 114,
  name: 'Coston2',
  rpcUrl: 'https://coston2-api.flare.network/ext/C/rpc',
  symbol: 'C2FLR'
};

// Contract Registry address for Coston2 testnet
export const CONTRACT_REGISTRY_ADDRESS = '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019';

export const CONTRACT_REGISTRY_ABI = [
  "function getContractAddressByName(string memory name) external view returns(address)"
];

export const FLARE_CONTRACT_ABI = [
  "function getFeedById(bytes21 feedId) view returns (uint256 value, int8 decimals, uint64 timestamp)",
  "function getFeedsById(bytes21[] feedIds) view returns (uint256[] values, int8[] decimals, uint64 timestamp)"
];

// FTSOv2 Feed IDs (bytes21 format) - these are the correct feed identifiers
export const FEED_IDS = {
  "FLR/USD": "0x01464c522f55534400000000000000000000000000", // FLR/USD
  "BTC/USD": "0x014254432f55534400000000000000000000000000", // BTC/USD
  "ETH/USD": "0x014554482f55534400000000000000000000000000", // ETH/USD
  "SOL/USD": "0x01534f4c2f55534400000000000000000000000000", // SOL/USD
  "XRP/USD": "0x015852502f55534400000000000000000000000000", // XRP/USD
  "ADA/USD": "0x014144412f55534400000000000000000000000000", // ADA/USD
  "DOT/USD": "0x01444f542f55534400000000000000000000000000", // DOT/USD
  "LINK/USD": "0x014c494e4b2f5553440000000000000000000000000", // LINK/USD
  "UNI/USD": "0x01554e492f55534400000000000000000000000000", // UNI/USD
  "DOGE/USD": "0x01444f47452f5553440000000000000000000000000", // DOGE/USD
  "SHIB/USD": "0x01534849422f5553440000000000000000000000000", // SHIB/USD
  "USDC/USD": "0x01555344432f5553440000000000000000000000000", // USDC/USD
  "USDT/USD": "0x01555344542f5553440000000000000000000000000"  // USDT/USD
};

// Convert feed mapping to array format for easier iteration
export const FEED_CONFIGS = Object.entries(FEED_IDS).map(([name, id], index) => ({
  id: index,
  name,
  symbol: name.split('/')[0],
  feedId: id
}));

// Feed Categories for UI filtering
export const FEED_CATEGORIES = {
  ALL: "All",
  MAJOR: "Major",
  DEFI: "DeFi", 
  STABLECOIN: "Stablecoin",
  MEME: "Meme",
  LAYER1: "Layer1"
};

// Category mappings
export const CATEGORY_MAPPINGS: Record<string, string[]> = {
  [FEED_CATEGORIES.MAJOR]: ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"],
  [FEED_CATEGORIES.DEFI]: ["UNI/USD", "LINK/USD"],
  [FEED_CATEGORIES.STABLECOIN]: ["USDC/USD", "USDT/USD"],
  [FEED_CATEGORIES.MEME]: ["DOGE/USD", "SHIB/USD"],
  [FEED_CATEGORIES.LAYER1]: ["ADA/USD", "DOT/USD"]
};

// Feed Interface
export interface FlareOracleFeed {
  id: number;
  name: string;
  symbol: string;
  price: number;
  decimals: number;
  timestamp: number;
  change24h?: number;
  category: string;
  feedId: string;
} 