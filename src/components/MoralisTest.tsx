'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMoralisData } from '@/hooks/useMoralisData';
import { initializeMoralis } from '@/lib/moralis';

export const MoralisTest = () => {
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState('0x1'); // Ethereum mainnet
  const { walletData, isLoading, error, fetchWalletData } = useMoralisData();

  const handleConnect = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      // Initialize Moralis
      await initializeMoralis();
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const walletAddress = accounts[0];
      const currentChainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      setAddress(walletAddress);
      setChainId(currentChainId);
      
      // Fetch wallet data
      await fetchWalletData(walletAddress, currentChainId);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Moralis Integration Test</CardTitle>
        <CardDescription>
          Test Moralis API integration for fetching wallet data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleConnect} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Connect Wallet & Fetch Data'}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {walletData && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Wallet Address</p>
              <p className="text-xs text-muted-foreground break-all">
                {walletData.address}
              </p>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Native Balance</p>
              <p className="text-lg font-bold">
                {parseFloat(walletData.nativeBalance).toFixed(4)} ETH
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Chain ID</p>
              <p className="text-sm">{walletData.chainId}</p>
            </div>

            {walletData.tokens && walletData.tokens.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">ERC20 Tokens ({walletData.tokens.length})</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {walletData.tokens.map((token, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{token.token?.symbol || 'Unknown'}</span>
                      <span>
                        {token.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 