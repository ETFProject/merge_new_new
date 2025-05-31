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
            const price = Number(value) / Math.pow(10, Number(decimals));
            
            // Only include feeds with valid prices
            if (price > 0) {
              feedsData.push({
                id: index,
                name: feedName,
                symbol: feedName.split('/')[0],
                price: price,
                decimals: Number(decimals),
                timestamp: Number(timestamp),
                category: getFeedCategory(feedName),
                // Mock 24h change for demo (in real implementation, you'd track historical data)
                change24h: (Math.random() - 0.5) * 20 // Random between -10% and +10%
              });
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
    try {
      setLoading(true);
      setError(null);

      const contract = getContract();
      if (!contract) {
        throw new Error('Failed to initialize contract');
      }

      // Try batch method first (this might fail due to custom feed)
      try {
        const [values, decimals, timestamps] = await contract.getFtsoV2CurrentFeedValues();
        
        const feedsData: FlareOracleFeed[] = [];

        // Process each feed (skip index 0 as it's custom and not supported)
        for (let i = 1; i < FEED_NAMES.length && i < values.length; i++) {
          const feedName = FEED_NAMES[i];
          const value = values[i];
          const decimal = decimals[i];
          const timestamp = timestamps[i];

          if (value && decimal !== undefined) {
            const price = Number(value) / Math.pow(10, Number(decimal));
            
            // Only include feeds with valid prices
            if (price > 0) {
              feedsData.push({
                id: i,
                name: feedName,
                symbol: feedName.split('/')[0],
                price: price,
                decimals: Number(decimal),
                timestamp: Number(timestamp),
                category: getFeedCategory(feedName),
                // Mock 24h change for demo
                change24h: (Math.random() - 0.5) * 20
              });
            }
          }
        }

        setFeeds(feedsData);
        console.log(`✅ Loaded ${feedsData.length} oracle feeds from Flare Network (batch method)`);
        
      } catch (batchError) {
        console.warn('Batch method failed, falling back to individual feed fetching:', batchError);
        // Fall back to individual feed fetching
        await fetchIndividualFeeds();
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
    getTopGainers,
    getTopLosers,
    getFeedsByCategory,
    searchFeeds
  };
} 