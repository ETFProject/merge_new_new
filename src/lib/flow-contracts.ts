'use client';

import { ethers } from 'ethers';

// Contract addresses - Flow EVM Testnet
export const CONTRACT_ADDRESSES = {
  assetFactory: '0x2a78CF76ec1b5F349b96E70B38360e21323Fd2d1',
  wflow: '0x65604A8Cfbaa318C8EDa47fcF8352EB77BDAA15E',
  trump: '0x97f8C96569E89A92Ce88d8c460cB37264788F9f8',
  ankrFlow: '0x4F3824C4b8e435A924B09D41E19D576dB3C50165',
  usdc: '0xF881dE8e7D55dbaE312b464c1b1316AF96C71aFa',
  weth: '0x26256c749f3D24F1Ff0344522819fC7cD608846c',
  etfVault: '0x8Cdb066f5190efF591f65C8dedA667D8e45665B3'
};

// Flow EVM Testnet Info
export const FLOW_TESTNET = {
  chainId: 545,
  name: 'Flow EVM Testnet',
  rpcUrl: 'https://testnet.evm.nodes.onflow.org',
  blockExplorer: 'https://evm-testnet.flowscan.io'
};

// Simplified ABIs for our purposes
const ETFVaultABI = [
  // Read functions
  'function getTotalValue() view returns (uint256)',
  'function getNetAssetValue() view returns (uint256)',
  'function getActiveAssets() view returns (address[])',
  'function needsRebalancing() view returns (bool)',
  'function getAssetAllocation(address token) view returns (tuple(uint256 weight, uint256 value, uint256 targetValue))',
  'function supportedAssets(address token) view returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  
  // Write functions
  'function deposit(address token, uint256 amount) returns (uint256)',
  'function withdraw(uint256 shares, address tokenOut, uint256 minAmountOut) returns (uint256)',
  'function createBatchedETFOperations(uint256[] operations, address[] tokens, uint256[] amounts, bytes[] extraData) view returns (address[] targets, bytes[] calldatas, uint256[] values)',
  'function registerEIP7702Account(address account) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event AssetAdded(address indexed token, uint256 weight)',
  'event AssetRebalanced(address indexed token, uint256 oldWeight, uint256 newWeight)',
  'event FeesCollected(uint256 amount)',
  'event Rebalanced()'
];

const TokenABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'function faucet()'
];

// Get provider for server-side operations
export function getServerProvider() {
  return new ethers.JsonRpcProvider(FLOW_TESTNET.rpcUrl);
}

// Get signer from private key (for backend operations)
export function getServerSigner(privateKey: string) {
  const provider = getServerProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Get contract instances (server-side)
export function getContracts(signerOrProvider: ethers.Signer | ethers.Provider) {
  return {
    etfVault: new ethers.Contract(CONTRACT_ADDRESSES.etfVault, ETFVaultABI, signerOrProvider),
    wflow: new ethers.Contract(CONTRACT_ADDRESSES.wflow, TokenABI, signerOrProvider),
    trump: new ethers.Contract(CONTRACT_ADDRESSES.trump, TokenABI, signerOrProvider),
    ankrFlow: new ethers.Contract(CONTRACT_ADDRESSES.ankrFlow, TokenABI, signerOrProvider),
    usdc: new ethers.Contract(CONTRACT_ADDRESSES.usdc, TokenABI, signerOrProvider),
    weth: new ethers.Contract(CONTRACT_ADDRESSES.weth, TokenABI, signerOrProvider)
  };
}

// Helper to format amounts from wei to human-readable
export function formatAmount(amount: bigint | string) {
  return ethers.formatEther(amount);
}

// Helper to convert amounts to wei
export function parseAmount(amount: string | number) {
  return ethers.parseEther(amount.toString());
}

// Get chain token name by address
export function getTokenName(address: string): string {
  const addressLower = address.toLowerCase();
  const addressMap: Record<string, string> = {
    [CONTRACT_ADDRESSES.wflow.toLowerCase()]: 'WFLOW',
    [CONTRACT_ADDRESSES.trump.toLowerCase()]: 'TRUMP',
    [CONTRACT_ADDRESSES.ankrFlow.toLowerCase()]: 'ankrFLOW',
    [CONTRACT_ADDRESSES.usdc.toLowerCase()]: 'USDC',
    [CONTRACT_ADDRESSES.weth.toLowerCase()]: 'WETH'
  };
  
  return addressMap[addressLower] || 'Unknown';
}

// Get token logo URL by address
export function getTokenLogo(address: string): string {
  const tokenName = getTokenName(address);
  
  // Map token names to logo paths
  const logoMap: Record<string, string> = {
    'WFLOW': '/tornado.png',
    'TRUMP': '/whalemusic.png',
    'ankrFLOW': '/jellyfish.png',
    'USDC': '/flower.png',
    'WETH': '/sandwave.png',
    'Unknown': '/snail.png'
  };
  
  return logoMap[tokenName] || logoMap['Unknown'];
} 