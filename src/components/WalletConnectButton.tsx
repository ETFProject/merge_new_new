'use client';

import { usePrivy, useConnectWallet } from '@privy-io/react-auth';
import { usePrivyWallets } from '@/components/PrivyWalletsWrapper';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, User, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function WalletConnectButton() {
  const { 
    ready, 
    authenticated, 
    login, 
    logout 
  } = usePrivy();
  
  const { wallets } = usePrivyWallets();
  const { connectWallet } = useConnectWallet();
  const [showDetails, setShowDetails] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetails]);

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Wallet className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  // If not authenticated, show connect button
  if (!authenticated) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={login}
        className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  // If authenticated, show user info and disconnect option
  const primaryWallet = wallets?.[0]; // Get the first wallet
  const displayAddress = primaryWallet?.address 
    ? `${primaryWallet.address.slice(0, 6)}...${primaryWallet.address.slice(-4)}`
    : 'Connected';

  const copyAddress = async () => {
    if (primaryWallet?.address) {
      await navigator.clipboard.writeText(primaryWallet.address);
      // You could add a toast notification here
    }
  };

  const openBlockExplorer = () => {
    if (primaryWallet?.address) {
      const explorerUrl = `https://evm-testnet.flowscan.io/address/${primaryWallet.address}`;
      window.open(explorerUrl, '_blank');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={dropdownRef}>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 pr-8 hover:bg-green-50 hover:border-green-200 transition-colors"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <User className="h-4 w-4" />
          {displayAddress}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
        
        {/* Dropdown menu */}
        {showDetails && (
          <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[200px]">
            <div className="p-2">
              <div className="text-xs text-gray-500 mb-2">Connected Wallet</div>
              <div className="text-sm font-mono mb-3 break-all">{primaryWallet?.address}</div>
              
              <div className="flex flex-col gap-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={copyAddress}
                  className="justify-start h-8 text-sm"
                >
                  <Copy className="h-3 w-3 mr-2" />
                  Copy Address
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={openBlockExplorer}
                  className="justify-start h-8 text-sm"
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View in Explorer
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => connectWallet()}
                  className="justify-start h-8 text-sm"
                >
                  <Wallet className="h-3 w-3 mr-2" />
                  Connect Another
                </Button>
                
                <hr className="my-1" />
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={logout}
                  className="justify-start h-8 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-3 w-3 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
