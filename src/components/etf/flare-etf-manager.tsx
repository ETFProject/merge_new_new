'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useFlareOracle } from '@/hooks/useFlareOracle';
import { FEED_CATEGORIES } from '@/app/config/flare-contract';
import { Search, RefreshCw, TrendingUp, TrendingDown, Wallet, Eye, Plus } from 'lucide-react';

export function FlareETFManager() {
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
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);

  // Filter feeds based on category and search
  const filteredFeeds = useMemo(() => {
    let result = getFeedsByCategory(selectedCategory);
    if (searchQuery.trim()) {
      result = searchFeeds(searchQuery);
    }
    return result;
  }, [getFeedsByCategory, searchFeeds, selectedCategory, searchQuery]);

  const topGainers = getTopGainers(5);
  const topLosers = getTopLosers(5);

  // Portfolio calculations
  const portfolioValue = useMemo(() => {
    return selectedAssets.reduce((total, assetId) => {
      const asset = feeds.find(f => f.id === assetId);
      return total + (asset ? asset.price * 100 : 0); // Mock 100 tokens per asset
    }, 0);
  }, [selectedAssets, feeds]);

  const toggleAssetSelection = (assetId: number) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

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

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Oracle Connection Error</CardTitle>
          <CardDescription className="text-red-600">
            Failed to connect to Flare Network oracles: {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refreshFeeds} variant="outline" className="border-red-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolioValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedAssets.length} assets selected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Feeds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time oracle feeds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Flare</div>
            <p className="text-xs text-muted-foreground mt-1">
              Coston2 Testnet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Top Gainers (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              topGainers.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-sm text-muted-foreground">{formatPrice(asset.price)}</div>
                  </div>
                  {asset.change24h !== undefined && formatChange(asset.change24h)}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Top Losers (24h)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              topLosers.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-sm text-muted-foreground">{formatPrice(asset.price)}</div>
                  </div>
                  {asset.change24h !== undefined && formatChange(asset.change24h)}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Oracle Feeds Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Oracle Feeds</CardTitle>
              <CardDescription>
                Real-time cryptocurrency prices from Flare Network oracles
              </CardDescription>
            </div>
            <Button 
              onClick={refreshFeeds} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
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

          {/* Feeds Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              [...Array(9)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
              ))
            ) : filteredFeeds.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No assets found matching your criteria
              </div>
            ) : (
              filteredFeeds.map((asset) => {
                const isSelected = selectedAssets.includes(asset.id);
                return (
                  <Card 
                    key={asset.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => toggleAssetSelection(asset.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{asset.symbol}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {asset.category}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className="h-8 w-8 p-0"
                          >
                            {isSelected ? <Wallet className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-xl font-bold">{formatPrice(asset.price)}</div>
                        <div className="flex items-center justify-between">
                          {asset.change24h !== undefined && formatChange(asset.change24h)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(asset.timestamp * 1000).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Selected Assets Summary */}
          {selectedAssets.length > 0 && (
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm">Portfolio Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedAssets.map((assetId) => {
                    const asset = feeds.find(f => f.id === assetId);
                    if (!asset) return null;
                    
                    const allocation = (asset.price * 100) / portfolioValue * 100;
                    return (
                      <div key={assetId} className="text-center">
                        <div className="font-medium">{asset.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {allocation.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 