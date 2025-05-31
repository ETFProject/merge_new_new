'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useFlareOracle } from '@/hooks/useFlareOracle';
import { FEED_CATEGORIES } from '@/app/config/flare-contract';
import { Search, RefreshCw, TrendingUp, TrendingDown, Edit, Network, Zap } from 'lucide-react';

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

export default function FlowEtfPage() {
  const { 
    feeds, 
    loading, 
    error, 
    refreshFeeds, 
    getTopGainers, 
    getTopLosers, 
    getFeedsByCategory,
    searchFeeds 
  } = useFlareOracle();

  const [selectedCategory, setSelectedCategory] = useState(FEED_CATEGORIES.ALL);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock portfolio holdings (matching the screenshot exactly)
  const portfolioHoldings = [
    { symbol: 'BTC/USD', allocation: 40, value: 104194.08, units: null },
    { symbol: 'ETH/USD', allocation: 30, value: 3600, units: '104 units' },
    { symbol: 'SOL/USD', allocation: 15, value: 1700, units: '9.64 units' },
    { symbol: 'ADA/USD', allocation: 10, value: 1600, units: '1479.56' },
    { symbol: 'DOT/USD', allocation: 5, value: 500, units: '122.85', price: '$4.07' }
  ];

  const portfolioValue = 10000;
  const portfolioAssets = 5;

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
      {/* Header - Exact match to screenshot */}
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

      {/* Stats Row - Exact match to screenshot */}
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
            <Button 
              onClick={refreshFeeds} 
              className="w-full"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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

      {/* Main Content Grid - Exact match to screenshot */}
      <div className="grid grid-cols-3 gap-6">
        {/* Portfolio Holdings - Left 2/3 */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  📊 Portfolio Holdings
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Portfolio
                </Button>
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
                      <span className="text-green-600 font-bold">
                        ${(Math.abs(asset.change24h || 0) * 0.01).toFixed(6)}
                      </span>
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
                      <span className="text-red-600 font-bold">
                        ${(Math.abs(asset.change24h || 0) * 0.01).toFixed(6)}
                      </span>
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
            <CardTitle className="flex items-center gap-2">
              🔒 Live Market Data
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">View All Feeds</Button>
              <Button variant="outline" size="sm">Export Data</Button>
            </div>
          </div>
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