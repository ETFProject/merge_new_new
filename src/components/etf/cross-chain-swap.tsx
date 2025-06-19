'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCard } from "@/components/ui/client-card";
import { getRandomBytes32, HashLock } from '@/lib/crypto-utils';

// Network definitions
const NETWORKS = {
  ETHEREUM: { id: 1, name: 'Ethereum', icon: '/1byone1.jpg' },
  OPTIMISM: { id: 10, name: 'Optimism', icon: '/1byone5.jpg' },
  BSC: { id: 56, name: 'BNB Chain', icon: '/1byone8.jpg' },
  POLYGON: { id: 137, name: 'Polygon', icon: '/1byone10.jpg' },
  ARBITRUM: { id: 42161, name: 'Arbitrum', icon: '/1byone13.jpg' },
  AVALANCHE: { id: 43114, name: 'Avalanche', icon: '/1byone19.jpg' },
  GNOSIS: { id: 100, name: 'Gnosis', icon: '/1byone24.jpg' },
  BASE: { id: 8453, name: 'Base', icon: '/1byone5.jpg' },
  ZKSYNC: { id: 324, name: 'zkSync', icon: '/jellyfish.png' }
};

// Token definitions
const TOKENS = {
  ETH: { 
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    name: 'ETH',
    decimals: 18,
    logo: '/sandwave.png'
  },
  WETH: {
    address: {
      [NETWORKS.BASE.id]: '0x4200000000000000000000000000000000000006',
      [NETWORKS.ARBITRUM.id]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
    },
    name: 'WETH',
    decimals: 18,
    logo: '/sandwave.png'
  },
  USDC: {
    address: {
      [NETWORKS.BASE.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      [NETWORKS.ARBITRUM.id]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
    },
    name: 'USDC',
    decimals: 6,
    logo: '/flower.png'
  }
};

// Define interfaces for types
interface QuoteData {
  srcAmount: string;
  dstAmount: string;
  fee?: string;
  estimatedTime?: number;
}

interface Order {
  orderHash: string;
  srcChainId: number;
  dstChainId: number;
  status?: string;
}

interface CrossChainSwapProps {
  onSuccess?: () => void;
}

export function CrossChainSwap({ onSuccess }: CrossChainSwapProps) {
  // State variables
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [sourceChain, setSourceChain] = useState(NETWORKS.BASE);
  const [destChain, setDestChain] = useState(NETWORKS.ARBITRUM);
  const [amount, setAmount] = useState('0.0001');
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [swapStatus, setSwapStatus] = useState<'idle' | 'quoted' | 'processing' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderHash, setOrderHash] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      setLoading(true);
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setErrorMessage('Please install MetaMask to use this feature');
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const address = accounts[0];
      setUserAddress(address);
      
      // Check if on the correct network (Base for initial swap)
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const currentChainId = parseInt(chainId, 16);
      
      if (currentChainId !== sourceChain.id) {
        try {
          // Ask user to switch to Base network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${sourceChain.id.toString(16)}` }],
          });
        } catch (switchError: unknown) {
          const error = switchError as {code: number};
          if (error.code === 4902) {
            // Base chain not added yet, suggest adding it
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${sourceChain.id.toString(16)}`,
                  chainName: 'Base Mainnet',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org']
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      setConnected(true);
      getActiveOrders();
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setErrorMessage('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };
  
  // Get quote for cross-chain swap
  const getQuote = async () => {
    if (!connected || !userAddress) {
      setErrorMessage('Please connect your wallet first');
      return;
    }
    
    try {
      setQuoteLoading(true);
      setErrorMessage(null);
      
      // Validate amount
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setErrorMessage('Please enter a valid amount');
        return;
      }
      
      // Mock quote data for demo
      const mockQuote = {
        srcAmount: amount,
        dstAmount: (parseFloat(amount) * 0.9985).toFixed(6), // Mock exchange rate
        fee: '0.15%',
        estimatedTime: 120 // 2 minutes
      };
      
      console.log('Mock quote data:', mockQuote);
      setQuote(mockQuote);
      setSwapStatus('quoted');
      
    } catch (error) {
      console.error('Error getting quote:', error);
      setErrorMessage('Failed to get quote. Check your connection and try again.');
    } finally {
      setQuoteLoading(false);
    }
  };
  
  // Execute the cross-chain swap
  const executeSwap = async () => {
    if (!connected || !userAddress || !quote) {
      setErrorMessage('Please connect wallet and get a quote first');
      return;
    }
    
    try {
      setLoading(true);
      setErrorMessage(null);
      setSwapStatus('processing');
      
      // Generate required secrets and hashes for 1inch Fusion+
      const secrets = [getRandomBytes32()];
      const secretHashes = secrets.map((x) => HashLock.hashSecret(x));
      
      // Create a hashLock for single fill (simplified for demo)
      const hashLock = HashLock.forSingleFill(secrets[0]);
      
      // Create order parameters
      const orderParams = {
        walletAddress: userAddress,
        hashLock,
        secretHashes
      };
      
      // Place the order via our API route
      const response = await fetch('/api/1inch/fusion-plus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'placeOrder',
          quote,
          orderParams
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error placing order:', errorData);
        setErrorMessage(errorData.error || 'Failed to place order');
        setSwapStatus('error');
        return;
      }
      
      const orderData = await response.json();
      
      if (!orderData.success) {
        setErrorMessage(orderData.error || 'Failed to place order');
        setSwapStatus('error');
        return;
      }
      
      console.log('Order placed successfully:', orderData.data);
      setOrderHash(orderData.data.orderHash);
      
      // For demo purposes, we'll simulate order completion
      // In a real implementation, you'd monitor the order status
      // and submit the secret when necessary
      setTimeout(() => {
        setSwapStatus('complete');
        getActiveOrders();
        if (onSuccess) onSuccess();
      }, 5000);
      
    } catch (error) {
      console.error('Error executing swap:', error);
      setErrorMessage('Failed to execute swap. Check your connection and try again.');
      setSwapStatus('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Get active orders
  const getActiveOrders = async () => {
    if (!connected || !userAddress) return;
    
    try {
      const response = await fetch('/api/1inch/fusion-plus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'getActiveOrders',
          page: 1,
          limit: 5
        })
      });
      
      if (!response.ok) {
        console.error('Error getting active orders');
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.orders) {
        setActiveOrders(data.data.orders);
      }
    } catch (error) {
      console.error('Error getting active orders:', error);
    }
  };
  
  useEffect(() => {
    // Check if user is already connected
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setUserAddress(accounts[0]);
            setConnected(true);
            getActiveOrders();
          }
        })
        .catch(console.error);
    }
  }, []);
  
  // Handle network change in wallet
  const handleSourceChainChange = async (newChainId: number) => {
    if (!connected) return;
    
    try {
      setLoading(true);
      
      // Update state
      const newSourceChain = Object.values(NETWORKS).find(network => network.id === newChainId);
      if (!newSourceChain) {
        setErrorMessage('Invalid network selected');
        return;
      }
      
      setSourceChain(newSourceChain);
      
      // Request wallet to switch networks
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${newChainId.toString(16)}` }],
      });
      
      // Reset quote when changing networks
      setQuote(null);
      setSwapStatus('idle');
      
    } catch (error) {
      console.error('Error switching network:', error);
      setErrorMessage('Failed to switch network');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ClientCard className="w-full" hover appear>
      <CardHeader>
        <CardTitle>Cross-Chain Swap (1inch Fusion+)</CardTitle>
        <CardDescription>
          Swap assets between different blockchains using 1inch Fusion+ technology
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="p-4 border rounded-md bg-muted/20">
          <h3 className="text-lg font-medium mb-2">Connection Status</h3>
          {connected ? (
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Connected Address</p>
                <p className="font-mono text-sm truncate">{userAddress}</p>
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={connectWallet} disabled={loading}>
                  {loading ? 'Processing...' : 'Refresh'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center md:flex-row md:justify-between gap-4">
              <p className="text-muted-foreground">Connect your wallet to start swapping</p>
              <Button onClick={connectWallet} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            </div>
          )}
        </div>
        
        {/* Swap Configuration */}
        {connected && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h3 className="text-lg font-medium mb-4">Configure Swap</h3>
            
            <div className="space-y-4">
              {/* Network Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="sourceChain">Source Chain</label>
                  <select 
                    id="sourceChain"
                    name="sourceChain"
                    className="w-full px-3 py-2 border rounded-md"
                    value={sourceChain.id}
                    onChange={(e) => handleSourceChainChange(parseInt(e.target.value))}
                    disabled={loading || quoteLoading || swapStatus === 'processing'}
                    aria-label="Select source blockchain"
                    title="Source blockchain network"
                  >
                    <option value={NETWORKS.BASE.id}>Base</option>
                    <option value={NETWORKS.ETHEREUM.id}>Ethereum</option>
                    <option value={NETWORKS.OPTIMISM.id}>Optimism</option>
                    <option value={NETWORKS.ARBITRUM.id}>Arbitrum</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="destChain">Destination Chain</label>
                  <select 
                    id="destChain"
                    name="destChain"
                    className="w-full px-3 py-2 border rounded-md"
                    value={destChain.id}
                    onChange={(e) => setDestChain(Object.values(NETWORKS).find(n => n.id === parseInt(e.target.value)) || NETWORKS.ARBITRUM)}
                    disabled={loading || quoteLoading || swapStatus === 'processing'}
                    aria-label="Select destination blockchain"
                    title="Destination blockchain network"
                  >
                    <option value={NETWORKS.ARBITRUM.id}>Arbitrum</option>
                    <option value={NETWORKS.OPTIMISM.id}>Optimism</option>
                    <option value={NETWORKS.ETHEREUM.id}>Ethereum</option>
                    <option value={NETWORKS.BASE.id}>Base</option>
                  </select>
                </div>
              </div>
              
              {/* Amount Input */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-1">
                  Amount (ETH)
                </label>
                <input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0001"
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={loading || quoteLoading || swapStatus === 'processing'}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Swap ETH from {sourceChain.name} to {destChain.name}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button 
                  onClick={getQuote}
                  disabled={loading || quoteLoading || swapStatus === 'processing' || sourceChain.id === destChain.id}
                  variant="outline"
                >
                  {quoteLoading ? 'Getting Quote...' : 'Get Quote'}
                </Button>
                
                <Button
                  onClick={executeSwap}
                  disabled={loading || quoteLoading || swapStatus !== 'quoted' || !quote}
                >
                  {loading ? 'Processing...' : 'Execute Swap'}
                </Button>
              </div>
              
              {/* Error Message */}
              {errorMessage && (
                <div className="p-2 bg-red-100 text-red-800 rounded-md text-sm">
                  {errorMessage}
                </div>
              )}
              
              {/* Quote Details */}
              {quote && swapStatus === 'quoted' && (
                <div className="mt-4 p-3 bg-card/50 rounded-md">
                  <h4 className="font-medium mb-2">Quote Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Source Amount:</div>
                    <div>{ethers.formatEther(quote.srcAmount)} ETH</div>
                    
                    <div className="text-muted-foreground">Destination Amount:</div>
                    <div>{ethers.formatEther(quote.dstAmount)} ETH</div>
                    
                    <div className="text-muted-foreground">Fee:</div>
                    <div>{quote.fee ? ethers.formatEther(quote.fee) : '0'} ETH</div>
                    
                    <div className="text-muted-foreground">Estimated Execution Time:</div>
                    <div>{quote.estimatedTime ? `${quote.estimatedTime} seconds` : 'Unknown'}</div>
                  </div>
                </div>
              )}
              
              {/* Swap Status */}
              {swapStatus === 'processing' && (
                <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
                  <p className="font-medium">Processing Swap</p>
                  <p className="text-sm">Your cross-chain swap is being processed. This may take a few minutes.</p>
                </div>
              )}
              
              {swapStatus === 'complete' && (
                <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
                  <p className="font-medium">Swap Complete</p>
                  <p className="text-sm">Your cross-chain swap has been successfully completed.</p>
                  {orderHash && (
                    <p className="text-xs font-mono mt-2">Order Hash: {orderHash}</p>
                  )}
                </div>
              )}
              
              {swapStatus === 'error' && (
                <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
                  <p className="font-medium">Swap Failed</p>
                  <p className="text-sm">{errorMessage || 'An error occurred during the swap process.'}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Active Orders */}
        {connected && activeOrders.length > 0 && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h3 className="text-lg font-medium mb-4">Your Active Orders</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Order Hash</th>
                    <th className="text-left pb-2">From</th>
                    <th className="text-left pb-2">To</th>
                    <th className="text-right pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.map((order) => (
                    <tr key={order.orderHash} className="border-b border-muted/20">
                      <td className="py-2">
                        <div className="font-mono text-xs">{order.orderHash.substring(0, 10)}...</div>
                      </td>
                      <td className="py-2">
                        <div className="text-xs">
                          {order.srcChainId === NETWORKS.BASE.id ? 'Base' : 
                           order.srcChainId === NETWORKS.ARBITRUM.id ? 'Arbitrum' : 
                           order.srcChainId === NETWORKS.ETHEREUM.id ? 'Ethereum' : 
                           `Chain ${order.srcChainId}`}
                        </div>
                      </td>
                      <td className="py-2">
                        <div className="text-xs">
                          {order.dstChainId === NETWORKS.BASE.id ? 'Base' : 
                           order.dstChainId === NETWORKS.ARBITRUM.id ? 'Arbitrum' : 
                           order.dstChainId === NETWORKS.ETHEREUM.id ? 'Ethereum' : 
                           `Chain ${order.dstChainId}`}
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {order.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Information Section */}
        <div className="text-sm space-y-2 p-4 bg-muted/10 rounded-md">
          <h3 className="font-medium">About 1inch Fusion+</h3>
          <p>
            1inch Fusion+ is a cross-chain swapping protocol that allows for seamless asset transfers between different blockchains.
            It uses a unique hashlock mechanism to ensure secure swaps without requiring trust between parties.
          </p>
          <p>
            This demo allows you to swap ETH from Base to Arbitrum and vice versa, using 1inch&apos;s powerful cross-chain infrastructure.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <a 
          href="https://docs.1inch.io/docs/fusion-swap/cross-chain-swaps"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Learn more about 1inch Fusion+
        </a>
        
        <a 
          href={connected && userAddress ? `https://app.1inch.io/#/${sourceChain.id}/unified/swap/ETH/${destChain.id}/ETH` : 'https://app.1inch.io'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Open in 1inch App
        </a>
      </CardFooter>
    </ClientCard>
  );
} 