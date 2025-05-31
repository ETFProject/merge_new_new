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

// Error signature mapping for better debugging
const ERROR_SIGNATURES = {
  '0xe450d38c': 'AssetNotSupported()',
  '0xd93c0665': 'EnforcedPause()',
  '0x8dfc202b': 'ExpectedPause()',
  '0xcd7f6ba0': 'InsufficientBalance()',
  '0xbebdc757': 'InvalidAgent()',
  '0x981a2a2b': 'InvalidAsset()',
  '0x057f3fa7': 'InvalidChain()',
  '0x585b9263': 'InvalidWeight()',
  '0xdf8153c7': 'TooManyAssets()',
  '0x82b42960': 'Unauthorized()',
};

// Define a type for various ABI JSON formats
type AbiJsonFormat = 
  | JsonFragment[] 
  | { abi: JsonFragment[] } 
  | { result: JsonFragment[] } 
  | Record<string, unknown>;

// Safely extract ABI from JSON structure
const extractAbi = (abiJson: AbiJsonFormat): JsonFragment[] => {
  try {
    if (Array.isArray(abiJson)) {
      return abiJson as JsonFragment[];
    }
    if (abiJson && typeof abiJson === 'object' && 'abi' in abiJson) {
      return (abiJson as { abi: JsonFragment[] }).abi;
    }
    if (abiJson && typeof abiJson === 'object' && 'result' in abiJson) {
      return (abiJson as { result: JsonFragment[] }).result;
    }
    console.error("Could not extract ABI from JSON:", abiJson);
    return [];
  } catch (error) {
    console.error("Error extracting ABI:", error);
    return [];
  }
};

// Decode error for better debugging
const decodeContractError = (error: any): string => {
  if (error?.data && typeof error.data === 'string') {
    const errorData = error.data.slice(0, 10); // First 4 bytes
    const knownError = ERROR_SIGNATURES[errorData as keyof typeof ERROR_SIGNATURES];
    if (knownError) {
      return `Contract Error: ${knownError}`;
    }
  }
  return error?.reason || error?.message || 'Unknown contract error';
};

// Ensure correct ABI arrays
const vaultAbi = extractAbi(ETFVaultJSON as AbiJsonFormat);
const tokenAbi = extractAbi(WrappedFlowJSON as AbiJsonFormat);

