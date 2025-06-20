'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Moralis from 'moralis';

interface TokenData {
  symbol: string;
  balance: string;
  decimals: number;
}

interface WalletData {
  address: string;
  balance: string;
  chainId: string;
  tokens: TokenData[];
}

export const MoralisWalletConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      setIsLoading(true);
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      
      const address = accounts[0];
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      // Get balance using Moralis
      const balance = await Moralis.EvmApi.balance.getNativeBalance({
        address: address,
        chain: chainId,
      });

      // Get ERC20 tokens
      const tokens = await Moralis.EvmApi.token.getWalletTokenBalances({
        address: address,
        chain: chainId,
      });

      setWalletData({
        address,
        balance: balance.result.balance.ether,
        chainId,
        tokens: tokens.result,
      });
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletData(null);
    setIsConnected(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Connect Wallet</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Connect your wallet to view your portfolio and manage ITFs
        </p>
      </div>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button 
            onClick={connectWallet} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Address</p>
              <p className="text-xs text-muted-foreground break-all">
                {walletData?.address}
              </p>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Balance</p>
              <p className="text-lg font-bold">
                {walletData?.balance} ETH
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Chain ID</p>
              <p className="text-sm">{walletData?.chainId}</p>
            </div>

            {walletData?.tokens && walletData.tokens.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Tokens</p>
                <div className="space-y-2">
                  {walletData.tokens.slice(0, 5).map((token: TokenData, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{token.symbol}</span>
                      <span>{parseFloat(token.balance) / Math.pow(10, token.decimals)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={disconnectWallet} 
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 