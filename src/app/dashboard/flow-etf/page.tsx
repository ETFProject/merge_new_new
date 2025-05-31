'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFlareOracle } from '@/hooks/useFlareOracle';
import { FEED_CATEGORIES } from '@/app/config/flare-contract';
import { Search, RefreshCw, TrendingUp, TrendingDown, Edit, Network, Zap, Plus, Trash2, Bot, BarChart3, Shield } from 'lucide-react';
import { OracleDiagnostic } from '@/components/etf/oracle-diagnostic';
import { ethers } from 'ethers';

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

  const [selectedCategory, setSelectedCategory] = useState(FEED_CATEGORIES.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // AI Assistant states (for modal only)
  const [aiCommand, setAiCommand] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  // Portfolio holdings state
  const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([
    { symbol: 'BTC/USD', allocation: 40, value: 104194.08, units: '' },
    { symbol: 'ETH/USD', allocation: 30, value: 3600, units: '104 units' },
    { symbol: 'SOL/USD', allocation: 15, value: 1700, units: '9.64 units' },
    { symbol: 'ADA/USD', allocation: 10, value: 1600, units: '1479.56' },
    { symbol: 'DOT/USD', allocation: 5, value: 500, units: '122.85', price: '$4.07' }
  ]);

  const [editedHoldings, setEditedHoldings] = useState<PortfolioHolding[]>([]);

  const portfolioValue = 10000;
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock AI responses
    const responses = [
      "Analyzed your portfolio. Recommending 5% rebalance from BTC to ETH for optimal growth.",
      "Market conditions suggest increasing SOL allocation by 3% for better diversification.",
      "Risk assessment complete. Consider adding more stablecoins for balanced exposure.",
      "AI optimization suggests rebalancing to capture current momentum opportunities."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    alert(`AI Response: ${randomResponse}`);
    
    setIsExecuting(false);
    setAiCommand('');
  };

  // Strategy selection (for modal)
  const applyStrategy = (strategy: string) => {
    alert(`Applied ${strategy} strategy to your portfolio. Rebalancing in progress...`);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">🚀</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">ETF Manager</h1>
            <p className="text-muted-foreground text-sm">Powered by Flare Network Oracle Feeds</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-green-600">${portfolioValue.toLocaleString()}</div>
          <p className="text-muted-foreground text-sm">Portfolio Value</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">{feeds.length}</div>
            <div className="text-muted-foreground text-sm">Active Feeds</div>
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
            <div className="text-xs font-mono">0x93420...f4b2</div>
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
                  
                  // Test direct contract call to verify raw data
                  console.log('🔗 Testing direct contract calls...');
                  const testDirectContract = async () => {
                    try {
                      const testProvider = new ethers.JsonRpcProvider('https://coston2-api.flare.network/ext/C/rpc');
                      const testContractInstance = new ethers.Contract(
                        '0x93420cD7639AEe3dFc7AA18aDe7955Cfef4b44b1',
                        [
                          "function getFeedById(uint256 feedIndex) view returns (uint256 value, uint8 decimals, uint256 timestamp)",
                          "function getFtsoV2CurrentFeedValues() view returns (uint256[] memory values, uint8[] memory decimals, uint256[] memory timestamps)"
                        ],
                        testProvider
                      );
                      
                      // Test ETH at index 3
                      console.log('📡 Testing ETH/USD at index 3...');
                      const [ethValue, ethDecimals, ethTimestamp] = await testContractInstance.getFeedById(3);
                      const ethPrice = Number(ethValue) / Math.pow(10, Number(ethDecimals));
                      
                      console.log('🔍 RAW ETH DATA:', {
                        index: 3,
                        expectedSymbol: 'ETH/USD',
                        rawValue: ethValue.toString(),
                        decimals: Number(ethDecimals),
                        calculatedPrice: ethPrice,
                        timestamp: Number(ethTimestamp),
                        timestampDate: new Date(Number(ethTimestamp) * 1000).toLocaleString(),
                        dataAge: Math.round((Date.now() - Number(ethTimestamp) * 1000) / 1000 / 60) + ' minutes',
                        isRealistic: ethPrice > 1000 && ethPrice < 10000
                      });
                      
                      // Test BTC at index 2
                      console.log('📡 Testing BTC/USD at index 2...');
                      const [btcValue, btcDecimals, btcTimestamp] = await testContractInstance.getFeedById(2);
                      const btcPrice = Number(btcValue) / Math.pow(10, Number(btcDecimals));
                      
                      console.log('🔍 RAW BTC DATA:', {
                        index: 2,
                        expectedSymbol: 'BTC/USD',
                        rawValue: btcValue.toString(),
                        decimals: Number(btcDecimals),
                        calculatedPrice: btcPrice,
                        timestamp: Number(btcTimestamp),
                        timestampDate: new Date(Number(btcTimestamp) * 1000).toLocaleString(),
                        dataAge: Math.round((Date.now() - Number(btcTimestamp) * 1000) / 1000 / 60) + ' minutes',
                        isRealistic: btcPrice > 30000 && btcPrice < 200000
                      });
                      
                    } catch (err) {
                      console.error('❌ Direct contract test failed:', err);
                    }
                  };
                  
                  testDirectContract();
                  
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
                              placeholder="Tell AI how to optimize your portfolio..."
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
          <CardDescription>Flare Network Oracle Integration Details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Network className="w-4 h-4" />
                Network Configuration
              </h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Chain ID:</dt>
                  <dd className="font-mono">114</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Network:</dt>
                  <dd>Flare Coston2 Testnet</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">RPC URL:</dt>
                  <dd className="font-mono text-xs">coston2-api.flare.network</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Native Currency:</dt>
                  <dd>C2FLR</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Oracle Details
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