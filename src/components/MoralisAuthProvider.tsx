'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Moralis from 'moralis';
import { initializeMoralis } from '@/lib/moralis';

interface UserData {
  address: string;
  chainId: string;
  authenticatedAt: string;
}

interface MoralisAuthContextType {
  isInitialized: boolean;
  isAuthenticated: boolean;
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
}

const MoralisAuthContext = createContext<MoralisAuthContextType | undefined>(undefined);

export const useMoralisAuth = () => {
  const context = useContext(MoralisAuthContext);
  if (!context) {
    throw new Error('useMoralisAuth must be used within a MoralisAuthProvider');
  }
  return context;
};

interface MoralisAuthProviderProps {
  children: ReactNode;
}

export const MoralisAuthProvider = ({ children }: MoralisAuthProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Moralis on mount
  useEffect(() => {
    const initMoralis = async () => {
      try {
        await initializeMoralis();
        setIsInitialized(true);
        console.log('Moralis initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Moralis:', error);
        setError('Failed to initialize Moralis');
      }
    };

    initMoralis();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    if (isInitialized) {
      const checkExistingSession = async () => {
        try {
          // Check if we have a stored session
          const storedUser = localStorage.getItem('moralis_user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('Restored existing session:', userData);
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
        }
      };

      checkExistingSession();
    }
  }, [isInitialized]);

  const authenticateWithMoralis = async (address: string, chainId: number) => {
    try {
      // Check if chain is supported by Moralis Auth
      const supportedChains = [1, 5, 11155111, 137, 80001, 80002, 56, 97, 43114, 43113, 250, 25, 338, 100, 10200, 88888, 88882, 8453, 84531, 10, 420, 1284, 1285, 1287, 1337];
      
      const authChainId = supportedChains.includes(chainId) ? chainId : 1;
      
      // Request authentication message from Moralis
      const authData = await Moralis.Auth.requestMessage({
        address: address,
        chain: authChainId,
        domain: 'baevii-etf-manager.com',
        statement: 'Welcome to BAEVII ETF Manager! Please sign this message to authenticate.',
        uri: 'https://baevii-etf-manager.com',
        timeout: 15,
      });

      // Sign the message with the wallet
      const ethereum = window.ethereum!;
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [authData.result.message, address],
      });

      // Verify the signature with Moralis
      await Moralis.Auth.verify({
        message: authData.result.message,
        signature: signature,
      });

      // Create user session
      const userData = {
        address,
        chainId: chainId.toString(),
        authenticatedAt: new Date().toISOString(),
      };

      // Store session
      localStorage.setItem('moralis_user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);

      console.log('User authenticated with Moralis:', userData);
      
      return userData;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  };

  const connectWallet = async () => {
    if (!isInitialized) return;

    try {
      setIsLoading(true);
      setError(null);

      // Request wallet connection
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No wallet detected. Please install MetaMask.');
      }

      const ethereum = window.ethereum!;
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      const chainIdHex = await ethereum.request({ 
        method: 'eth_chainId' 
      });
      
      const chainId = parseInt(chainIdHex, 16);
      
      console.log('Wallet connected:', { address, chainId });

      // Automatically authenticate with Moralis
      await authenticateWithMoralis(address, chainId);

      // Make initial API calls to log activity
      const balance = await Moralis.EvmApi.balance.getNativeBalance({
        address: address,
        chain: chainIdHex,
      });

      console.log('Initial balance fetch:', balance.result.balance.ether);

    } catch (error) {
      console.error('Wallet connection failed:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    localStorage.removeItem('moralis_user');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    console.log('User disconnected from Moralis');
  };

  const value: MoralisAuthContextType = {
    isInitialized,
    isAuthenticated,
    user,
    isLoading,
    error,
    connectWallet,
    disconnect,
  };

  return (
    <MoralisAuthContext.Provider value={value}>
      {children}
    </MoralisAuthContext.Provider>
  );
}; 