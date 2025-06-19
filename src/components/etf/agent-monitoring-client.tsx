'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCard } from "@/components/ui/client-card";
import { FLOW_TESTNET } from '@/lib/flow-contracts';
import { WalletConnectButton } from '@/components/WalletConnectButton';


// Interface for agent data
interface AgentData {
  address: string;
  isAuthorized: boolean;
  totalOperations: number;
  lastOperation: string;
  balance: string;
  status: 'active' | 'inactive' | 'pending';
}

interface OperationData {
  id: string;
  type: string;
  timestamp: string;
  targetToken?: string;
  amount?: string;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
}

interface AgentMonitoringClientProps {
  onSuccess?: () => void;
}

export function AgentMonitoringClient({ onSuccess }: AgentMonitoringClientProps) {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [operations, setOperations] = useState<OperationData[]>([]);
  const [newAgentAddress, setNewAgentAddress] = useState('');

  // Connect to Ethereum provider
  // const connectWallet = async () => {
  //   try {
  //     setLoading(true);
      
  //     // Check if MetaMask is installed
  //     if (!window.ethereum) {
  //       alert('Please install MetaMask to interact with Flow ETFs');
  //       return;
  //     }
      
  //     // Request account access
  //     const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
  //     const address = accounts[0];
  //     setUserAddress(address);
      
  //     // Check if on the correct network
  //     const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      
  //     if (parseInt(chainId, 16) !== FLOW_TESTNET.chainId) {
  //       // Ask user to switch to Flow EVM Testnet
  //       try {
  //         await window.ethereum.request({
  //           method: 'wallet_switchEthereumChain',
  //           params: [{ chainId: `0x${FLOW_TESTNET.chainId.toString(16)}` }],
  //         });
  //       } catch (switchError: unknown) {
  //         const error = switchError as {code: number};
  //         if (error.code === 4902) {
  //           await window.ethereum.request({
  //             method: 'wallet_addEthereumChain',
  //             params: [
  //               {
  //                 chainId: `0x${FLOW_TESTNET.chainId.toString(16)}`,
  //                 chainName: FLOW_TESTNET.name,
  //                 nativeCurrency: {
  //                   name: 'FLOW',
  //                   symbol: 'FLOW',
  //                   decimals: 18
  //                 },
  //                 rpcUrls: [FLOW_TESTNET.rpcUrl],
  //                 blockExplorerUrls: [FLOW_TESTNET.blockExplorer]
  //               },
  //             ],
  //           });
  //         } else {
  //           throw switchError;
  //         }
  //       }
  //     }
      
  //     setConnected(true);
  //     fetchAgentData();
  //     fetchRecentOperations();
      
  //   } catch (error) {
  //     console.error('Error connecting wallet:', error);
  //     alert('Failed to connect wallet');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  
  // Fetch agent data
  const fetchAgentData = async () => {
    try {
      setLoading(true);
      
      // Fetch from the API
      const response = await fetch('/api/flow/agent');
      const data = await response.json();
      
      if (data.success) {
        setAgentData(data.data);
        if (data.data.operations) {
          setOperations(data.data.operations);
        }
      } else {
        console.error('Error fetching agent data:', data.error);
        // Fall back to mock data
        const mockAgentData: AgentData = {
          address: '0x7Fc6C6C0eFe82471e15d4bc1b49c60A22C6F103F',
          isAuthorized: true,
          totalOperations: 142,
          lastOperation: new Date().toISOString(),
          balance: '0.5',
          status: 'active'
        };
        
        setAgentData(mockAgentData);
      }
      
    } catch (error) {
      console.error('Error fetching agent data:', error);
      // Fall back to mock data
      const mockAgentData: AgentData = {
        address: '0x7Fc6C6C0eFe82471e15d4bc1b49c60A22C6F103F',
        isAuthorized: true,
        totalOperations: 142,
        lastOperation: new Date().toISOString(),
        balance: '0.5',
        status: 'active'
      };
      
      setAgentData(mockAgentData);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch recent operations
  const fetchRecentOperations = async () => {
    try {
      // We now get operations from the agent endpoint
      if (!operations.length) {
        // Mock operations as fallback
        const mockOperations: OperationData[] = [
          {
            id: '0x' + Math.random().toString(16).slice(2),
            type: 'Rebalance',
            timestamp: new Date().toISOString(),
            targetToken: 'WFLOW',
            amount: '25',
            status: 'completed',
            txHash: '0x' + Math.random().toString(16).slice(2)
          },
          {
            id: '0x' + Math.random().toString(16).slice(2),
            type: 'Cross-Chain Transfer',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            targetToken: 'USDC',
            amount: '500',
            status: 'completed',
            txHash: '0x' + Math.random().toString(16).slice(2)
          },
          {
            id: '0x' + Math.random().toString(16).slice(2),
            type: 'Fee Collection',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            amount: '0.05',
            status: 'completed',
            txHash: '0x' + Math.random().toString(16).slice(2)
          }
        ];
        
        setOperations(mockOperations);
      }
    } catch (error) {
      console.error('Error fetching operations:', error);
    }
  };
  
  // Set a new agent
  const handleSetAgent = async () => {
    if (!connected || !userAddress || !newAgentAddress) return;
    
    try {
      setLoading(true);
      
      // Call the agent API
      const response = await fetch('/api/flow/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'setAgent',
          agent: newAgentAddress
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Agent wallet set to ${newAgentAddress}`);
        setNewAgentAddress('');
        
        // Update agent data
        if (agentData) {
          setAgentData({
            ...agentData,
            address: newAgentAddress,
            status: 'pending'
          });
        }
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(`Failed to set agent: ${data.error}`);
      }
      
    } catch (error) {
      console.error('Error setting agent:', error);
      alert('Failed to set agent wallet');
    } finally {
      setLoading(false);
    }
  };
  
  // Authorize or deauthorize an agent
  const handleAuthorizeAgent = async (authorize: boolean) => {
    if (!connected || !userAddress || !agentData) return;
    
    try {
      setLoading(true);
      
      // Call the agent API
      const response = await fetch('/api/flow/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'authorize',
          agent: agentData.address,
          authorized: authorize
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Agent ${authorize ? 'authorized' : 'deauthorized'} successfully`);
        
        // Update agent data
        setAgentData({
          ...agentData,
          isAuthorized: authorize,
          status: authorize ? 'active' : 'inactive'
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        alert(`Failed to ${authorize ? 'authorize' : 'deauthorize'} agent: ${data.error}`);
      }
      
    } catch (error) {
      console.error('Error authorizing agent:', error);
      alert(`Failed to ${authorize ? 'authorize' : 'deauthorize'} agent`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on initial load
  useEffect(() => {
    fetchAgentData();
    fetchRecentOperations();
  }, []);
  
  return (
    <ClientCard className="w-full" hover appear>
      <CardHeader>
        <CardTitle>ITF Agent Monitor</CardTitle>
        <CardDescription>
          Manage and monitor ITF agent operations on the Flow EVM Testnet
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Agent Status */}
        {agentData && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h3 className="text-lg font-medium mb-4">Current Agent Status</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Agent Address</p>
                <p className="font-mono text-sm">{agentData.address}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    agentData.status === 'active' ? 'bg-green-500' :
                    agentData.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <p>{
                    agentData.status === 'active' ? 'Active' :
                    agentData.status === 'pending' ? 'Pending' : 'Inactive'
                  }</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Authorization</p>
                <p>{agentData.isAuthorized ? 'Authorized' : 'Not Authorized'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Balance</p>
                <p>{agentData.balance} FLOW</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Operations</p>
                <p>{agentData.totalOperations}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Operation</p>
                <p>{new Date(agentData.lastOperation).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 mt-4">
              {!agentData.isAuthorized ? (
                <Button onClick={() => handleAuthorizeAgent(true)} disabled={loading || !connected} size="sm">
                  {loading ? 'Processing...' : 'Authorize Agent'}
                </Button>
              ) : (
                <Button onClick={() => handleAuthorizeAgent(false)} disabled={loading || !connected} variant="destructive" size="sm">
                  {loading ? 'Processing...' : 'Deauthorize Agent'}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Set New Agent */}
        {connected && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h3 className="text-lg font-medium mb-4">Set New Agent</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="agentAddress" className="block text-sm font-medium mb-1">
                  New Agent Address
                </label>
                <div className="flex space-x-2">
                  <input
                    id="agentAddress"
                    type="text"
                    placeholder="0x..."
                    value={newAgentAddress}
                    onChange={(e) => setNewAgentAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleSetAgent}
                disabled={loading || !newAgentAddress || !ethers.isAddress(newAgentAddress)}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Set New Agent'}
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Note: Setting a new agent requires approval from the ITF vault owner.
                The new agent will be in a pending state until it is authorized.
              </p>
            </div>
          </div>
        )}
        
        {/* Recent Operations */}
        {operations.length > 0 && (
          <div className="p-4 border rounded-md bg-muted/20">
            <h3 className="text-lg font-medium mb-4">Recent Operations</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2">Type</th>
                    <th className="text-left pb-2">Time</th>
                    <th className="text-left pb-2">Details</th>
                    <th className="text-right pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((op) => (
                    <tr key={op.id} className="border-b border-muted/20">
                      <td className="py-2">
                        <div className="font-medium">{op.type}</div>
                      </td>
                      <td className="py-2">
                        {new Date(op.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2">
                        {op.targetToken && (
                          <div className="text-xs">
                            Token: {op.targetToken}
                            {op.amount && <>, Amount: {op.amount}</>}
                          </div>
                        )}
                        {!op.targetToken && op.amount && (
                          <div className="text-xs">
                            Amount: {op.amount}
                          </div>
                        )}
                        <div className="text-xs font-mono text-muted-foreground">
                          Tx: {op.txHash.substring(0, 10)}...
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          op.status === 'completed' ? 'bg-green-100 text-green-800' :
                          op.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {op.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            View Transactions on Flow EVM Testnet Explorer
          </a>
        </div>
      </CardContent>
    </ClientCard>
  );
} 