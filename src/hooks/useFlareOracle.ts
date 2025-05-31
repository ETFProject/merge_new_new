'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  CONTRACT_REGISTRY_ADDRESS,
  CONTRACT_REGISTRY_ABI,
  FLARE_CONTRACT_ABI, 
  FLARE_NETWORK_CONFIG,
  FEED_IDS,
  FEED_CONFIGS,
  CATEGORY_MAPPINGS,
  FEED_CATEGORIES,
  FlareOracleFeed 
} from '@/app/config/flare-contract';

interface UseFlareOracleReturn {
  feeds: FlareOracleFeed[];
  loading: boolean;
  error: string | null;
  refreshFeeds: () => Promise<void>;
  testFeedIndices: () => Promise<any>;
  getTopGainers: (limit?: number) => FlareOracleFeed[];
  getTopLosers: (limit?: number) => FlareOracleFeed[];
  getFeedsByCategory: (category: string) => FlareOracleFeed[];
  searchFeeds: (query: string) => FlareOracleFeed[];
}

export function useFlareOracle(): UseFlareOracleReturn {
  const [feeds, setFeeds] = useState<FlareOracleFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get category for a feed
  const getFeedCategory = (feedName: string): string => {
    for (const [category, feedsInCategory] of Object.entries(CATEGORY_MAPPINGS)) {
      if (feedsInCategory.includes(feedName)) {
        return category;
      }
    }
    return FEED_CATEGORIES.ALL;
  };

  // Enhanced debug function
  const testFeedIndices = async () => {
    try {
      console.log('🔍 Starting comprehensive FTSOv2 test...');
      
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      
      // Test 1: ContractRegistry connection
      console.log('📡 Testing ContractRegistry connection...');
      const registryContract = new ethers.Contract(CONTRACT_REGISTRY_ADDRESS, CONTRACT_REGISTRY_ABI, provider);
      
      // Test 2: Get TestFtsoV2 contract directly
      console.log('🎯 Getting TestFtsoV2 contract from registry...');
      const ftsoV2Address = await registryContract.getContractAddressByName("TestFtsoV2");
      console.log(`✅ TestFtsoV2 contract address: ${ftsoV2Address}`);
      
      // Test 3: Create FTSOv2 contract instance
      const ftsoV2Contract = new ethers.Contract(ftsoV2Address, FLARE_CONTRACT_ABI, provider);
      
      // Test 4: Test ETH/USD feed specifically
      const ethFeedId = FEED_IDS["ETH/USD"]; // Use correct key
      console.log(`🔍 Testing ETH/USD feed with ID: ${ethFeedId}`);
      
      const [value, decimals, timestamp] = await ftsoV2Contract.getFeedById(ethFeedId);
      const price = Number(value) / Math.pow(10, Number(decimals));
      
      console.log(`💰 ETH/USD Raw Data:`, {
        value: value.toString(),
        decimals: Number(decimals),
        timestamp: Number(timestamp),
        calculatedPrice: price,
        timestampDate: new Date(Number(timestamp) * 1000).toLocaleString()
      });
      
      // Test 5: Multiple feeds test
      console.log('🔍 Testing multiple feeds...');
      const feedIds = [FEED_IDS["ETH/USD"], FEED_IDS["BTC/USD"], FEED_IDS["SOL/USD"]];
      const [values, decimalsArray, batchTimestamp] = await ftsoV2Contract.getFeedsById(feedIds);
      
      feedIds.forEach((feedId, index) => {
        const feedPrice = Number(values[index]) / Math.pow(10, Number(decimalsArray[index]));
        console.log(`📊 Feed ${index + 1} (${feedId}): $${feedPrice.toLocaleString()}`);
      });
      
      return {
        success: true,
        ethPrice: price,
        ftsoV2Address,
        testResults: {
          singleFeed: { value, decimals: Number(decimals), timestamp: Number(timestamp), price },
          multipleFeedsCount: values.length,
          batchTimestamp: Number(batchTimestamp)
        }
      };
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ FTSOv2 test failed:', errorMessage);
      console.error('🔍 Error details:', error);
      
      return {
        success: false,
        error: errorMessage,
        ethPrice: 0
      };
    }
  };

  // Get FTSOv2 contract using official approach
  const getFtsoV2Contract = async () => {
    const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
    
    // Use ContractRegistry to get TestFtsoV2 contract address
    const registryContract = new ethers.Contract(CONTRACT_REGISTRY_ADDRESS, CONTRACT_REGISTRY_ABI, provider);
    const ftsoV2Address = await registryContract.getContractAddressByName("TestFtsoV2");
    
    console.log(`🎯 Retrieved TestFtsoV2 address from registry: ${ftsoV2Address}`);
    
    // Create FTSOv2 contract instance
    return new ethers.Contract(ftsoV2Address, FLARE_CONTRACT_ABI, provider);
  };

  // Main function to fetch all feeds using the new FTSOv2 system
  const fetchFeeds = useCallback(async () => {
    console.log('🔄 Starting FTSOv2 feed fetch...');
    
    try {
      setLoading(true);
      setError(null);

      const contract = await getFtsoV2Contract();
      if (!contract) {
        throw new Error('Failed to get FTSOv2 contract from registry');
      }

      console.log('📱 FTSOv2 contract obtained successfully');

      const feedsData: FlareOracleFeed[] = [];

      // Fetch feeds individually using feed IDs
      const feedPromises = FEED_CONFIGS.map(async (feedConfig) => {
        try {
          const [value, decimals, timestamp] = await contract.getFeedById(feedConfig.feedId);
          
          // Convert the oracle value to actual price
          const price = Number(value) / Math.pow(10, Number(decimals));
          
          // Log ETH specifically for debugging
          if (feedConfig.name === 'ETH/USD') {
            console.log('🔍 ETH/USD Feed Details:', {
              feedId: feedConfig.feedId,
              rawValue: value.toString(),
              decimals: Number(decimals),
              calculatedPrice: price,
              timestamp: Number(timestamp),
              timestampDate: new Date(Number(timestamp) * 1000).toLocaleString()
            });
          }
          
          // Validate price is realistic
          if (price > 0) {
            return {
              id: feedConfig.id,
              name: feedConfig.name,
              symbol: feedConfig.symbol,
              price: price,
              decimals: Number(decimals),
              timestamp: Number(timestamp),
              category: getFeedCategory(feedConfig.name),
              feedId: feedConfig.feedId,
              change24h: (Math.random() - 0.5) * 10 // Mock 24h change for demo
            };
          } else {
            console.warn(`⚠️ Invalid price for ${feedConfig.name}: ${price}`);
            return null;
          }
        } catch (err) {
          console.warn(`⚠️ Failed to fetch ${feedConfig.name}:`, err);
          return null;
        }
      });

      const results = await Promise.allSettled(feedPromises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          feedsData.push(result.value);
        }
      });

      setFeeds(feedsData);
      console.log(`✅ Successfully loaded ${feedsData.length} FTSOv2 feeds`, {
        totalFeeds: feedsData.length,
        samplePrices: feedsData.slice(0, 3).map(feed => `${feed.symbol}: $${feed.price.toFixed(2)}`),
        ethPrice: feedsData.find(feed => feed.symbol === 'ETH')?.price
      });
      
    } catch (err) {
      console.error('❌ Error fetching FTSOv2 feeds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch FTSOv2 feeds');
    } finally {
      setLoading(false);
    }
  }, [getFtsoV2Contract, getFeedCategory]);

  // Get top gainers
  const getTopGainers = useCallback((limit = 5): FlareOracleFeed[] => {
    return feeds
      .filter(feed => feed.change24h !== undefined)
      .sort((a, b) => (b.change24h || 0) - (a.change24h || 0))
      .slice(0, limit);
  }, [feeds]);

  // Get top losers
  const getTopLosers = useCallback((limit = 5): FlareOracleFeed[] => {
    return feeds
      .filter(feed => feed.change24h !== undefined)
      .sort((a, b) => (a.change24h || 0) - (b.change24h || 0))
      .slice(0, limit);
  }, [feeds]);

  // Get feeds by category
  const getFeedsByCategory = useCallback((category: string): FlareOracleFeed[] => {
    if (category === FEED_CATEGORIES.ALL) {
      return feeds;
    }
    return feeds.filter(feed => feed.category === category);
  }, [feeds]);

  // Search feeds
  const searchFeeds = useCallback((query: string): FlareOracleFeed[] => {
    if (!query.trim()) return feeds;
    
    const lowerQuery = query.toLowerCase();
    return feeds.filter(feed => 
      feed.name.toLowerCase().includes(lowerQuery) ||
      feed.symbol.toLowerCase().includes(lowerQuery)
    );
  }, [feeds]);

  // Initial load and auto-refresh
  useEffect(() => {
    fetchFeeds();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchFeeds, 30000);
    
    return () => clearInterval(interval);
  }, [fetchFeeds]);

  return {
    feeds,
    loading,
    error,
    refreshFeeds: fetchFeeds,
    testFeedIndices,
    getTopGainers,
    getTopLosers,
    getFeedsByCategory,
    searchFeeds
  };
} 