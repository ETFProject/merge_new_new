'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Moralis from 'moralis';
import { initializeMoralis } from '@/lib/moralis';

interface MoralisContextType {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: any;
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
  const [user, setUser] = useState<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

  useEffect(() => {
    const initMoralis = async () => {
      try {
        await initializeMoralis();
        setIsInitialized(true);
        
        // Check if user is already authenticated
        const currentUser = Moralis.Auth.currentUser();
        if (currentUser) {
          setIsAuthenticated(true);
          setUser(currentUser);
          setAccount(currentUser.accounts?.[0] || null);
          setChainId(currentUser.chainId || null);
        }
      } catch (error) {
        console.error('Failed to initialize Moralis:', error);
      }
    };

    initMoralis();
  }, []);

  const login = async () => {
    try {
      if (!isInitialized) return;
      
      const user = await Moralis.Auth.authenticate({
        signingMessage: 'Welcome to BAEVII ETF Manager! Please sign this message to authenticate.',
      });
      
      setIsAuthenticated(true);
      setUser(user);
      setAccount(user.accounts?.[0] || null);
      setChainId(user.chainId || null);
      
      console.log('User authenticated:', user);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await Moralis.Auth.logout();
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