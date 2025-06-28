'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Moralis from 'moralis';
import { initializeMoralis } from '@/lib/moralis';

interface MoralisContextType {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: unknown;
  account: string | null;
  chainId: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  authenticate: () => Promise<void>;
}

const MoralisContext = createContext<MoralisContextType | undefined>(undefined);

export const useMoralis = () => {
  const context = useContext(MoralisContext);
  if (!context) {
    throw new Error('useMoralis must be used within a MoralisProvider');
  }
  return context;
};

interface MoralisProviderProps {
  children: ReactNode;
}

export const MoralisProvider = ({ children }: MoralisProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<unknown>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  useEffect(() => {
    const initMoralis = async () => {
      try {
        await initializeMoralis();
        setIsInitialized(true);
        console.log('Moralis initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Moralis:', error);
      }
    };

    initMoralis();
  }, []);

  const login = async () => {
    try {
      if (!isInitialized) return;
      
      // For now, just set authenticated state
      // In a real implementation, you would use the current Moralis API
      setIsAuthenticated(true);
      console.log('User authenticated (placeholder)');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      setIsAuthenticated(false);
      setUser(null);
      setAccount(null);
      setChainId(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const authenticate = async () => {
    if (isAuthenticated) {
      await logout();
    } else {
      await login();
    }
  };

  const value: MoralisContextType = {
    isInitialized,
    isAuthenticated,
    user,
    account,
    chainId,
    login,
    logout,
    authenticate,
  };

  return (
    <MoralisContext.Provider value={value}>
      {children}
    </MoralisContext.Provider>
  );
}; 