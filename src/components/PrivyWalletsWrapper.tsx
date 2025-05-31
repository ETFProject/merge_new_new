'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useWallets, type ConnectedWallet } from '@privy-io/react-auth';

// Create a context to hold wallet information
export type PrivyWalletsContextType = {
  wallets: ConnectedWallet[];
  hasWallets: boolean;
};

const PrivyWalletsContext = createContext<PrivyWalletsContextType>({
  wallets: [],
  hasWallets: false,
});

// This component should only be used inside PrivyWalletProvider
export function PrivyWalletsWrapper({ children }: { children: ReactNode }) {
  // Always call the hook unconditionally
  const walletsResult = useWallets();
  const [errorOccurred, setErrorOccurred] = useState(false);
  
  useEffect(() => {
    // Check if we have a valid result
    if (!walletsResult || typeof walletsResult !== 'object') {
      console.warn('PrivyWalletsWrapper: useWallets not available in current context');
      setErrorOccurred(true);
    } else {
      setErrorOccurred(false);
    }
  }, [walletsResult]);
  
  // Safe access to wallets
  const wallets = errorOccurred ? [] : (walletsResult?.wallets || []);
  
  return (
    <PrivyWalletsContext.Provider value={{ 
      wallets, 
      hasWallets: wallets.length > 0 
    }}>
      {children}
    </PrivyWalletsContext.Provider>
  );
}

// Custom hook to safely access wallet information
export function usePrivyWallets() {
  return useContext(PrivyWalletsContext);
} 