export default function AbiTestPage() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = usePrivyWallets();
  
  // State management using only Privy wallet
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [etfInfo, setEtfInfo] = useState({ name: "", symbol: "", agent: "", totalValue: "", paused: false });
  const [activeAssets, setActiveAssets] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState<keyof typeof ASSET_ADDRESSES>("WFLOW");
  const [tokenBalance, setTokenBalance] = useState("");
  const [tokenAllowance, setTokenAllowance] = useState("");
  const [depositToken, setDepositToken] = useState<keyof typeof ASSET_ADDRESSES>("WFLOW");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawToken, setWithdrawToken] = useState<keyof typeof ASSET_ADDRESSES>("WFLOW");
  const [withdrawShares, setWithdrawShares] = useState("");
  const [withdrawMin, setWithdrawMin] = useState("");
  const [loading, setLoading] = useState(false);
  const [abiCheck, setAbiCheck] = useState({ vault: false, token: false });
  const [contractChecks, setContractChecks] = useState({
    isAssetSupported: false,
    minDeposit: "",
    isPaused: false,
    hasAllowance: false,
    hasSufficientBalance: false
  });

  // Get wallet info from Privy (single source of truth)
  const primaryWallet = wallets?.[0];
  const userAddress = primaryWallet?.address || "";

  // Initialize provider and validate ABIs
  useEffect(() => {
    try {
      // Use Flow EVM Testnet RPC as fallback provider
      const rpcProvider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
      setProvider(rpcProvider as unknown as ethers.BrowserProvider);
      
      // Validate ABIs
      setAbiCheck({
        vault: vaultAbi.length > 0,
        token: tokenAbi.length > 0
      });
      
      if (vaultAbi.length === 0) {
        console.error("ETF Vault ABI is empty or invalid");
      }
      if (tokenAbi.length === 0) {
        console.error("Token ABI is empty or invalid");
      }
    } catch (error) {
      console.error("Error initializing provider:", error);
      toast.error("Failed to initialize blockchain connection");
    }
  }, []);

  // Set up signer when wallet is connected through Privy
  useEffect(() => {
    async function setupSigner() {
      if (primaryWallet && authenticated && ready) {
        try {
          const ethereumProvider = await primaryWallet.getEthereumProvider();
          const web3Provider = new ethers.BrowserProvider(ethereumProvider);
          const walletSigner = await web3Provider.getSigner();
          
          setProvider(web3Provider);
          setSigner(walletSigner);
          
          console.log(`Wallet connected: ${userAddress}`);
          toast.success(`Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`);
        } catch (error) {
          console.error("Error setting up signer:", error);
          toast.error("Failed to set up wallet connection");
        }
      }
    }

    setupSigner();
  }, [primaryWallet, authenticated, ready, userAddress]);

  // Pre-transaction checks
  const performPreDepositChecks = async (tokenSymbol: keyof typeof ASSET_ADDRESSES, amount: string) => {
    if (!provider || !userAddress) {
      toast.error("Provider or wallet not available");
      return false;
    }

    try {
      const tokenAddress = ASSET_ADDRESSES[tokenSymbol];
      const amountWei = ethers.parseEther(amount);
      
      // Check if contract is paused
      const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, provider);
      const isPaused = await vaultContract.paused();
      
      if (isPaused) {
        toast.error("ETF Vault is currently paused");
        return false;
      }

      // Check if asset is supported
      const isSupported = await vaultContract.supportedTokens(tokenAddress);
      if (!isSupported) {
        toast.error(`${tokenSymbol} is not supported by this ETF`);
        return false;
      }

      // Check minimum deposit
      const minDeposit = await vaultContract.MIN_DEPOSIT();
      if (amountWei < minDeposit) {
        toast.error(`Minimum deposit is ${ethers.formatEther(minDeposit)} ${tokenSymbol}`);
        return false;
      }

      // Check user token balance
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      
      if (balance < amountWei) {
        toast.error(`Insufficient ${tokenSymbol} balance. Need ${amount}, have ${ethers.formatEther(balance)}`);
        return false;
      }

      // Check allowance
      const allowance = await tokenContract.allowance(userAddress, CONTRACT_ADDRESSES.etfVault);
      if (allowance < amountWei) {
        toast.warning(`Need to approve ${amount} ${tokenSymbol} for deposit`);
        return "needs_approval";
      }

      return true;
    } catch (error) {
      console.error("Pre-deposit check failed:", error);
      toast.error(`Pre-deposit check failed: ${decodeContractError(error)}`);
      return false;
    }
  };

  // Fetch ETF contract information with enhanced checks
  const fetchEtfInfo = async () => {
    if (!provider) {
      toast.error("Provider not available");
      return;
    }
    
    if (!abiCheck.vault) {
      toast.error("ETF Vault ABI is invalid - check JSON format");
      return;
    }
    
    try {
      setLoading(true);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, provider);
      
      const results = await Promise.allSettled([
        contract.name().catch((e: Error) => "Error fetching name"),
        contract.symbol().catch((e: Error) => "Error fetching symbol"), 
        contract.agentWallet().catch((e: Error) => CONTRACT_ADDRESSES.agentWallet),
        contract.getTotalValue().catch((e: Error) => ethers.parseEther("0")),
        contract.paused().catch((e: Error) => false)
      ]);
      
      const name = results[0].status === 'fulfilled' ? results[0].value : "Error";
      const symbol = results[1].status === 'fulfilled' ? results[1].value : "Error";
      const agent = results[2].status === 'fulfilled' ? results[2].value : CONTRACT_ADDRESSES.agentWallet;
      const totalValue = results[3].status === 'fulfilled' 
        ? ethers.formatEther(results[3].value) : "0";
      const paused = results[4].status === 'fulfilled' ? results[4].value : false;
      
      setEtfInfo({ name, symbol, agent, totalValue, paused });
      toast.success("ETF information loaded");
    } catch (error) {
      console.error("Error fetching ETF info:", error);
      toast.error("Failed to fetch ETF information");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced deposit function with proper checks and gas estimation
  const handleDeposit = async () => {
    if (!signer || !abiCheck.vault || !abiCheck.token) {
      toast.error("Wallet or ABI not available");
      return;
    }

    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      toast.error("Please enter a valid deposit amount");
      return;
    }
    
    setLoading(true);
    try {
      // Perform pre-deposit checks
      const preCheckResult = await performPreDepositChecks(depositToken, depositAmount);
      
      if (preCheckResult === false) {
        return; // Error already shown in pre-checks
      }

      const tokenAddress = ASSET_ADDRESSES[depositToken];
      const amt = ethers.parseEther(depositAmount);
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, signer);

      // Handle approval if needed
      if (preCheckResult === "needs_approval") {
        toast.info("Approving token spend...");
        
        try {
          // Estimate gas for approval
          const approvalGasEstimate = await tokenContract.approve.estimateGas(CONTRACT_ADDRESSES.etfVault, amt);
          const approvalTx = await tokenContract.approve(CONTRACT_ADDRESSES.etfVault, amt, {
            gasLimit: Math.floor(Number(approvalGasEstimate) * 1.2) // 20% buffer
          });
          await approvalTx.wait();
          toast.success(`Approved ${depositAmount} ${depositToken}`);
        } catch (approvalError) {
          console.error("Approval failed:", approvalError);
          toast.error(`Approval failed: ${decodeContractError(approvalError)}`);
          return;
        }
      }

      // Estimate gas for deposit
      toast.info("Estimating gas for deposit...");
      const depositGasEstimate = await vaultContract.deposit.estimateGas(tokenAddress, amt);
      
      // Execute deposit with gas buffer
      toast.info("Executing deposit...");
      const depositTx = await vaultContract.deposit(tokenAddress, amt, {
        gasLimit: Math.floor(Number(depositGasEstimate) * 1.2) // 20% buffer
      });
      
      const receipt = await depositTx.wait();
      toast.success(`Successfully deposited ${depositAmount} ${depositToken}! Tx: ${receipt.hash.slice(0, 10)}...`);
      
      // Refresh balances
      await fetchTokenBalance();
      await fetchEtfInfo();
      
    } catch (error) {
      console.error("Deposit failed:", error);
      const errorMessage = decodeContractError(error);
      toast.error(`Deposit failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced withdrawal function with proper checks
  const handleWithdraw = async () => {
    if (!signer || !abiCheck.vault) {
      toast.error("Wallet or ABI not available");
      return;
    }

    if (!withdrawShares || !withdrawMin || isNaN(parseFloat(withdrawShares)) || isNaN(parseFloat(withdrawMin))) {
      toast.error("Please enter valid withdrawal amounts");
      return;
    }
    
    setLoading(true);
    try {
      const shares = ethers.parseEther(withdrawShares);
      const minOut = ethers.parseEther(withdrawMin);
      const vaultContract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, signer);

      // Check user's share balance
      const userShares = await vaultContract.balanceOf(userAddress);
      if (shares > userShares) {
        toast.error(`Insufficient shares. Have ${ethers.formatEther(userShares)}, trying to withdraw ${withdrawShares}`);
        return;
      }

      // Estimate gas for withdrawal
      toast.info("Estimating gas for withdrawal...");
      const gasEstimate = await vaultContract.withdraw.estimateGas(shares, ASSET_ADDRESSES[withdrawToken], minOut);
      
      // Execute withdrawal with gas buffer
      toast.info("Executing withdrawal...");
      const tx = await vaultContract.withdraw(shares, ASSET_ADDRESSES[withdrawToken], minOut, {
        gasLimit: Math.floor(Number(gasEstimate) * 1.2) // 20% buffer
      });
      
      const receipt = await tx.wait();
      toast.success(`Successfully withdrew ${withdrawShares} shares! Tx: ${receipt.hash.slice(0, 10)}...`);
      
      // Refresh balances
      await fetchTokenBalance();
      await fetchEtfInfo();
      
    } catch (error) {
      console.error("Withdrawal failed:", error);
      const errorMessage = decodeContractError(error);
      toast.error(`Withdrawal failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced token balance fetch with allowance check
  const fetchTokenBalance = async () => {
    if (!provider || !userAddress || !abiCheck.token) {
      toast.error(!userAddress ? "Connect wallet first" : "Provider/ABI not available");
      return;
    }
    
    try {
      setLoading(true);
      const tokenAddress = ASSET_ADDRESSES[selectedToken];
      const contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
      
      const [balance, allowance] = await Promise.all([
        contract.balanceOf(userAddress),
        contract.allowance(userAddress, CONTRACT_ADDRESSES.etfVault)
      ]);
      
      setTokenBalance(ethers.formatEther(balance));
      setTokenAllowance(ethers.formatEther(allowance));
      toast.success(`${selectedToken} balance and allowance loaded`);
    } catch (error) {
      console.error("Error fetching token balance:", error);
      toast.error("Failed to fetch token balance");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced faucet function
  const faucetToken = async () => {
    if (!signer || !abiCheck.token) {
      toast.error(!signer ? "Connect wallet first" : "Token ABI invalid");
      return;
    }
    
    setLoading(true);
    try {
      const tokenAddress = ASSET_ADDRESSES[selectedToken];
      const contract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      
      if (!contract.faucet) {
        toast.error("Faucet function not available for this token");
        return;
      }
      
      // Estimate gas for faucet
      const gasEstimate = await contract.faucet.estimateGas();
      const tx = await contract.faucet({
        gasLimit: Math.floor(Number(gasEstimate) * 1.2)
      });
      
      const receipt = await tx.wait();
      toast.success(`${selectedToken} tokens claimed! Tx: ${receipt.hash.slice(0, 10)}...`);
      await fetchTokenBalance();
    } catch (error) {
      console.error("Error using faucet:", error);
      toast.error(`Faucet failed: ${decodeContractError(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active assets
  const fetchActiveAssets = async () => {
    if (!provider || !abiCheck.vault) {
      toast.error("Provider or ABI not available");
      return;
    }
    
    try {
      setLoading(true);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.etfVault, vaultAbi, provider);
      const list = await contract.getActiveAssets();
      setActiveAssets(list);
      toast.success("Active assets loaded");
    } catch (error) {
      console.error("Error fetching active assets:", error);
      toast.error("Failed to fetch active assets");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Enhanced ABI Test Dashboard</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex gap-2 items-center">
              <div>ETF Vault ABI:</div>
              <div className={`font-bold ${abiCheck.vault ? 'text-green-500' : 'text-red-500'}`}>
                {abiCheck.vault ? 'Valid' : 'Invalid'}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div>Token ABI:</div>
              <div className={`font-bold ${abiCheck.token ? 'text-green-500' : 'text-red-500'}`}>
                {abiCheck.token ? 'Valid' : 'Invalid'}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div>Privy Ready:</div>
              <div className={`font-bold ${ready ? 'text-green-500' : 'text-red-500'}`}>
                {ready ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div>Authenticated:</div>
              <div className={`font-bold ${authenticated ? 'text-green-500' : 'text-red-500'}`}>
                {authenticated ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <div className="text-xs text-gray-600 mb-2">Contract Address:</div>
            <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
              {CONTRACT_ADDRESSES.etfVault}
            </div>
          </div>
          
          {userAddress ? (
            <div className="border-t pt-3">
              <div className="text-xs text-gray-600 mb-2">Connected Wallet:</div>
              <div className="font-mono text-xs bg-green-50 p-2 rounded break-all">
                {userAddress}
              </div>
            </div>
          ) : (
            <div className="border-t pt-3">
              <Button onClick={login} disabled={!ready} className="w-full">
                {ready ? 'Connect Wallet via Privy' : 'Loading...'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>ETF Vault Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={fetchEtfInfo} disabled={loading} className="w-full">
            {loading ? 'Loading...' : 'Fetch ETF Info'}
          </Button>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Name:</strong> {etfInfo.name}</div>
            <div><strong>Symbol:</strong> {etfInfo.symbol}</div>
            <div className="col-span-2"><strong>Agent:</strong> <span className="font-mono text-xs">{etfInfo.agent}</span></div>
            <div><strong>Total Value:</strong> {etfInfo.totalValue} FLOW</div>
            <div>
              <strong>Status:</strong> 
              <span className={`ml-2 font-bold ${etfInfo.paused ? 'text-red-500' : 'text-green-500'}`}>
                {etfInfo.paused ? 'PAUSED' : 'ACTIVE'}
              </span>
            </div>
          </div>
          
          <div className="border-t pt-3">
            <Button onClick={fetchActiveAssets} disabled={loading} className="w-full mb-2">
              {loading ? 'Loading...' : 'Fetch Active Assets'}
            </Button>
            {activeAssets.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-2">Active Assets ({activeAssets.length}):</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {activeAssets.map(addr => (
                    <div key={addr} className="font-mono text-xs bg-gray-50 p-1 rounded break-all">
                      {addr}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Token Operations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="selectedToken" className="block text-sm font-medium mb-2">Select Token:</label>
            <select 
              id="selectedToken" 
              value={selectedToken} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedToken(e.target.value as keyof typeof ASSET_ADDRESSES)}
              className="w-full p-2 border rounded-md"
            >
              {Object.keys(ASSET_ADDRESSES).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={faucetToken} disabled={loading || !authenticated} variant="outline">
              💧 Get from Faucet
            </Button>
            <Button onClick={fetchTokenBalance} disabled={loading} variant="outline">
              🔄 Refresh Balance
            </Button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md space-y-2">
            <div className="text-sm">
              <strong>Balance:</strong> {tokenBalance} {selectedToken}
            </div>
            <div className="text-sm">
              <strong>Allowance:</strong> {tokenAllowance} {selectedToken}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>💰 Deposit to ETF</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="depositToken" className="block text-sm font-medium mb-2">Token:</label>
            <select 
              id="depositToken" 
              value={depositToken} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setDepositToken(e.target.value as keyof typeof ASSET_ADDRESSES)}
              className="w-full p-2 border rounded-md"
            >
              {Object.keys(ASSET_ADDRESSES).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          
          <div>
            <label htmlFor="depositAmount" className="block text-sm font-medium mb-2">Amount:</label>
            <input 
              id="depositAmount" 
              type="number"
              step="0.001"
              min="0"
              value={depositAmount} 
              onChange={e => setDepositAmount(e.target.value)}
              placeholder="Enter amount to deposit"
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <Button 
            onClick={handleDeposit} 
            disabled={loading || !authenticated || !depositAmount} 
            className="w-full"
          >
            {loading ? 'Processing...' : `Deposit ${depositAmount || '0'} ${depositToken}`}
          </Button>
          
          <div className="text-xs text-gray-600">
            ⚠️ Min deposit: 1.0 tokens | Contract must not be paused | Token must be supported
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>📤 Withdraw from ETF</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="withdrawShares" className="block text-sm font-medium mb-2">Shares to Withdraw:</label>
            <input 
              id="withdrawShares" 
              type="number"
              step="0.001"
              min="0"
              value={withdrawShares} 
              onChange={e => setWithdrawShares(e.target.value)}
              placeholder="Enter shares to withdraw"
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="withdrawToken" className="block text-sm font-medium mb-2">Receive Token:</label>
            <select 
              id="withdrawToken" 
              value={withdrawToken} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setWithdrawToken(e.target.value as keyof typeof ASSET_ADDRESSES)}
              className="w-full p-2 border rounded-md"
            >
              {Object.keys(ASSET_ADDRESSES).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          
          <div>
            <label htmlFor="withdrawMin" className="block text-sm font-medium mb-2">Min Amount Out:</label>
            <input 
              id="withdrawMin" 
              type="number"
              step="0.001"
              min="0"
              value={withdrawMin} 
              onChange={e => setWithdrawMin(e.target.value)}
              placeholder="Minimum tokens to receive"
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <Button 
            onClick={handleWithdraw} 
            disabled={loading || !authenticated || !withdrawShares || !withdrawMin} 
            className="w-full"
          >
            {loading ? 'Processing...' : `Withdraw ${withdrawShares || '0'} shares`}
          </Button>
          
          <div className="text-xs text-gray-600">
            ⚠️ Must have sufficient shares | Slippage protection via min amount
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
