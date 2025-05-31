'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  FLARE_CONTRACT_ADDRESS, 
  FLARE_CONTRACT_ABI, 
  FLARE_NETWORK_CONFIG,
  FEED_NAMES,
  CATEGORY_MAPPINGS,
  FEED_CATEGORIES,
  FlareOracleFeed 
} from '@/app/config/flare-contract';

interface UseFlareOracleReturn {
  feeds: FlareOracleFeed[];
  loading: boolean;
  error: string | null;
  refreshFeeds: () => Promise<void>;
  testFeedIndices: () => Promise<void>;
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

  // Create provider and contract
  const getContract = useCallback(() => {
    try {
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      return new ethers.Contract(FLARE_CONTRACT_ADDRESS, FLARE_CONTRACT_ABI, provider);
    } catch (err) {
      console.error('Failed to create contract:', err);
      return null;
    }
  }, []);

  // Test individual feeds to validate indices (for debugging)
  const testFeedIndices = useCallback(async () => {
    console.log('🔍 Testing individual feed indices...');
    const contract = getContract();
    if (!contract) return;

    const testFeeds = [
      { index: 1, expected: 'DOGE/USD' },
      { index: 2, expected: 'BTC/USD' },
      { index: 3, expected: 'ETH/USD' },
      { index: 4, expected: 'BNB/USD' },
      { index: 5, expected: 'SOL/USD' }
    ];

    for (const { index, expected } of testFeeds) {
      try {
        const [value, decimals, timestamp] = await contract.getFeedById(index);
        const price = Number(value) / Math.pow(10, Number(decimals));
        
        console.log(`Feed ${index} (expected ${expected}):`, {
          value: value.toString(),
          decimals: Number(decimals),
          price: price,
          timestamp: Number(timestamp),
          timestampDate: new Date(Number(timestamp) * 1000).toLocaleString(),
          configuredName: FEED_NAMES[index],
          matches: FEED_NAMES[index] === expected
        });
      } catch (err) {
        console.error(`Failed to fetch feed ${index}:`, err);
      }
    }
  }, [getContract]);

  // Fetch individual feed by ID (skipping custom feed at index 0)
  const fetchIndividualFeeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const contract = getContract();
      if (!contract) {
        throw new Error('Failed to initialize contract');
      }

      const feedsData: FlareOracleFeed[] = [];

      // Fetch feeds individually, starting from index 1 (skip custom at index 0)
      const promises = [];
      for (let i = 1; i < FEED_NAMES.length; i++) {
        promises.push(
          contract.getFeedById(i).then((result: any) => ({
            index: i,
            feedName: FEED_NAMES[i],
            value: result[0],
            decimals: result[1],
            timestamp: result[2]
          })).catch((err: any) => {
            console.warn(`Failed to fetch feed ${i} (${FEED_NAMES[i]}):`, err.message);
            return null;
          })
        );
      }

      const results = await Promise.allSettled(promises);

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { index, feedName, value, decimals, timestamp } = result.value;
          
