// Flare Network ETF Manager Configuration
// Based on: https://github.com/ETFProject/ETF_Manager

export const FLARE_CONTRACT_ADDRESS = "0x93420cD7639AEe3dFc7AA18aDe7955Cfef4b44b1";

export const FLARE_CONTRACT_ABI = [
  "function getFeedById(uint256 feedIndex) view returns (uint256 value, uint8 decimals, uint256 timestamp)",
  "function getFtsoV2CurrentFeedValues() view returns (uint256[] memory values, uint8[] memory decimals, uint256[] memory timestamps)",
  "function getAllFeedIds() view returns (string[] memory)"
];

// Flare Coston2 Testnet Configuration
export const FLARE_NETWORK_CONFIG = {
  chainId: 114,
  name: 'Coston2',
  rpcUrl: 'https://coston2-api.flare.network/ext/C/rpc',
  blockExplorer: 'https://coston2-explorer.flare.network/',
  nativeCurrency: 'C2FLR'
};

// All 60 Oracle Feeds (59 active + 1 custom)
export const FEED_NAMES = [
  "Custom", "DOGE/USD", "BTC/USD", "ETH/USD", "BNB/USD", "SOL/USD",
  "XRP/USD", "USDC/USD", "ADA/USD", "AVAX/USD", "SHIB/USD", "TON/USD",
  "DOT/USD", "TRX/USD", "LINK/USD", "NEAR/USD", "MATIC/USD", "UNI/USD",
  "ICP/USD", "PEPE/USD", "LTC/USD", "USDT/USD", "HYPE/USD", "CRO/USD",
  "ETC/USD", "APT/USD", "POL/USD", "RENDER/USD", "XLM/USD", "VET/USD",
  "FIL/USD", "HBAR/USD", "MNT/USD", "OP/USD", "ARB/USD", "BONK/USD",
  "ALGO/USD", "AAVE/USD", "TAO/USD", "JUP/USD", "WIF/USD", "SUI/USD",
  "FLOKI/USD", "GALA/USD", "USDS/USD", "PAXG/USD", "NOT/USD", "ATOM/USD",
  "SEI/USD", "QNT/USD", "BRETT/USD", "JASMY/USD", "BEAM/USD", "TRUMP/USD",
  "BASE/USD", "STRK/USD", "SAND/USD", "FET/USD", "USDX/USD", "OCEAN/USD"
];

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
  [FEED_CATEGORIES.MAJOR]: ["BTC/USD", "ETH/USD", "BNB/USD", "SOL/USD", "XRP/USD"],
  [FEED_CATEGORIES.DEFI]: ["UNI/USD", "AAVE/USD", "LINK/USD", "JUP/USD", "RENDER/USD"],
  [FEED_CATEGORIES.STABLECOIN]: ["USDC/USD", "USDT/USD", "USDS/USD", "USDX/USD", "PAXG/USD"],
  [FEED_CATEGORIES.MEME]: ["DOGE/USD", "SHIB/USD", "PEPE/USD", "BONK/USD", "WIF/USD"],
  [FEED_CATEGORIES.LAYER1]: ["ADA/USD", "DOT/USD", "AVAX/USD", "NEAR/USD", "SUI/USD"]
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
} 