'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { JsonFragment } from 'ethers';
import ETFVaultJSON from '@/lib/abis/FlowETFVault.json';
import WrappedFlowJSON from '@/lib/abis/WrappedFlow.json';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { CONTRACT_ADDRESSES, ASSET_ADDRESSES } from '@/config/contracts';
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallets } from '@/components/PrivyWalletsWrapper';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Extract ABI function  
const extractAbi = (abiJson: any): JsonFragment[] => {
  try {
    if (Array.isArray(abiJson)) return abiJson as JsonFragment[];
    if (abiJson?.abi) return abiJson.abi;
    return [];
  } catch (error) {
    console.error("Error extracting ABI:", error);
    return [];
  }
};

const vaultAbi = extractAbi(ETFVaultJSON);
const tokenAbi = extractAbi(WrappedFlowJSON);

export default function AbiTestPage() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = usePrivyWallets();
  
  // State
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [etfInfo, setEtfInfo] = useState({ 
    name: "", symbol: "", agent: "", totalValue: "", paused: false, 
    owner: "", minDeposit: ""
  });
  const [selectedToken, setSelectedToken] = useState<keyof typeof ASSET_ADDRESSES>("WFLOW");
  const [tokenBalance, setTokenBalance] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");
  const [newAgentAddress, setNewAgentAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const primaryWallet = wallets?.[0];
  const userAddress = primaryWallet?.address || "";

  // Initialize provider and setup wallet
  useEffect(() => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
      setProvider(rpcProvider as unknown as ethers.BrowserProvider);
    } catch (error) {
      console.error("Error initializing provider:", error);
      toast.error("Failed to initialize blockchain connection");
    }
  }, []);

  useEffect(() => {
    async function setupSigner() {
      if (primaryWallet && authenticated && ready) {
        try {
          const ethereumProvider = await primaryWallet.getEthereumProvider();
          const web3Provider = new ethers.BrowserProvider(ethereumProvider);
          const walletSigner = await web3Provider.getSigner();
          
          setProvider(web3Provider);
          setSigner(walletSigner);
          toast.success(`Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`);
        } catch (error) {
          console.error("Error setting up signer:", error);
          toast.error("Failed to set up wallet connection");
        }
      }
    }
    setupSigner();
  }, [primaryWallet, authenticated, ready, userAddress]);

  // Fetch ETF info with agent details
  const fetchEtfInfo = async () => {
    if (!provider) {
      toast.error("Provider not available");
      return;
    }
    
    try {
      setLoading(true);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, provider);
      
      const [name, symbol, agent, totalValue, paused, owner, minDeposit] = await Promise.allSettled([
        contract.name(),
        contract.symbol(), 
        contract.agentWallet(),
        contract.getTotalValue(),
        contract.paused(),
        contract.owner(),
        contract.MIN_DEPOSIT()
      ]);
      
      setEtfInfo({ 
        name: name.status === 'fulfilled' ? name.value : "Error",
        symbol: symbol.status === 'fulfilled' ? symbol.value : "Error",
        agent: agent.status === 'fulfilled' ? agent.value : "",
        totalValue: totalValue.status === 'fulfilled' ? ethers.formatEther(totalValue.value) : "0",
        paused: paused.status === 'fulfilled' ? paused.value : false,
        owner: owner.status === 'fulfilled' ? owner.value : "",
        minDeposit: minDeposit.status === 'fulfilled' ? ethers.formatEther(minDeposit.value) : "0"
      });
      toast.success("ETF information loaded");
    } catch (error) {
      console.error("Error fetching ETF info:", error);
      toast.error("Failed to fetch ETF information");
    } finally {
      setLoading(false);
    }
  };

  // SIMPLIFIED Deposit function - no complex pre-checks to ensure wallet popup works
  const handleDeposit = async () => {
    if (!signer) {
      toast.error("Connect wallet first");
      return;
    }

    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      toast.error("Please enter a valid deposit amount");
      return;
    }
    
    setLoading(true);
    try {
      const tokenAddress = ASSET_ADDRESSES.USDC; // Only USDC
      const amt = ethers.parseUnits(depositAmount, 6); // USDC has 6 decimals
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, signer);

      // Check allowance first
      const allowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESSES.etfVault);
      
      if (allowance < amt) {
        toast.info("Approving USDC spend...");
        const approvalTx = await tokenContract.approve(CONTRACT_ADDRESSES.etfVault, amt);
        await approvalTx.wait();
        toast.success("Approval successful");
      }

      // Execute deposit
      toast.info("Executing USDC deposit...");
      const depositTx = await vaultContract.deposit(tokenAddress, amt);
      
      const receipt = await depositTx.wait();
      toast.success(`Deposited ${depositAmount} USDC! Tx: ${receipt.hash.slice(0, 10)}...`);
      
      await fetchTokenBalance();
      await fetchEtfInfo();
      
    } catch (error: any) {
      console.error("Deposit failed:", error);
      if (error?.data && error.data.includes('0xe450d38c')) {
        toast.error("Asset not supported by ETF");
      } else if (error?.data && error.data.includes('0xd93c0665')) {
        toast.error("ETF contract is paused");
      } else {
        toast.error(`Deposit failed: ${error?.reason || error?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Token balance fetch
  const fetchTokenBalance = async () => {
    if (!provider || !userAddress) return;
    
    try {
      const tokenAddress = ASSET_ADDRESSES[selectedToken];
      const contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      const balance = await contract.balanceOf(userAddress);
      setTokenBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  // Faucet function
  const faucetToken = async () => {
    if (!signer) {
      toast.error("Connect wallet first");
      return;
    }
    
    try {
      setLoading(true);
      const tokenAddress = ASSET_ADDRESSES[selectedToken];
      const contract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      
      const tx = await contract.faucet();
      const receipt = await tx.wait();
      toast.success(`${selectedToken} tokens claimed! Tx: ${receipt.hash.slice(0, 10)}...`);
      await fetchTokenBalance();
    } catch (error) {
      console.error("Faucet failed:", error);
      toast.error("Failed to get tokens from faucet");
    } finally {
      setLoading(false);
    }
  };

  // AGENT MANAGEMENT FUNCTIONS
  const setAgentWallet = async () => {
    if (!signer) {
      toast.error("Connect wallet first");
      return;
    }

    if (!newAgentAddress || !ethers.isAddress(newAgentAddress)) {
      toast.error("Please enter a valid agent address");
      return;
    }
    
    try {
      setLoading(true);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, signer);
      
      // Check if user is owner
      const owner = await contract.owner();
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        toast.error("Only the owner can set the agent wallet");
        return;
      }

      toast.info("Setting new agent wallet...");
      const tx = await contract.setAgentWallet(newAgentAddress);
      const receipt = await tx.wait();
      
      toast.success(`Agent wallet updated! Tx: ${receipt.hash.slice(0, 10)}...`);
      setNewAgentAddress("");
      await fetchEtfInfo();
      
    } catch (error) {
      console.error("Set agent failed:", error);
      toast.error("Failed to set agent wallet");
    } finally {
      setLoading(false);
    }
  };

  const authorizeAgent = async (agentAddress: string, authorize: boolean) => {
    if (!signer) {
      toast.error("Connect wallet first");
      return;
    }
    
    try {
      setLoading(true);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, signer);
      
      toast.info(`${authorize ? 'Authorizing' : 'Deauthorizing'} agent...`);
      const tx = await contract.setAgentAuthorization(agentAddress, authorize);
      const receipt = await tx.wait();
      
      toast.success(`Agent ${authorize ? 'authorized' : 'deauthorized'}! Tx: ${receipt.hash.slice(0, 10)}...`);
      
    } catch (error) {
      console.error("Agent authorization failed:", error);
      toast.error("Failed to update agent authorization");
    } finally {
      setLoading(false);
    }
  };

  const checkAgentAuthorization = async (agentAddress: string) => {
    if (!provider || !agentAddress) return;
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, provider);
      const isAuthorized = await contract.authorizedAgents(agentAddress);
      toast.info(`Agent ${agentAddress.slice(0, 10)}... is ${isAuthorized ? 'AUTHORIZED' : 'NOT AUTHORIZED'}`);
    } catch (error) {
      console.error("Check authorization failed:", error);
      toast.error("Failed to check agent authorization");
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader><CardTitle>🚀 Fixed ABI Test Dashboard</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Vault ABI: <span className={vaultAbi.length > 0 ? 'text-green-500' : 'text-red-500'}>
              {vaultAbi.length > 0 ? 'Valid' : 'Invalid'}
            </span></div>
            <div>Token ABI: <span className={tokenAbi.length > 0 ? 'text-green-500' : 'text-red-500'}>
              {tokenAbi.length > 0 ? 'Valid' : 'Invalid'}
            </span></div>
            <div>Wallet: <span className={authenticated ? 'text-green-500' : 'text-red-500'}>
              {authenticated ? 'Connected' : 'Not Connected'}
            </span></div>
            <div>Ready: <span className={ready ? 'text-green-500' : 'text-red-500'}>
              {ready ? 'Yes' : 'No'}
            </span></div>
          </div>
          
          {userAddress ? (
            <div className="bg-green-50 p-2 rounded text-xs font-mono break-all">
              {userAddress}
            </div>
          ) : (
            <Button onClick={login} disabled={!ready} className="w-full">
              Connect Wallet
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ETF Info Card */}
      <Card>
        <CardHeader><CardTitle>📊 ETF Vault Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={fetchEtfInfo} disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Fetch ETF Info'}
          </Button>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Name:</strong> {etfInfo.name}</div>
            <div><strong>Symbol:</strong> {etfInfo.symbol}</div>
            <div><strong>Total Value:</strong> {etfInfo.totalValue} FLOW</div>
            <div><strong>Min Deposit:</strong> {etfInfo.minDeposit} FLOW</div>
            <div className="col-span-2">
              <strong>Status:</strong> 
              <span className={`ml-2 ${etfInfo.paused ? 'text-red-500' : 'text-green-500'}`}>
                {etfInfo.paused ? '⏸️ PAUSED' : '▶️ ACTIVE'}
              </span>
            </div>
            <div className="col-span-2">
              <strong>Owner:</strong> 
              <span className="font-mono text-xs ml-2">{etfInfo.owner}</span>
            </div>
            <div className="col-span-2">
              <strong>Current Agent:</strong> 
              <span className="font-mono text-xs ml-2">{etfInfo.agent}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Operations */}
      <Card>
        <CardHeader><CardTitle>🪙 Token Operations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="token-select" className="text-sm font-medium">
              Token:
            </Label>
            <div className="flex items-center px-3 py-2 bg-muted rounded-md text-sm font-medium">
              USDC
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="amount-input" className="text-sm font-medium">
              Amount:
            </Label>
            <Input
              id="amount-input"
              type="number"
              placeholder="USDC amount"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-32"
            />
            <Button onClick={handleDeposit} disabled={loading || !depositAmount}>
              {loading ? "Processing..." : "Deposit USDC"}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={faucetToken} disabled={loading || !authenticated} variant="outline">
              💧 Faucet
            </Button>
            <Button onClick={fetchTokenBalance} disabled={loading} variant="outline">
              🔄 Balance
            </Button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm"><strong>Balance:</strong> {tokenBalance} {selectedToken}</div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Management */}
      <Card>
        <CardHeader><CardTitle>🤖 Agent Management</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm font-medium mb-2">What are Agents?</div>
            <div className="text-xs text-gray-600">
              Agents are authorized addresses that can perform automated operations on the ETF vault, 
              such as rebalancing, moving funds to protocols, etc.
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Set New Agent Wallet:</label>
            <input 
              type="text"
              value={newAgentAddress} 
              onChange={e => setNewAgentAddress(e.target.value)}
              placeholder="0x... agent wallet address"
              className="w-full p-2 border rounded-md font-mono text-xs"
            />
          </div>
          
          <Button 
            onClick={setAgentWallet} 
            disabled={loading || !authenticated || !newAgentAddress} 
            className="w-full"
          >
            {loading ? 'Processing...' : 'Set Agent Wallet'}
          </Button>
          
          <div className="border-t pt-3">
            <div className="text-sm font-medium mb-2">Agent Actions:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => authorizeAgent(etfInfo.agent, true)} 
                disabled={loading || !authenticated}
                variant="outline" 
                size="sm"
              >
                ✅ Authorize Current
              </Button>
              <Button 
                onClick={() => authorizeAgent(etfInfo.agent, false)} 
                disabled={loading || !authenticated}
                variant="outline" 
                size="sm"
              >
                ❌ Deauthorize Current
              </Button>
            </div>
            <Button 
              onClick={() => checkAgentAuthorization(etfInfo.agent)} 
              disabled={loading || !etfInfo.agent}
              variant="outline" 
              size="sm"
              className="w-full mt-2"
            >
              🔍 Check Agent Status
            </Button>
          </div>
          
          <div className="text-xs text-gray-600 bg-amber-50 p-2 rounded">
            ⚠️ Only the vault owner can set the agent wallet. 
            Any authorized agent can perform automated operations.
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
