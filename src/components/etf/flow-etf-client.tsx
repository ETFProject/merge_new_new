'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCard } from "@/components/ui/client-card";
import { FLOW_TESTNET } from '@/lib/flow-contracts';

// Add proper interface for ETF data
interface TokenData {
  chainId: number;
  tokenAddress: string;
  tokenSymbol: string;
  weight: number;
  amount: string;
  price: number;
  logoUrl?: string;
}

interface ETFPerformance {
  totalReturn: number;
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
  volatility: number;
  lastUpdated: string;
}

interface ETFData {
  etfId: string;
  totalValueUSD: number;
  navPerShare: number;
  totalSupply: string;
  tokens: TokenData[];
  performance: ETFPerformance;
  lastRebalance: string;
  priceSource: string;
  needsRebalancing: boolean;
}

interface FlowETFClientProps {
  onSuccess?: () => void;
}

export function FlowETFClient({ onSuccess }: FlowETFClientProps) {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [etfData, setEtfData] = useState<ETFData | null>(null);
  const [flowBalance, setFlowBalance] = useState<string>('0');
  const [wflowBalance, setWflowBalance] = useState<string>('0');
  const [etfShareBalance, setEtfShareBalance] = useState<string>('0');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawToken, setWithdrawToken] = useState('wflow');

  // Connect to Ethereum provider
  const connectWallet = async () => {
    try {
      setLoading(true);
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        alert('Please install MetaMask to interact with Flow ETFs');
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const address = accounts[0];
      setUserAddress(address);
      
      // Check if on the correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      
      if (parseInt(chainId, 16) !== FLOW_TESTNET.chainId) {
        // Ask user to switch to Flow EVM Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${FLOW_TESTNET.chainId.toString(16)}` }],
          });
        } catch (switchError: unknown) {
          const error = switchError as {code: number};
          // This error code means the chain has not been added to MetaMask
          if (error.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${FLOW_TESTNET.chainId.toString(16)}`,
                  chainName: FLOW_TESTNET.name,
                  nativeCurrency: {
                    name: 'FLOW',
                    symbol: 'FLOW',
                    decimals: 18
                  },
                  rpcUrls: [FLOW_TESTNET.rpcUrl],
                  blockExplorerUrls: [FLOW_TESTNET.blockExplorer]
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
      
      setConnected(true);
      
      // Load user balances
      fetchUserBalances(address);
      
      // Subscribe to account changes
      window.ethereum.on('accountsChanged', (accounts: unknown) => {
        const addrs = accounts as string[];
        if (addrs.length === 0) {
          setConnected(false);
          setUserAddress(null);
        } else {
          setUserAddress(addrs[0]);
          fetchUserBalances(addrs[0]);
        }
      });
      
      // Subscribe to chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch ETF data from the API
  const fetchEtfData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/flow/portfolio');
      const data = await response.json();
      
      if (data.success) {
        setEtfData(data.data);
      } else {
        console.error('Error fetching ETF data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching ETF data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch user balances
  const fetchUserBalances = async (address: string) => {
    if (!address) return;
    
    try {
      // Set up provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get native FLOW balance
      const flowBalance = await provider.getBalance(address);
      setFlowBalance(ethers.formatEther(flowBalance));
      
      // Get WFLOW and ETF share balances (simplified for demo)
      // In a real app, you'd create contract instances and call balanceOf
      
      // Simulate contract calls
      setWflowBalance('0.5');
      setEtfShareBalance('1.2');
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };
  
  // Deposit into ETF
  const handleDeposit = async () => {
    if (!userAddress || !depositAmount) return;
    
    try {
      setLoading(true);
      
      // Call the deposit API
      const response = await fetch('/api/flow/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: 'usdc', // Only USDC
          amount: depositAmount,
          userAddress
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully deposited ${depositAmount} USDC\nTransaction Hash: ${data.data.txHash}\nShares Received: ${data.data.shares}`);
        setDepositAmount('');
        
        // Refresh balances and ETF data
        fetchUserBalances(userAddress);
        fetchEtfData();
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(`Deposit failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error depositing:', error);
      alert('Failed to deposit');
    } finally {
      setLoading(false);
    }
  };
  
  // Withdraw from ETF
  const handleWithdraw = async () => {
    if (!userAddress || !withdrawAmount) return;
    
    try {
      setLoading(true);
      
      // Call the withdraw API
      const response = await fetch('/api/flow/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shares: withdrawAmount,
          tokenOut: 'usdc', // Only USDC
          userAddress
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Successfully withdrew ${withdrawAmount} ETF shares\nTransaction Hash: ${data.data.txHash}\nUSDC Received: ${data.data.amount}`);
        setWithdrawAmount('');
        
        // Refresh balances and ETF data
        fetchUserBalances(userAddress);
        fetchEtfData();
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(`Withdrawal failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error withdrawing:', error);
      alert('Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };
  
  // Trigger rebalance
  const handleRebalance = async () => {
    if (!userAddress) return;
    
    try {
      setLoading(true);
      
      // Call the rebalance API
      const response = await fetch('/api/flow/rebalance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAddress
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.data.rebalanced) {
          alert(`ETF successfully rebalanced\nTransaction Hash: ${data.data.txHash}`);
          
          // Refresh ETF data
          fetchEtfData();
          
          if (onSuccess) {
            onSuccess();
          }
        } else {
          alert('ETF is already balanced. No rebalancing needed.');
        }
      } else {
        alert(`Rebalance failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rebalancing:', error);
      alert('Failed to rebalance');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch ETF data on initial load
  useEffect(() => {
    fetchEtfData();
  }, []);
  
  return (
    <ClientCard className="w-full" hover appear>
      <CardHeader>
        <CardTitle>Flow ETF Manager</CardTitle>
        <CardDescription>
          Interact with Flow ETF contracts on the Flow EVM Testnet
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* ETF Info */}
        {etfData && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h3 className="text-lg font-medium mb-2">Flow ETF Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-md">
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">${etfData.totalValueUSD.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-md">
                <p className="text-xs text-muted-foreground">NAV per Share</p>
                <p className="text-xl font-bold">${etfData.navPerShare.toFixed(4)}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-md">
                <p className="text-xs text-muted-foreground">Needs Rebalancing</p>
                <p className="text-xl font-bold">{etfData.needsRebalancing ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <h4 className="text-md font-medium mb-2">Token Allocations</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Token</th>
                    <th className="text-right pb-2">Weight</th>
                    <th className="text-right pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {etfData.tokens.map((token, index) => (
                    <tr key={index} className="border-b border-muted/20">
                      <td className="py-2">
                        <div className="flex items-center">
                          <span className="font-medium">{token.tokenSymbol}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {token.tokenAddress.substring(0, 6)}...{token.tokenAddress.substring(token.tokenAddress.length - 4)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-right">{token.weight.toFixed(2)}%</td>
                      <td className="py-2 text-right font-mono">{token.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={handleRebalance} 
                disabled={loading || !connected || !etfData.needsRebalancing}
                size="sm"
              >
                {loading ? 'Processing...' : 'Rebalance ETF'}
              </Button>
              {!etfData.needsRebalancing && (
                <p className="text-xs text-muted-foreground mt-1">ETF is already balanced</p>
              )}
            </div>
          </div>
        )}
        
        {/* Deposit/Withdraw Controls */}
        {connected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deposit Section */}
            <div className="p-4 border rounded-md bg-muted/20">
              <h3 className="text-lg font-medium mb-4">Deposit USDC to ETF</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="depositAmount" className="block text-sm font-medium mb-1">
                    USDC Amount
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="depositAmount"
                      type="number"
                      placeholder="0.0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      min="0"
                      step="0.01"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDepositAmount(flowBalance)}
                    >
                      Max
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {flowBalance} USDC
                  </p>
                </div>
                
                <Button 
                  onClick={handleDeposit}
                  disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0 || parseFloat(depositAmount) > parseFloat(flowBalance)}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Deposit USDC'}
                </Button>
              </div>
            </div>
            
            {/* Withdraw Section */}
            <div className="p-4 border rounded-md bg-muted/20">
              <h3 className="text-lg font-medium mb-4">Withdraw USDC from ETF</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="withdrawAmount" className="block text-sm font-medium mb-1">
                    ETF Shares
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="withdrawAmount"
                      type="number"
                      placeholder="0.0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      min="0"
                      step="0.01"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setWithdrawAmount(etfShareBalance)}
                    >
                      Max
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {etfShareBalance} ETF Shares
                  </p>
                </div>
                
                <Button 
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(etfShareBalance)}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Withdraw USDC'}
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Link to Flow EVM Explorer */}
        <div className="text-center pt-4">
          <a 
            href={FLOW_TESTNET.blockExplorer}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View Contracts on Flow EVM Testnet Explorer
          </a>
        </div>
      </CardContent>
    </ClientCard>
  );
} 