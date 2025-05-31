'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFlareOracle } from '@/hooks';
import { FEED_CATEGORIES } from '@/app/config/flare-contract';
import { Search, RefreshCw, TrendingUp, TrendingDown, Edit, Network, Zap, Plus, Trash2, Bot, BarChart3, Shield, Wallet } from 'lucide-react';
import { OracleDiagnostic } from '@/components/etf/oracle-diagnostic';
import { ethers } from 'ethers';
import ETFVaultJSON from '@/lib/abis/FlowETFVault.json';
import WrappedFlowJSON from '@/lib/abis/WrappedFlow.json';
import FlowUSDCJSON from '@/lib/abis/FlowUSDC.json';
import FlowWETHJSON from '@/lib/abis/FlowWETH.json';
import AnkrFlowJSON from '@/lib/abis/AnkrFlow.json';
import TrumpFlowJSON from '@/lib/abis/TrumpFlow.json';

// Import centralized contract addresses
import { CONTRACT_ADDRESSES, ASSET_ADDRESSES, NETWORK_CONFIG } from '@/config/contracts';

// Use Privy for wallet management
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallets } from '@/components/PrivyWalletsWrapper';

// Ensure correct ABI array format
const vaultAbi = Array.isArray(ETFVaultJSON) 
  ? ETFVaultJSON 
  : ETFVaultJSON.abi;

const tokenAbis = {
  WFLOW: Array.isArray(WrappedFlowJSON) ? WrappedFlowJSON : WrappedFlowJSON.abi,
  USDC: Array.isArray(FlowUSDCJSON) ? FlowUSDCJSON : FlowUSDCJSON.abi,
  WETH: Array.isArray(FlowWETHJSON) ? FlowWETHJSON : FlowWETHJSON.abi,
  ankrFLOW: Array.isArray(AnkrFlowJSON) ? AnkrFlowJSON : AnkrFlowJSON.abi,
  TRUMP: Array.isArray(TrumpFlowJSON) ? TrumpFlowJSON : TrumpFlowJSON.abi
};

// Token logo mapping
const getTokenLogo = (symbol: string) => {
  const token = symbol.replace('/USD', '');
  const logos: Record<string, string> = {
    'BTC': '₿',
    'ETH': 'Ξ', 
    'SOL': '◉',
    'ADA': '₳',
    'DOT': '●',
    'DOGE': 'Ð',
    'XRP': '✕',
    'USDC': '$',
    'USDT': '₮',
    'BNB': '◆',
    'AVAX': '▲',
    'SHIB': '🐕',
    'TON': '💎',
    'TRX': '◊',
    'LINK': '🔗',
    'NEAR': '◎',
    'MATIC': '◢',
    'UNI': '🦄',
    'ICP': '∞',
    'PEPE': '🐸',
    'LTC': 'Ł',
    'HYPE': '⚡',
    'CRO': '◉',
    'ETC': '◆',
    'APT': '◉',
    'POL': '◢',
    'RENDER': '⚡',
    'XLM': '⭐',
    'VET': '⚡',
    'FIL': '◉',
    'HBAR': '◈',
    'MNT': '◎',
    'OP': '🔴',
    'ARB': '🔷',
    'BONK': '🐕',
    'ALGO': '◉',
    'AAVE': '👻',
    'TAO': '☯',
    'JUP': '♃',
    'WIF': '🐕',
    'SUI': '💧',
    'FLOKI': '🐕',
    'GALA': '🎮',
    'USDS': '$',
    'PAXG': '🥇',
    'NOT': '❌',
    'ATOM': '⚛',
    'SEI': '◉',
    'QNT': '◎',
    'BRETT': '🎭',
    'JASMY': '◉',
    'BEAM': '⚡',
    'TRUMP': '🇺🇸',
    'BASE': '🔵',
    'STRK': '◉',
    'SAND': '🏖',
    'FET': '🤖',
    'USDX': '$',
    'OCEAN': '🌊'
  };
  return logos[token] || '◉';
};

interface PortfolioHolding {
  symbol: string;
  allocation: number;
  value: number;
  units?: string;
  price?: string;
}

