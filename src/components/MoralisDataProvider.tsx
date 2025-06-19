'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Moralis from 'moralis';
import { useMoralisAuth } from './MoralisAuthProvider';

interface WalletData {
  address: string;
  balance: string;
  chainId: string;
  lastUpdated: string;
}

interface MoralisDataContextType {
  walletData: WalletData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const MoralisDataContext = createContext<MoralisDataContextType | undefined>(undefined);

export const useMoralisData = () => {
  const context = useContext(MoralisDataContext);
  if (!context) {
    throw new Error('useMoralisData must be used within a MoralisDataProvider');
  }
  return context;
};

interface MoralisDataProviderProps {
  children: ReactNode;
}

export const MoralisDataProvider = ({ children }: MoralisDataProviderProps) => {
  const { isAuthenticated, user } = useMoralisAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch wallet balance
      const balance = await Moralis.EvmApi.balance.getNativeBalance({
        address: user.address,
        chain: user.chainId,
      });

      const walletData: WalletData = {
        address: user.address,
        balance: balance.result.balance.ether,
        chainId: user.chainId,
        lastUpdated: new Date().toISOString(),
      };

      setWalletData(walletData);
      console.log('Wallet data fetched:', walletData);

    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWalletData();
    }
  }, [isAuthenticated, user]);

  const refreshData = async () => {
    await fetchWalletData();
  };

  const value: MoralisDataContextType = {
    walletData,
    isLoading,
    error,
    refreshData,
  };

  return (
    <MoralisDataContext.Provider value={value}>
      {children}
    </MoralisDataContext.Provider>
  );
}; 