          if (value && decimals !== undefined) {
            // Convert the oracle value to actual price
            // Oracle returns the value as a signed integer (int256)
            const valueStr = value.toString();
            const isNegative = valueStr.startsWith('-');
            const absoluteValueStr = isNegative ? valueStr.slice(1) : valueStr;
            
            // Convert to actual price using decimals
            const price = Number(absoluteValueStr) / Math.pow(10, Number(decimals));
            
            // Only include feeds with valid positive prices
            if (price > 0 && !isNegative) {
              feedsData.push({
                id: index,
                name: feedName,
                symbol: feedName.split('/')[0],
                price: price,
                decimals: Number(decimals),
                timestamp: Number(timestamp),
                category: getFeedCategory(feedName),
                // Generate realistic mock 24h change for demo (in real implementation, you'd track historical data)
                change24h: (Math.random() - 0.5) * 10 // Random between -5% and +5%
              });
            } else {
              console.warn(`Invalid price for feed ${index} (${feedName}): ${price} (original value: ${value})`);
            }
          }
        }
      });

      setFeeds(feedsData);
      console.log(`✅ Loaded ${feedsData.length} oracle feeds from Flare Network`);
      
    } catch (err) {
      console.error('❌ Error fetching oracle feeds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch oracle feeds');
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // Fallback: try batch method first, then individual if it fails
  const fetchFeeds = useCallback(async () => {
    console.log('🔄 Starting fetchFeeds function...');
    
    try {
      setLoading(true);
      setError(null);

      const contract = getContract();
      if (!contract) {
        throw new Error('Failed to initialize contract');
      }

      console.log('📱 Contract initialized successfully:', contract.target);

      // Try batch method first (this might fail due to custom feed)
      try {
        console.log('🔄 Attempting batch method to fetch oracle feeds...');
        const [values, decimals, timestamps] = await contract.getFtsoV2CurrentFeedValues();
        
        console.log('✅ Batch method succeeded - Raw oracle data:', {
          totalFeeds: values.length,
          rawDataSample: {
            'values[0]': values[0]?.toString(),
            'values[1]': values[1]?.toString(), 
            'values[2]': values[2]?.toString(),
            'values[3]': values[3]?.toString()
          },
          sampleRawData: {
            'BTC (index 2)': { value: values[2]?.toString(), decimals: decimals[2]?.toString(), timestamp: timestamps[2]?.toString() },
            'ETH (index 3)': { value: values[3]?.toString(), decimals: decimals[3]?.toString(), timestamp: timestamps[3]?.toString() },
            'SOL (index 5)': { value: values[5]?.toString(), decimals: decimals[5]?.toString(), timestamp: timestamps[5]?.toString() }
          }
        });
        
        const feedsData: FlareOracleFeed[] = [];

        // Process each feed (skip index 0 as it's custom and not supported)
        for (let i = 1; i < FEED_NAMES.length && i < values.length; i++) {
          const feedName = FEED_NAMES[i];
          const value = values[i];
          const decimal = decimals[i];
          const timestamp = timestamps[i];

          if (value && decimal !== undefined) {
            // Convert the oracle value to actual price - same logic as individual feeds
            const valueStr = value.toString();
            const isNegative = valueStr.startsWith('-');
            const absoluteValueStr = isNegative ? valueStr.slice(1) : valueStr;
            
            // Convert to actual price using decimals
            const price = Number(absoluteValueStr) / Math.pow(10, Number(decimal));
            
            // Debug log for ETH specifically
            if (feedName === 'ETH/USD') {
              console.log('🔍 ETH Price Calculation:', {
                feedName,
                rawValue: valueStr,
                decimals: Number(decimal),
                calculatedPrice: price,
                divisor: Math.pow(10, Number(decimal)),
                timestamp: Number(timestamp),
                timestampDate: new Date(Number(timestamp) * 1000).toLocaleString(),
                dataAge: `${Math.round((Date.now() - Number(timestamp) * 1000) / 1000 / 60)} minutes old`,
                isRealisticPrice: price > 1000 && price < 10000 // ETH should be between $1000-$10000
              });
            }
            
            // Additional validation for all major cryptos
            const isRealistic = (feedName.includes('BTC') && price > 30000 && price < 200000) ||
                              (feedName.includes('ETH') && price > 1000 && price < 10000) ||
                              (feedName.includes('SOL') && price > 10 && price < 1000) ||
                              (!feedName.includes('BTC') && !feedName.includes('ETH') && !feedName.includes('SOL'));
            
            if (!isRealistic) {
              console.warn('🚨 Potentially unrealistic price for:', {
                feedName,
                price,
                rawValue: valueStr,
                decimals: Number(decimal),
                timestamp: new Date(Number(timestamp) * 1000).toLocaleString()
              });
            }
            
            // Only include feeds with valid positive prices
            if (price > 0 && !isNegative) {
              feedsData.push({
                id: i,
                name: feedName,
                symbol: feedName.split('/')[0],
                price: price,
                decimals: Number(decimal),
                timestamp: Number(timestamp),
                category: getFeedCategory(feedName),
                // Generate realistic mock 24h change for demo
                change24h: (Math.random() - 0.5) * 10 // Random between -5% and +5%
              });
            } else {
              console.warn(`Invalid price for feed ${i} (${feedName}): ${price} (original value: ${value})`);
            }
          }
        }

        setFeeds(feedsData);
        console.log(`✅ Loaded ${feedsData.length} oracle feeds from Flare Network (batch method)`);
        console.log('📊 Final feeds data sample:', {
          totalFeeds: feedsData.length,
          firstFewFeeds: feedsData.slice(0, 5).map(feed => ({
            id: feed.id,
            name: feed.name,
            symbol: feed.symbol,
            price: feed.price,
            decimals: feed.decimals,
            timestamp: feed.timestamp,
            timestampDate: new Date(feed.timestamp * 1000).toLocaleString()
          })),
          ethFeed: feedsData.find(feed => feed.symbol === 'ETH')
        });
        
        setLoading(false);
        
      } catch (batchError) {
        console.warn('❌ Batch method failed, falling back to individual feed fetching:', batchError);
        
        try {
          // Fall back to individual feed fetching
          await fetchIndividualFeeds();
        } catch (individualError) {
          console.error('❌ Individual feed fetching also failed:', individualError);
          setError('Failed to fetch feeds from Flare Oracle');
          setLoading(false);
        }
      }
      
    } catch (err) {
      console.error('❌ Error fetching oracle feeds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch oracle feeds');
      setLoading(false);
    }
  }, [getContract, fetchIndividualFeeds]);

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
    
    // Auto-refresh every 30 seconds (Flare updates every ~1.8s but we don't need that frequent UI updates)
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