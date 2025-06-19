'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Moralis from 'moralis';
import { initializeMoralis } from '@/lib/moralis';

interface UserData {
  address: string;
  chainId: string;
  authenticatedAt: string;
}

export const MoralisAuth = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleLogin = async () => {
    if (!isInitialized) return;

    try {
      setIsLoading(true);
      setError(null);

      // Request wallet connection first
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No wallet detected. Please install MetaMask.');
      }

      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const address = accounts[0];
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      // Step 1: Request authentication message from Moralis
      const authData = await Moralis.Auth.requestMessage({
        address: address,
        chain: chainId,
        network: 'evm',
        domain: 'baevii-etf-manager.com',
        statement: 'Welcome to BAEVII ETF Manager! Please sign this message to authenticate.',
        uri: 'https://baevii-etf-manager.com',
        timeout: 15,
      });

      console.log('Auth message requested:', authData);

      // Step 2: Sign the message with the wallet
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [authData.result.message, address],
      });

      console.log('Message signed:', signature);

      // Step 3: Verify the signature with Moralis
      const verifyData = await Moralis.Auth.verify({
        message: authData.result.message,
        signature: signature,
        network: 'evm',
      });

      console.log('Signature verified:', verifyData);

      // Step 4: Create user session
      const userData = {
        address,
        chainId,
        authenticatedAt: new Date().toISOString(),
      };

      setIsAuthenticated(true);
      setUser(userData);

      console.log('User authenticated with Moralis Auth:', userData);

      // Step 5: Make authenticated API calls
      const balance = await Moralis.EvmApi.balance.getNativeBalance({
        address: address,
        chain: chainId,
      });

      console.log('Balance fetched for authenticated user:', balance.result.balance.ether);

      const tokens = await Moralis.EvmApi.token.getWalletTokenBalances({
        address: address,
        chain: chainId,
      });

      console.log('Tokens fetched for authenticated user:', tokens.result.length, 'tokens');

    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    console.log('User logged out from Moralis');
  };

  if (!isInitialized) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <p className="text-center">Initializing Moralis...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Moralis Authentication</CardTitle>
        <CardDescription>
          Complete authentication flow with message signing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <Button onClick={handleLogin} disabled={isLoading} className="w-full">
            {isLoading ? 'Authenticating...' : 'Sign In with Moralis Auth'}
          </Button>
        ) : (
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Sign Out
          </Button>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {user && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ Authenticated with Moralis Auth!</p>
              <p className="text-green-700 text-sm">User session created in Moralis database</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Wallet Address</p>
              <p className="text-xs text-muted-foreground break-all">
                {user.address}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Chain ID</p>
              <p className="text-xs text-muted-foreground">
                {user.chainId}
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Authenticated At</p>
              <p className="text-xs text-muted-foreground">
                {new Date(user.authenticatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 