export default function FlowEtfPage() {
  const { 
    feeds, 
    loading, 
    error, 
    refreshFeeds, 
    testFeedIndices,
    getTopGainers, 
    getTopLosers, 
    getFeedsByCategory,
    searchFeeds 
  } = useFlareOracle();

  // Privy wallet integration
  const { authenticated, ready, login } = usePrivy();
  const { wallets, hasWallets } = usePrivyWallets();

  const [selectedCategory, setSelectedCategory] = useState(FEED_CATEGORIES.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // AI Assistant states (for modal only)
  const [aiCommand, setAiCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // ETF contract state
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState("");
  const [etfInfo, setEtfInfo] = useState({ name: "", symbol: "", agent: "", totalValue: "0" });
  const [contractAssets, setContractAssets] = useState<string[]>([]);
  const [userBalance, setUserBalance] = useState("0");
  const [contractLoading, setContractLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositToken, setDepositToken] = useState<keyof typeof ASSET_ADDRESSES>("WFLOW");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawToken, setWithdrawToken] = useState<keyof typeof ASSET_ADDRESSES>("WFLOW");

  // Portfolio holdings state
  const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([
    { symbol: 'BTC/USD', allocation: 40, value: 104194.08, units: '' },
    { symbol: 'ETH/USD', allocation: 30, value: 3600, units: '104 units' },
    { symbol: 'SOL/USD', allocation: 15, value: 1700, units: '9.64 units' },
    { symbol: 'ADA/USD', allocation: 10, value: 1600, units: '1479.56' },
    { symbol: 'DOT/USD', allocation: 5, value: 500, units: '122.85', price: '$4.07' }
  ]);

  const [editedHoldings, setEditedHoldings] = useState<PortfolioHolding[]>([]);

  // Initialize provider to Flow EVM Testnet RPC and setup Privy wallet integration
  useEffect(() => {
    // Configure Flow EVM Testnet provider
    const rpcProvider = new ethers.JsonRpcProvider(
      NETWORK_CONFIG.rpcUrls[0],
      {
        // Use a simpler network config that matches the Networkish type
        name: NETWORK_CONFIG.name,
        chainId: NETWORK_CONFIG.chainId
      },
      {
        polling: true,
        pollingInterval: 5000,
        batchMaxCount: 1, // Reduce batch size for better compatibility
      }
    );
    
    // Test provider connectivity
    rpcProvider.getNetwork().then((network) => {
      console.log('✅ Flow EVM Testnet provider connected:', network);
      setProvider(rpcProvider);
    }).catch((error) => {
      console.error('❌ Flow EVM provider connection failed:', error);
      // Fallback to basic provider
      const fallbackProvider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrls[0]);
      setProvider(fallbackProvider);
    });

    // Setup Privy wallet integration
    const setupPrivyWallet = async () => {
      if (!ready) return;
      
      if (authenticated && hasWallets) {
        try {
          const wallet = wallets[0];
          if (wallet && wallet.address) {
            setUserAddress(wallet.address);
            
            // Create ethers provider/signer from Privy wallet
            // Use walletClientType instead of walletClient according to the Privy type definitions
            if (wallet.walletClientType === 'privy') {
              // For Privy embedded wallets, use the provider from window.ethereum
              if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                setProvider(provider);
                const signer = await provider.getSigner();
                setSigner(signer);
              }
            } else {
              // For other wallet types, use a direct connection to the wallet's RPC
              try {
                const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrls[0]);
                setProvider(provider);
              } catch (error) {
                console.error("Failed to create provider for wallet:", error);
              }
            }
          }
        } catch (error) {
          console.error("Error setting up Privy wallet:", error);
        }
      } else {
        // Reset wallet state if not authenticated
        setUserAddress("");
        setSigner(null);
        // Keep RPC provider for read-only operations
        setProvider(rpcProvider);
      }
    };

    setupPrivyWallet();
  }, [ready, authenticated, hasWallets]);

  // Fetch ETF contract basic info
  const fetchEtfInfo = useCallback(async () => {
    if (!provider) return;
    
    try {
      setContractLoading(true);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, provider);
      
      // Use individual try/catch blocks for each call to handle errors properly
      const name = await contract.name().catch(() => "Flow Multi-Asset ETF");
      const symbol = await contract.symbol().catch(() => "FMAF");
      const agent = await contract.agentWallet().catch(() => CONTRACT_ADDRESSES.agentWallet);
      const totalValue = await contract.getTotalValue().catch(() => "0");
      
      setEtfInfo({
        name,
        symbol,
        agent,
        totalValue
      });
      
      // Update user's ETF share balance
      if (userAddress) {
        try {
          const balance = await contract.balanceOf(userAddress);
          setUserBalance(balance.toString());
        } catch (error) {
          console.error("Error fetching user balance:", error);
          setUserBalance("0");
        }
      }
    } catch (error) {
      console.error("Error fetching ETF info:", error);
    } finally {
      setContractLoading(false);
    }
  }, [provider, userAddress]);

  // Fetch active assets in the ETF
  const fetchActiveAssets = useCallback(async () => {
    if (!provider) return;
    
    setContractLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, provider);
      const list = await contract.getActiveAssets().catch(() => []);
      setContractAssets(list);

      // Update portfolio holdings based on actual contract data
      if (list.length > 0) {
        const updatedHoldings: PortfolioHolding[] = [];
        
        for (const assetAddress of list) {
          try {
            // Find the token symbol based on address
            const tokenSymbol = Object.entries(ASSET_ADDRESSES).find(
              ([, addr]) => addr.toLowerCase() === assetAddress.toLowerCase()
            )?.[0] || 'Unknown';
            
            // Get ERC20 token contract to fetch name and decimals
            const tokenContract = new ethers.Contract(
              assetAddress,
              tokenAbis[tokenSymbol as keyof typeof tokenAbis] || tokenAbis.WFLOW,
              provider
            );
            
            try {
              // Get token information individually to avoid unused variables
              // Skip name since we already have the token symbol
              const assetData = await contract.getAsset(assetAddress).catch(() => ({ balance: 0, targetWeight: 0 }));
              const decimals = await tokenContract.decimals().catch(() => 18);
              
              // Get balance from the asset struct
              const balance = assetData?.balance || 0;
              const targetWeight = assetData?.targetWeight || 0;
              
              // Calculate allocation based on target weight
              const allocation = parseInt(targetWeight.toString()) / 100;
              
              // Format balance for display using the correct decimals
              const units = ethers.formatUnits(balance, decimals);
              const value = 0; // Mock value for now
              
              updatedHoldings.push({
                symbol: tokenSymbol,
                allocation,
                value,
                units
              });
            } catch (error) {
              console.error(`Error fetching details for asset ${tokenSymbol}:`, error);
              // Add a placeholder in case of error
              updatedHoldings.push({
                symbol: tokenSymbol,
                allocation: 0,
                value: 0,
                units: '0'
              });
            }
          } catch (error) {
            console.error(`Error processing asset ${assetAddress}:`, error);
          }
        }
        
        if (updatedHoldings.length > 0) {
          setPortfolioHoldings(updatedHoldings);
        }
      }
    } catch (error) {
      console.error("Error fetching active assets:", error);
    } finally {
      setContractLoading(false);
    }
  }, [provider, CONTRACT_ADDRESSES.etfVault, ASSET_ADDRESSES, vaultAbi]);

  // Use both memoized functions in the useEffect
  useEffect(() => {
    if (provider) {
      fetchEtfInfo();
      fetchActiveAssets();
    }
  }, [provider, userAddress, fetchEtfInfo, fetchActiveAssets]);

  // Handle deposit to ETF
  const handleDeposit = async () => {
    if (!signer || !depositAmount) return;
    
    setContractLoading(true);
    try {
      const tokenAddress = ASSET_ADDRESSES[depositToken];
      const amount = ethers.parseEther(depositAmount);
      
      // First approve the token transfer
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbis[depositToken], signer);
      const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.etfVault, amount);
      await approveTx.wait();
      
      // Then deposit to the ETF
      const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, signer);
      const depositTx = await vaultContract.deposit(tokenAddress, amount);
      await depositTx.wait();
      
      // Refresh data
      await fetchEtfInfo();
      await fetchActiveAssets();
      
      // Reset input
      setDepositAmount("");
      
      alert("Deposit successful!");
    } catch (error) {
      console.error("Error depositing to ETF:", error);
      alert("Failed to deposit. See console for details.");
    } finally {
      setContractLoading(false);
    }
  };
  
  // Handle withdraw from ETF
  const handleWithdraw = async () => {
    if (!signer || !withdrawAmount) return;
    
    setContractLoading(true);
    try {
      const shares = ethers.parseEther(withdrawAmount);
      const tokenAddress = ASSET_ADDRESSES[withdrawToken];
      // Set minAmountOut to 0 for simplicity - in production, this should be calculated
      const minAmountOut = 0;
      
      const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, signer);
      const withdrawTx = await vaultContract.withdraw(shares, tokenAddress, minAmountOut);
      await withdrawTx.wait();
      
      // Refresh data
      await fetchEtfInfo();
      await fetchActiveAssets();
      
      // Reset input
      setWithdrawAmount("");
      
      alert("Withdrawal successful!");
    } catch (error) {
      console.error("Error withdrawing from ETF:", error);
      alert("Failed to withdraw. See console for details.");
    } finally {
      setContractLoading(false);
    }
  };

  // Portfolio assets count
  const portfolioAssets = portfolioHoldings.length;

  // Available symbols from feeds
  const availableSymbols = feeds.map(feed => feed.name).sort();

  // Initialize edited holdings when modal opens
  const handleEditModalOpen = () => {
    setEditedHoldings([...portfolioHoldings]);
    setIsEditModalOpen(true);
  };

  // Add new holding
  const addHolding = () => {
    const newHolding: PortfolioHolding = {
      symbol: '',
      allocation: 0,
      value: 0,
      units: ''
    };
    setEditedHoldings([...editedHoldings, newHolding]);
  };

  // Remove holding
  const removeHolding = (index: number) => {
    const updated = editedHoldings.filter((_, i) => i !== index);
    setEditedHoldings(updated);
  };

  // Update holding
  const updateHolding = (index: number, field: keyof PortfolioHolding, value: string | number) => {
    const updated = [...editedHoldings];
    updated[index] = { ...updated[index], [field]: value };
    setEditedHoldings(updated);
  };

  // Validate and save portfolio
  const savePortfolio = () => {
    // Validate allocations sum to 100%
    const totalAllocation = editedHoldings.reduce((sum, holding) => sum + holding.allocation, 0);
    
    if (Math.abs(totalAllocation - 100) > 0.01) {
      alert(`Total allocation must equal 100%. Current total: ${totalAllocation.toFixed(2)}%`);
      return;
    }

    // Validate all holdings have symbols
    const hasEmptySymbols = editedHoldings.some(holding => !holding.symbol);
    if (hasEmptySymbols) {
      alert('All holdings must have a symbol selected.');
      return;
    }

    // Save changes
    setPortfolioHoldings([...editedHoldings]);
    setIsEditModalOpen(false);
  };

  // Auto-calculate total allocation
  const totalAllocation = editedHoldings.reduce((sum, holding) => sum + holding.allocation, 0);

  // AI Execute function (for modal)
  const executeAICommand = async () => {
    if (!aiCommand.trim()) return;
    
    setIsExecuting(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const command = aiCommand.toLowerCase();
    let response = '';
    let suggestedStrategy: PortfolioHolding[] | null = null;
    
    // AI Natural Language Processing
    if (command.includes('conservative') || command.includes('safe') || command.includes('stable')) {
      response = '🛡️ Based on your request for a conservative approach, I recommend a low-risk portfolio focused on stablecoins and established cryptocurrencies.';
      suggestedStrategy = generateStrategy('Conservative') || null;
      
    } else if (command.includes('aggressive') || command.includes('growth') || command.includes('risky') || command.includes('high return')) {
      response = '🚀 For aggressive growth, I suggest focusing on emerging assets and top performers with higher volatility but greater upside potential.';
      suggestedStrategy = generateStrategy('Aggressive') || null;
      
    } else if (command.includes('balanced') || command.includes('diversif') || command.includes('mix')) {
      response = '⚖️ A balanced approach would diversify across major cryptocurrencies while maintaining reasonable risk levels.';
      suggestedStrategy = generateStrategy('Balanced') || null;
      
    } else if (command.includes('ai') || command.includes('tech') || command.includes('future') || command.includes('innovation')) {
      response = '🤖 For future-focused investments, I recommend AI and technology tokens with strong fundamentals and growth potential.';
      suggestedStrategy = generateStrategy('AI Focus') || null;
      
    } else if (command.includes('rebalance') || command.includes('optimize') || command.includes('improve')) {
      // Analyze current portfolio and suggest improvements
      const currentTotal = editedHoldings.reduce((sum, h) => sum + h.allocation, 0);
      const hasStablecoins = editedHoldings.some(h => h.symbol.includes('USDC') || h.symbol.includes('USDT'));
      const hasMajorCryptos = editedHoldings.some(h => h.symbol.includes('BTC') || h.symbol.includes('ETH'));
      
      if (currentTotal > 105 || currentTotal < 95) {
        response = '📊 Your current allocations don\'t sum to 100%. I recommend rebalancing to achieve proper allocation percentages.';
      } else if (!hasStablecoins && !hasMajorCryptos) {
        response = '🔄 Your portfolio lacks stability anchors. Consider adding some stablecoins or major cryptocurrencies like BTC/ETH.';
        suggestedStrategy = generateStrategy('Balanced') || null;
      } else {
        response = '✨ Your portfolio looks well-structured! Consider minor adjustments based on recent market performance.';
      }
      
    } else if (command.includes('bitcoin') || command.includes('btc')) {
      response = '₿ Bitcoin allocation recommendation: 20-30% for conservative, 15-25% for balanced, 10-20% for aggressive portfolios.';
      
    } else if (command.includes('ethereum') || command.includes('eth')) {
      response = 'Ξ Ethereum is excellent for DeFi exposure. Recommended allocation: 25-35% depending on your risk tolerance.';
      
    } else if (command.includes('stablecoin') || command.includes('stable')) {
      response = '💲 Stablecoins provide stability and liquidity. Recommended for 20-40% of conservative portfolios, less for aggressive strategies.';
      
    } else if (command.includes('defi') || command.includes('yield')) {
      const defiTokens = feeds.filter(f => ['UNI/USD', 'AAVE/USD', 'LINK/USD', 'JUP/USD'].includes(f.name));
      response = `🏦 For DeFi exposure, consider tokens like ${defiTokens.map(f => f.symbol).join(', ')}. Allocate 10-20% for moderate DeFi exposure.`;
      
    } else {
      // Generic helpful response
      response = `🎯 I understand you want to "${aiCommand}". Here are some suggestions:\n\n` +
                '• Try "make it more conservative" for safer allocations\n' +
                '• Say "aggressive growth portfolio" for higher risk/reward\n' +
                '• Ask for "balanced diversification" for mixed strategy\n' +
                '• Request "AI and tech focus" for future-oriented investments\n' +
                '• Say "rebalance my portfolio" for optimization suggestions';
    }
    
    // Show response and optionally apply strategy
    if (suggestedStrategy) {
      const strategyPreview = suggestedStrategy.map(h => 
        `• ${h.symbol}: ${h.allocation}% ($${h.value})`
      ).join('\n');
      
      const applyStrategy = confirm(
        `${response}\n\n` +
        `Suggested Portfolio:\n${strategyPreview}\n\n` +
        `Would you like to apply this strategy to your portfolio?`
      );
      
      if (applyStrategy) {
        setEditedHoldings(suggestedStrategy);
        alert('✅ AI strategy applied! Click "💾 Save" to confirm changes.');
      }
    } else {
      alert(`🤖 AI Analysis:\n\n${response}`);
    }
    
    setIsExecuting(false);
    setAiCommand('');
  };

  // Strategy generation logic
  const generateStrategy = (strategyType: string): PortfolioHolding[] | undefined => {
    if (feeds.length === 0) {
      alert('❌ Cannot generate strategy: No market data available. Please wait for oracle feeds to load.');
      return undefined;
    }

    let newHoldings: PortfolioHolding[] = [];
    
    switch (strategyType) {
      case 'Conservative':
        // Conservative: Focus on stablecoins and major cryptos, lower volatility
        newHoldings = [
          { symbol: 'USDC/USD', allocation: 30, value: 3000, units: '3000 USDC' },
          { symbol: 'USDT/USD', allocation: 25, value: 2500, units: '2500 USDT' },
          { symbol: 'BTC/USD', allocation: 25, value: 2500, units: '~0.025 BTC' },
          { symbol: 'ETH/USD', allocation: 20, value: 2000, units: '~0.65 ETH' }
        ];
        break;
        
      case 'Balanced':
        // Balanced: Mix of major cryptos with some exposure to emerging assets
        const balancedAssets = feeds.filter(feed => 
          ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD', 'AVAX/USD', 'LINK/USD', 'UNI/USD'].includes(feed.name)
        ).slice(0, 6);
        
        const balancedAllocations = [35, 25, 15, 10, 10, 5];
        newHoldings = balancedAssets.map((feed, index) => ({
          symbol: feed.name,
          allocation: balancedAllocations[index] || 5,
          value: (balancedAllocations[index] || 5) * 100,
          units: `${((balancedAllocations[index] || 5) * 100 / feed.price).toFixed(4)} ${feed.symbol}`
        }));
        break;
        
      case 'Aggressive':
        // Aggressive: Higher allocation to growth tokens and emerging assets
        const topPerformers = feeds
          .filter(feed => feed.change24h !== undefined && feed.change24h > 0)
          .sort((a, b) => (b.change24h || 0) - (a.change24h || 0))
          .slice(0, 3);
          
        const emergingAssets = feeds.filter(feed => 
          ['SOL/USD', 'AVAX/USD', 'NEAR/USD', 'SUI/USD', 'APT/USD', 'ARB/USD', 'OP/USD'].includes(feed.name)
        ).slice(0, 4);
        
        newHoldings = [
          { symbol: 'BTC/USD', allocation: 20, value: 2000, units: '~0.02 BTC' },
          { symbol: 'ETH/USD', allocation: 25, value: 2500, units: '~0.8 ETH' },
          ...topPerformers.slice(0, 2).map((feed, idx) => ({
            symbol: feed.name,
            allocation: idx === 0 ? 20 : 15,
            value: (idx === 0 ? 20 : 15) * 100,
            units: `${((idx === 0 ? 20 : 15) * 100 / feed.price).toFixed(4)} ${feed.symbol}`
          })),
          ...emergingAssets.slice(0, 2).map(feed => ({
            symbol: feed.name,
            allocation: 10,
            value: 1000,
            units: `${(1000 / feed.price).toFixed(4)} ${feed.symbol}`
          }))
        ];
        break;
        
      case 'AI Focus':
        // AI Focus: AI and tech-related tokens with smart diversification
        const aiTokens = feeds.filter(feed => 
          ['RENDER/USD', 'FET/USD', 'TAO/USD', 'OCEAN/USD', 'NEAR/USD'].includes(feed.name)
        );
        
        const techTokens = feeds.filter(feed => 
          ['ETH/USD', 'SOL/USD', 'LINK/USD', 'UNI/USD', 'AAVE/USD'].includes(feed.name)
        );
        
        newHoldings = [
          { symbol: 'ETH/USD', allocation: 30, value: 3000, units: '~0.95 ETH' },
          { symbol: 'BTC/USD', allocation: 20, value: 2000, units: '~0.02 BTC' },
          ...aiTokens.slice(0, 3).map((feed, index) => ({
            symbol: feed.name,
            allocation: index === 0 ? 20 : 15,
            value: (index === 0 ? 20 : 15) * 100,
            units: `${((index === 0 ? 20 : 15) * 100 / feed.price).toFixed(4)} ${feed.symbol}`
          })),
          ...techTokens.slice(2, 4).map(feed => ({
            symbol: feed.name,
            allocation: 10,
            value: 1000,
            units: `${(1000 / feed.price).toFixed(4)} ${feed.symbol}`
          }))
        ];
        break;
        
      default:
        return undefined;
    }
    
    // Ensure allocations sum to 100% and adjust if needed
    const totalAllocation = newHoldings.reduce((sum, h) => sum + h.allocation, 0);
    if (totalAllocation !== 100) {
      const adjustmentFactor = 100 / totalAllocation;
      newHoldings = newHoldings.map(h => ({
        ...h,
        allocation: Number((h.allocation * adjustmentFactor).toFixed(1)),
        value: Number((h.value * adjustmentFactor).toFixed(2))
      }));
    }
    
    return newHoldings;
  };

  // Apply strategy with confirmation
  const applyStrategy = (strategyType: string) => {
    const newStrategy = generateStrategy(strategyType);
    
    if (!newStrategy) return;
    
    // Show strategy preview
    const strategyPreview = newStrategy.map(h => 
      `• ${h.symbol}: ${h.allocation}% (${h.units})`
    ).join('\n');
    
    const strategyDescriptions = {
      'Conservative': '🛡️ Low-risk strategy focusing on stablecoins and major cryptocurrencies for capital preservation.',
      'Balanced': '⚖️ Diversified approach balancing growth potential with stability across established cryptocurrencies.',
      'Aggressive': '🚀 High-growth strategy targeting emerging assets and top performers for maximum returns.',
      'AI Focus': '🤖 Technology-focused portfolio emphasizing AI and DeFi tokens with future growth potential.'
    };
    
    const confirmed = confirm(
      `${strategyDescriptions[strategyType as keyof typeof strategyDescriptions]}\n\n` +
      `Proposed ${strategyType} Portfolio:\n${strategyPreview}\n\n` +
      `Total Portfolio Value: $${newStrategy.reduce((sum, h) => sum + h.value, 0).toLocaleString()}\n\n` +
      `Would you like to apply this ${strategyType.toLowerCase()} strategy to your portfolio?`
    );
    
    if (confirmed) {
      setEditedHoldings(newStrategy);
      
      // Show success message with next steps
      setTimeout(() => {
        alert(
          `✅ ${strategyType} strategy applied successfully!\n\n` +
          `Your portfolio has been updated with ${newStrategy.length} assets.\n` +
          `Total allocation: ${newStrategy.reduce((sum, h) => sum + h.allocation, 0)}%\n\n` +
          `Click "💾 Save" to confirm these changes.`
        );
      }, 100);
    }
  };

  // Filter feeds
  const filteredFeeds = useMemo(() => {
    let result = getFeedsByCategory(selectedCategory);
    if (searchQuery.trim()) {
      result = searchFeeds(searchQuery);
    }
    return result;
  }, [getFeedsByCategory, searchFeeds, selectedCategory, searchQuery]);

  const topGainers = getTopGainers(5);
  const topLosers = getTopLosers(5);

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    );
  };

  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-6">
      {/* ETF Header Section with Integrated Privy Wallet */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Flow ETF Manager</h1>
          <p className="text-muted-foreground">Manage your ETF portfolio powered by Flare Oracle</p>
        </div>
        <div className="flex gap-2">
          {!ready ? (
            <div className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="font-medium">Loading wallet...</span>
            </div>
          ) : authenticated && userAddress ? (
            <div className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Connected: {userAddress.substring(0, 6)}...{userAddress.substring(38)}</span>
              <span className="text-xs text-green-600">({wallets[0]?.walletClientType || 'Wallet'})</span>
            </div>
          ) : (
            <Button onClick={login} className="gap-2">
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {/* ETF Vault Info */}
      {(etfInfo.name || contractLoading) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary">🔒</span>
                ETF Contract Information
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    fetchEtfInfo();
                    fetchActiveAssets();
                  }}
                  variant="outline"
                  size="sm"
                  disabled={contractLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${contractLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Badge variant="outline" className="text-xs">
                  Chain ID: {NETWORK_CONFIG.chainId}
                </Badge>
              </div>
            </div>
            {etfInfo.name && (
              <CardDescription>
                {etfInfo.name} ({etfInfo.symbol}) - Flow Multi-Asset ETF
                <br />
                <span className="text-xs font-mono">Contract: {CONTRACT_ADDRESSES.etfVault}</span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {contractLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Total Value</div>
                  <div className="text-xl font-bold">{parseFloat(etfInfo.totalValue).toLocaleString()} ETH</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Your Balance</div>
                  <div className="text-xl font-bold">{parseFloat(userBalance).toLocaleString()} {etfInfo.symbol}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Assets</div>
                  <div className="text-xl font-bold">{contractAssets.length}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-sm">Agent Wallet</div>
                  <div className="text-sm font-mono text-muted-foreground">{etfInfo.agent.substring(0, 10)}...{etfInfo.agent.substring(36)}</div>
                </div>
                
                {authenticated && userAddress && signer && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Card className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Deposit to ETF</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex gap-2">
                          <Select value={depositToken} onValueChange={(v) => setDepositToken(v as keyof typeof ASSET_ADDRESSES)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select token" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(ASSET_ADDRESSES).map((token) => (
                                <SelectItem key={token} value={token}>{token}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                          />
                          <Button onClick={handleDeposit} disabled={contractLoading || !depositAmount}>
                            Deposit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Withdraw from ETF</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex gap-2">
                          <Select value={withdrawToken} onValueChange={(v) => setWithdrawToken(v as keyof typeof ASSET_ADDRESSES)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select token" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(ASSET_ADDRESSES).map((token) => (
                                <SelectItem key={token} value={token}>{token}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Shares to withdraw"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                          />
                          <Button onClick={handleWithdraw} disabled={contractLoading || !withdrawAmount}>
                            Withdraw
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Your balance: {parseFloat(userBalance).toLocaleString()} {etfInfo.symbol} shares
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">${parseFloat(etfInfo.totalValue).toLocaleString()}</div>
            <div className="text-muted-foreground text-sm">ETF Value</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-sm font-bold">{currentTime} AM</div>
            <div className="text-muted-foreground text-sm">Last Update</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs font-mono">{CONTRACT_ADDRESSES.etfVault.substring(0, 8)}...{CONTRACT_ADDRESSES.etfVault.substring(38)}</div>
            <div className="text-muted-foreground text-sm">Contract</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{portfolioAssets}</div>
            <div className="text-muted-foreground text-sm">Portfolio Assets</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-2">
              <Button 
                onClick={refreshFeeds} 
                className="w-full"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={() => {
                  console.log('🔍 DEBUG: Testing oracle connection and data quality...');
                  console.log('🌐 Browser info:', navigator.userAgent);
                  console.log('🔗 Current URL:', window.location.href);
                  console.log('⚙️ Network config:', {
                    rpcUrl: 'https://coston2-api.flare.network/ext/C/rpc',
                    chainId: 114,
                    contractAddress: '0x93420cD7639AEe3dFc7AA18aDe7955Cfef4b44b1'
                  });
                  
                  console.log('📊 Current feeds state:', { 
                    feedsLength: feeds.length, 
                    loading, 
                    error,
                    sampleFeeds: feeds.slice(0, 5).map(feed => ({
                      name: feed.name,
                      symbol: feed.symbol,
                      price: feed.price,
                      decimals: feed.decimals,
                      timestamp: feed.timestamp,
                      timestampDate: new Date(feed.timestamp * 1000).toLocaleString(),
                      ageInMinutes: Math.round((Date.now() - feed.timestamp * 1000) / 1000 / 60)
                    }))
                  });
                  
                  // Check for unrealistic prices
                  const unrealisticFeeds = feeds.filter(feed => {
                    if (feed.symbol === 'ETH' && (feed.price < 1000 || feed.price > 10000)) return true;
                    if (feed.symbol === 'BTC' && (feed.price < 30000 || feed.price > 200000)) return true;
                    if (feed.symbol === 'SOL' && (feed.price < 10 || feed.price > 1000)) return true;
                    return false;
                  });
                  
                  if (unrealisticFeeds.length > 0) {
                    console.warn('🚨 UNREALISTIC PRICES DETECTED:', unrealisticFeeds.map(feed => ({
                      symbol: feed.symbol,
                      price: feed.price,
                      expectedRange: feed.symbol === 'ETH' ? '$1000-$10000' : 
                                    feed.symbol === 'BTC' ? '$30000-$200000' :
                                    feed.symbol === 'SOL' ? '$10-$1000' : 'N/A'
                    })));
                  }
                  
                  // Test ETH specifically
                  const ethFeed = feeds.find(f => f.symbol === 'ETH');
                  if (ethFeed) {
                    console.log('🔍 ETH DETAILED ANALYSIS:', {
                      name: ethFeed.name,
                      price: ethFeed.price,
                      decimals: ethFeed.decimals,
                      timestamp: ethFeed.timestamp,
                      timestampDate: new Date(ethFeed.timestamp * 1000).toLocaleString(),
                      ageInMinutes: Math.round((Date.now() - ethFeed.timestamp * 1000) / 1000 / 60),
                      isStale: (Date.now() - ethFeed.timestamp * 1000) > 300000, // older than 5 minutes
                      isRealistic: ethFeed.price > 1000 && ethFeed.price < 10000
                    });
                  } else {
                    console.log('❌ ETH feed not found in feeds array');
                  }
                  
                  // Test feed indices mapping
                  console.log('🧪 Testing individual feed indices...');
                  testFeedIndices();
                  
                  // Refresh feeds after testing
                  console.log('🔄 Refreshing feeds...');
                  refreshFeeds();
                }}
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                🔍 Debug Oracle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Status Alert */}
      {!authenticated && ready && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Wallet Connection Required
            </CardTitle>
            <CardDescription className="text-orange-600">
              Please connect your wallet to interact with the ETF contract and perform deposits/withdrawals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={login} className="gap-2">
              <Wallet className="w-4 h-4" />
              Connect Wallet with Privy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error Handling */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Oracle Connection Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refreshFeeds} variant="outline" className="border-red-300 text-red-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Oracle Diagnostics - Show when there are errors or no feeds */}
      {(error || (!loading && feeds.length === 0)) && (
        <OracleDiagnostic />
      )}

      {/* Oracle Status */}
      {!loading && !error && feeds.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 font-medium">
                  Live Oracle Data Connected - {feeds.length} active feeds from Flare Network
                </span>
              </div>
              <div className="text-green-600 text-sm">
                Last update: {new Date().toLocaleTimeString()}
              </div>
            </div>
            {/* Debug info for first few feeds */}
            <div className="mt-2 text-xs text-green-700">
              Sample prices: {feeds.slice(0, 3).map(feed => `${feed.symbol}: ${formatPrice(feed.price)}`).join(' • ')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Portfolio Holdings - Left 2/3 */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  📊 Portfolio Holdings
                </CardTitle>
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleEditModalOpen}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Portfolio
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>AI Portfolio Assistant</DialogTitle>
                      <DialogDescription>
                        Powered by Advanced ML Algorithms
                      </DialogDescription>
                    </DialogHeader>
                    
                    {/* AI Portfolio Assistant Modal Content */}
                    <div className="space-y-6">
                      {/* Natural Language Commands & Quick AI Strategies */}
                      <div className="grid grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">💬</span>
                              Natural Language Commands
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Input
                              value={aiCommand}
                              onChange={(e) => setAiCommand(e.target.value)}
                              placeholder="e.g., 'Make it more conservative', 'Aggressive growth portfolio', 'Add more DeFi exposure'..."
                            />
                            <Button 
                              onClick={executeAICommand}
                              disabled={isExecuting || !aiCommand.trim()}
                              className="w-full"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              {isExecuting ? 'Executing...' : 'Execute'}
                            </Button>
                            <div className="text-xs text-muted-foreground">
                              💡 Try &quot;Rebalance for optimal growth&quot; or &quot;Make it more conservative&quot;
                            </div>
                          </CardContent>
                        </Card>

                        {/* Quick AI Strategies */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <span className="text-orange-500">⚡</span>
                              Quick AI Strategies
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                onClick={() => applyStrategy('Conservative')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                              >
                                <Shield className="w-4 h-4 mr-1" />
                                Conservative
                              </Button>
                              <Button 
                                onClick={() => applyStrategy('Balanced')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                              >
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Balanced
                              </Button>
                              <Button 
                                onClick={() => applyStrategy('Aggressive')}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                size="sm"
                              >
                                <TrendingUp className="w-4 h-4 mr-1" />
                                Aggressive
                              </Button>
                              <Button 
                                onClick={() => applyStrategy('AI Focus')}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                                size="sm"
                              >
                                <Bot className="w-4 h-4 mr-1" />
                                AI Focus
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Portfolio Holdings Editor */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>📊</span>
                              <CardTitle>Portfolio Holdings</CardTitle>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={savePortfolio}
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                💾 Save
                              </Button>
                              <Button 
                                onClick={() => setIsEditModalOpen(false)}
                                variant="outline" 
                                size="sm" 
                                className="border-red-500 text-red-600 hover:bg-red-50"
                              >
                                ❌ Cancel
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg mt-4">
                            <span className="font-medium">Total Allocation: {totalAllocation.toFixed(1)}%</span>
                            <Badge variant={Math.abs(totalAllocation - 100) < 0.01 ? "default" : "destructive"}>
                              {Math.abs(totalAllocation - 100) < 0.01 ? "Valid" : "Invalid"}
                            </Badge>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Holdings List */}
                          <div className="space-y-3">
                            {editedHoldings.map((holding, index) => (
                              <Card key={index} className="bg-muted/30">
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-12 gap-3 items-center">
                                    <div className="col-span-4">
                                      <Label htmlFor={`symbol-${index}`} className="text-sm font-medium">
                                        Asset Symbol
                                      </Label>
                                      <Select
                                        value={holding.symbol}
                                        onValueChange={(value: string) => updateHolding(index, 'symbol', value)}
                                      >
                                        <SelectTrigger id={`symbol-${index}`}>
                                          <SelectValue placeholder="Select asset" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableSymbols.map((symbol) => (
                                            <SelectItem key={symbol} value={symbol}>
                                              <div className="flex items-center gap-2">
                                                <span>{getTokenLogo(symbol)}</span>
                                                <span>{symbol}</span>
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="col-span-2">
                                      <Label htmlFor={`allocation-${index}`} className="text-sm font-medium">
                                        Allocation %
                                      </Label>
                                      <Input
                                        id={`allocation-${index}`}
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={holding.allocation}
                                        onChange={(e) => updateHolding(index, 'allocation', parseFloat(e.target.value) || 0)}
                                        className="text-center"
                                      />
                                    </div>
                                    
                                    <div className="col-span-2">
                                      <Label htmlFor={`value-${index}`} className="text-sm font-medium">
                                        Value ($)
                                      </Label>
                                      <Input
                                        id={`value-${index}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={holding.value}
                                        onChange={(e) => updateHolding(index, 'value', parseFloat(e.target.value) || 0)}
                                      />
                                    </div>
                                    
                                    <div className="col-span-3">
                                      <Label htmlFor={`units-${index}`} className="text-sm font-medium">
                                        Units (optional)
                                      </Label>
                                      <Input
                                        id={`units-${index}`}
                                        value={holding.units || ''}
                                        onChange={(e) => updateHolding(index, 'units', e.target.value)}
                                        placeholder="e.g., 1.5 units"
                                      />
                                    </div>
                                    
                                    <div className="col-span-1 flex justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeHolding(index)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          
                          {/* Add Asset Button */}
                          <Button
                            onClick={addHolding}
                            variant="outline"
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Asset from {feeds.length} Feeds
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {portfolioHoldings.map((holding, index) => {
                  const feed = feeds.find(f => f.name === holding.symbol);
                  
                  return (
                    <Card key={index} className="bg-muted/30">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm">{getTokenLogo(holding.symbol)}</span>
                            </div>
                            <span className="font-bold text-sm">{holding.symbol}</span>
                          </div>
                          <Badge variant="secondary">{holding.allocation}%</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-green-600 font-bold text-lg mb-1">
                          ${holding.value.toLocaleString()}
                        </div>
                        {holding.units && (
                          <div className="text-muted-foreground text-sm">{holding.units}</div>
                        )}
                        {holding.price && (
                          <div className="text-muted-foreground text-sm">{holding.price}</div>
                        )}
                        {feed && (
                          <div className="text-muted-foreground text-xs mt-1">
                            Live: {formatPrice(feed.price)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Analysis - Right 1/3 */}
        <div className="space-y-4">
          {/* Top Gainers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                📈 Top Gainers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-6 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {topGainers.map((asset, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span>{getTokenLogo(asset.symbol)}</span>
                        <span className="font-medium">{asset.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-bold">
                          {formatPrice(asset.price)}
                        </div>
                        <div className="text-green-600 text-xs">
                          +{asset.change24h?.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Losers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                📉 Top Losers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-6 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {topLosers.map((asset, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span>{getTokenLogo(asset.symbol)}</span>
                        <span className="font-medium">{asset.symbol}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-red-600 font-bold">
                          {formatPrice(asset.price)}
                        </div>
                        <div className="text-red-600 text-xs">
                          {asset.change24h?.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Market Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                🔒 Live Market Data
              </CardTitle>
              {!loading && !error && feeds.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 text-sm font-medium">
                    Real-time from Flare Oracle
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">View All Feeds</Button>
              <Button variant="outline" size="sm">Export Data</Button>
            </div>
          </div>
          <CardDescription>
            Powered by Flare Network FTSO V2 Oracle • Updates every ~1.8 seconds • {feeds.length} active price feeds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets (BTC, ETH, SOL, etc.)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.values(FEED_CATEGORIES).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Market Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              [...Array(12)].map((_, i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))
            ) : filteredFeeds.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No assets found matching your criteria</p>
                <p className="text-sm">Try searching for BTC, ETH, SOL, or clear your filters</p>
              </div>
            ) : (
              filteredFeeds.map((asset) => (
                <Card key={asset.id} className="hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold">{getTokenLogo(asset.symbol)}</span>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm">{asset.symbol}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {asset.category}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {asset.id}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="text-lg font-bold">{formatPrice(asset.price)}</div>
                      <div className="flex items-center justify-between text-xs">
                        {asset.change24h !== undefined && formatChange(asset.change24h)}
                        <span className="text-muted-foreground">
                          {new Date(asset.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Decimals: {asset.decimals} • Feed: {asset.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Technical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Information</CardTitle>
          <CardDescription>Flow EVM & Flare Network Integration Details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Network className="w-4 h-4" />
                Flow EVM Configuration
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Chain ID:</dt>
                  <dd className="font-mono">{NETWORK_CONFIG.chainId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Network:</dt>
                  <dd>{NETWORK_CONFIG.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">RPC URL:</dt>
                  <dd className="font-mono text-xs">{NETWORK_CONFIG.rpcUrls[0].replace('https://', '')}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Native Currency:</dt>
                  <dd>{NETWORK_CONFIG.nativeCurrency.symbol}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Oracle Details (Flare)
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Contract:</dt>
                  <dd className="font-mono text-xs">0x93420cD7639AEe3dFc7AA18aDe7955Cfef4b44b1</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Active Feeds:</dt>
                  <dd>{feeds.length}/59</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Update Rate:</dt>
                  <dd>Every ~1.8 seconds</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cost:</dt>
                  <dd className="text-green-600">FREE</dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
