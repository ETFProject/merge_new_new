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
        // Check if API key is available
        const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
        if (!apiKey) {
          console.error('Moralis API key not found. Please check your .env.local file.');
          setError('Moralis API key not configured');
          return;
        }

        await initializeMoralis();
        console.log('Moralis initialized successfully');
        setIsInitialized(true);
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
      console.log('Starting authentication for address:', address, 'chainId:', chainId);
      
      // Check if chain is supported by Moralis Auth
      const supportedChains = [1, 5, 11155111, 137, 80001, 80002, 56, 97, 43114, 43113, 250, 25, 338, 100, 10200, 88888, 88882, 8453, 84531, 10, 420, 1284, 1285, 1287, 1337];
      
      const authChainId = supportedChains.includes(chainId) ? chainId : 1;
      console.log('Using auth chainId:', authChainId);
      
      // Request authentication message from Moralis
      const authData = await Moralis.Auth.requestMessage({
        address: address,
        chain: authChainId,
        domain: 'baevii-itf-manager.com',
        statement: 'Welcome to BAEVII ITF Manager! Please sign this message to authenticate.',
        uri: 'https://baevii-itf-manager.com',
        timeout: 15,
      });

      console.log('Auth message requested successfully');

      // Sign the message with the wallet
      const ethereum = window.ethereum!;
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [authData.result.message, address],
      }) as string;

      console.log('Message signed successfully');

      // Verify the signature with Moralis
      const verifyResult = await Moralis.Auth.verify({
        message: authData.result.message,
        signature: signature,
      });

      console.log('Signature verified successfully');

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
      
      // Make initial API calls to log activity and ensure user is registered
      try {
        const balance = await Moralis.EvmApi.balance.getNativeBalance({
          address: address,
          chain: `0x${chainId.toString(16)}`,
        });
        
        // Also fetch token balances to ensure user is fully registered
        const tokenBalances = await Moralis.EvmApi.token.getWalletTokenBalances({
          address: address,
          chain: `0x${chainId.toString(16)}`,
        });
        
      } catch (apiError) {
        // Silently handle API errors - authentication is still successful
        console.warn('API calls failed but authentication succeeded:', apiError);
      }
      
      return userData;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  };

  const connectWallet = async () => {
    if (!isInitialized) {
      console.error('Moralis not initialized');
      setError('Moralis not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('Starting wallet connection...');

      // Check for wallet conflicts and provide guidance
      const walletProviders = [];
      if (typeof window.ethereum !== 'undefined') {
        walletProviders.push('MetaMask');
      }
      if (typeof (window as any).coinbaseWalletExtension !== 'undefined') {
        walletProviders.push('Coinbase Wallet');
      }
      if (typeof (window as any).phantom !== 'undefined') {
        walletProviders.push('Phantom');
      }
      if (typeof (window as any).solana !== 'undefined') {
        walletProviders.push('Solana Wallet');
      }

      console.log('Detected wallet providers:', walletProviders);

      if (walletProviders.length > 1) {
        console.warn('Multiple wallet extensions detected. This may cause conflicts.');
        setError(`Multiple wallet extensions detected: ${walletProviders.join(', ')}. Please disable other wallet extensions and try again.`);
        return;
      }

      // Check for wallet availability with better error handling
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No wallet detected. Please install MetaMask or another Ethereum wallet.');
      }

      const ethereum = window.ethereum!;
      console.log('Requesting accounts...');
      
      // First, check if the wallet is already connected
      let accounts: string[];
      try {
        accounts = await ethereum.request({ 
          method: 'eth_accounts' 
        }) as string[];
        
        console.log('Current accounts:', accounts);
        
        // If no accounts are connected, request connection
        if (!accounts || accounts.length === 0) {
          console.log('No accounts connected, requesting connection...');
          accounts = await ethereum.request({ 
            method: 'eth_requestAccounts' 
          }) as string[];
        }
      } catch (requestError) {
        console.error('Error requesting accounts:', requestError);
        
        // Handle specific MetaMask errors
        if (requestError && typeof requestError === 'object' && 'code' in requestError) {
          const errorCode = (requestError as any).code;
          const errorMessage = (requestError as any).message;
          
          if (errorCode === 4001) {
            if (errorMessage && errorMessage.includes('wallet must has at least one account')) {
              throw new Error('No accounts found in MetaMask. Please create or import an account first.');
            } else {
              throw new Error('Connection rejected by user. Please connect your wallet.');
            }
          } else if (errorCode === 4002) {
            throw new Error('Wallet is locked. Please unlock your wallet and try again.');
          } else if (errorMessage && errorMessage.includes('account')) {
            throw new Error('No accounts found. Please create or import an account in your wallet.');
          } else {
            throw new Error(`Wallet connection failed: ${errorMessage || 'Unknown error'}`);
          }
        }
        
        throw new Error('Failed to connect wallet. Please try again.');
      }
      
      console.log('Accounts received:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please create or import an account in your wallet.');
      }
      
      const address = accounts[0];
      console.log('Selected address:', address);
      
      console.log('Requesting chain ID...');
      const chainIdHex = await ethereum.request({ 
        method: 'eth_chainId' 
      }) as string;
      
      const chainId = parseInt(chainIdHex, 16);
      console.log('Chain ID:', chainId);

      // Automatically authenticate with Moralis
      await authenticateWithMoralis(address, chainId);

    } catch (error) {
      console.error('Wallet connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setError(errorMessage);
      
      // Log additional debugging information
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    localStorage.removeItem('moralis_user');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
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