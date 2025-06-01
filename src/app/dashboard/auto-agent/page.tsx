'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallets } from '@/components/PrivyWalletsWrapper';
import { toast } from 'sonner';
import { 
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings,
  Wallet,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Shield,
  DollarSign,
  Globe,
  Sparkles,
  Eye
} from 'lucide-react';
import Image from 'next/image';

// Types
interface AgentWallet {
  address: string;
  balance: {
    FLOW: string;
    USDC_BASE: string;
    ETF_TOKENS: string;
  };
  status: 'idle' | 'bridging' | 'minting' | 'storing' | 'withdrawing';
}

interface BridgeOperation {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fromChain: string;
  toChain: string;
  fromAmount: string;
  toAmount: string;
  fromToken: string;
  toToken: string;
  txHash?: string;
  timestamp: number;
  estimatedTime?: number;
}

interface ETFPortfolio {
  totalValue: string;
  userShares: string;
  allocations: Array<{
    token: string;
    symbol: string;
    weight: number;
    value: string;
    logo: string;
  }>;
}

// Main Component
export default function ETFManagerAgentPage() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = usePrivyWallets();
  
  // State
  const [agentWallet, setAgentWallet] = useState<AgentWallet>({
    address: '0x742d35Cc6634C0532925a3b8D93B29dd8b0fcF8D',
    balance: {
      FLOW: '0.00',
      USDC_BASE: '0.00',
      ETF_TOKENS: '0.00'
    },
    status: 'idle'
  });
  
  const [bridgeOperations, setBridgeOperations] = useState<BridgeOperation[]>([]);
  const [depositAmount, setDepositAmount] = useState('10');
  const [withdrawAmount, setWithdrawAmount] = useState('5');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoMode, setAutoMode] = useState(false);

  const primaryWallet = wallets?.[0];
  const userAddress = primaryWallet?.address || '';

  // Mock ETF Portfolio Data
  const etfPortfolio: ETFPortfolio = {
    totalValue: '15,247.83',
    userShares: '12.5',
    allocations: [
      { token: 'WETH', symbol: 'WETH', weight: 40, value: '6,099.13', logo: '/sandwave.png' },
      { token: 'WBTC', symbol: 'WBTC', weight: 25, value: '3,811.96', logo: '/giraffehorn.png' },
      { token: 'USDC', symbol: 'USDC', weight: 20, value: '3,049.57', logo: '/flower.png' },
      { token: 'LINK', symbol: 'LINK', weight: 10, value: '1,524.78', logo: '/jellyfish.png' },
      { token: 'UNI', symbol: 'UNI', weight: 5, value: '762.39', logo: '/snail.png' }
    ]
  };

  // Load agent wallet data
  useEffect(() => {
    if (authenticated && userAddress) {
      loadAgentWallet();
    }
  }, [authenticated, userAddress]);

  const loadAgentWallet = async () => {
    try {
      // In production, this would fetch real agent wallet data
      setAgentWallet(prev => ({
        ...prev,
        balance: {
          FLOW: '45.67',
          USDC_BASE: '1,234.56',
          ETF_TOKENS: '8.92'
        }
      }));
    } catch (error) {
      console.error('Failed to load agent wallet:', error);
    }
  };

  // Bridge FLOW to Base USDC
  const handleBridgeToBase = async () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setAgentWallet(prev => ({ ...prev, status: 'bridging' }));

    try {
      // Create bridge operation
      const bridgeOp: BridgeOperation = {
        id: `bridge_${Date.now()}`,
        status: 'processing',
        fromChain: 'Flow EVM',
        toChain: 'Base',
        fromAmount: depositAmount,
        toAmount: (parseFloat(depositAmount) * 0.85).toFixed(2), // Mock exchange rate
        fromToken: 'FLOW',
        toToken: 'USDC',
        timestamp: Date.now(),
        estimatedTime: 120 // 2 minutes
      };

      setBridgeOperations(prev => [bridgeOp, ...prev]);
      toast.info(`🌉 Bridging ${depositAmount} FLOW to Base USDC...`);

      // Call bridge API
      const response = await fetch('/api/auto-agent/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          walletId: agentWallet.address,
          flowAmount: depositAmount,
          privyConfig: {
            appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
            appSecret: process.env.PRIVY_APP_SECRET
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update bridge operation
        setBridgeOperations(prev => 
          prev.map(op => 
            op.id === bridgeOp.id 
              ? { ...op, status: 'completed', txHash: result.data.txHashes?.source?.[0] }
              : op
          )
        );

        // Update agent wallet balance
        setAgentWallet(prev => ({
          ...prev,
          balance: {
            ...prev.balance,
            USDC_BASE: (parseFloat(prev.balance.USDC_BASE) + parseFloat(bridgeOp.toAmount)).toFixed(2)
          }
        }));

        toast.success(`✅ Successfully bridged to ${bridgeOp.toAmount} USDC on Base!`);
        
        // Auto-proceed to minting if enabled
        if (autoMode) {
          setTimeout(() => handleMintETFTokens(), 2000);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Bridge failed:', error);
      toast.error('Bridge operation failed');
      setBridgeOperations(prev => 
        prev.map(op => 
          op.id.includes('bridge') && op.status === 'processing'
            ? { ...op, status: 'failed' }
            : op
        )
      );
    } finally {
      setIsProcessing(false);
      setAgentWallet(prev => ({ ...prev, status: 'idle' }));
    }
  };

  // Mint ETF tokens with Base USDC
  const handleMintETFTokens = async () => {
    const usdcBalance = parseFloat(agentWallet.balance.USDC_BASE);
    if (usdcBalance < 100) {
      toast.error('Insufficient USDC balance for minting (min: 100 USDC)');
      return;
    }

    setIsProcessing(true);
    setAgentWallet(prev => ({ ...prev, status: 'minting' }));

    try {
      toast.info(`🪙 Minting ETF tokens with ${usdcBalance} USDC...`);

      // Simulate ETF minting process
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mintedTokens = (usdcBalance / 150).toFixed(2); // Mock: 1 ETF token = 150 USDC
      
      setAgentWallet(prev => ({
        ...prev,
        balance: {
          ...prev.balance,
          USDC_BASE: '0.00', // All USDC used for minting
          ETF_TOKENS: (parseFloat(prev.balance.ETF_TOKENS) + parseFloat(mintedTokens)).toFixed(2)
        }
      }));

      toast.success(`✅ Minted ${mintedTokens} ETF tokens!`);
    } catch (error) {
      console.error('Minting failed:', error);
      toast.error('ETF token minting failed');
    } finally {
      setIsProcessing(false);
      setAgentWallet(prev => ({ ...prev, status: 'idle' }));
    }
  };

  // Withdraw ETF back to FLOW
  const handleWithdrawToFlow = async () => {
    if (!withdrawAmount || isNaN(parseFloat(withdrawAmount))) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    const etfBalance = parseFloat(agentWallet.balance.ETF_TOKENS);
    if (etfBalance < parseFloat(withdrawAmount)) {
      toast.error('Insufficient ETF token balance');
      return;
    }

    setIsProcessing(true);
    setAgentWallet(prev => ({ ...prev, status: 'withdrawing' }));

    try {
      toast.info(`📤 Withdrawing ${withdrawAmount} ETF tokens back to FLOW...`);

      // Step 1: Redeem ETF tokens for USDC
      await new Promise(resolve => setTimeout(resolve, 2000));
      const usdcAmount = (parseFloat(withdrawAmount) * 150).toFixed(2);
      
      // Step 2: Bridge USDC back to FLOW
      await new Promise(resolve => setTimeout(resolve, 3000));
      const flowAmount = (parseFloat(usdcAmount) / 0.85).toFixed(2);

      // Update balances
      setAgentWallet(prev => ({
        ...prev,
        balance: {
          FLOW: (parseFloat(prev.balance.FLOW) + parseFloat(flowAmount)).toFixed(2),
          USDC_BASE: prev.balance.USDC_BASE,
          ETF_TOKENS: (parseFloat(prev.balance.ETF_TOKENS) - parseFloat(withdrawAmount)).toFixed(2)
        }
      }));

      toast.success(`✅ Withdrawn ${flowAmount} FLOW to your wallet!`);
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error('Withdrawal operation failed');
    } finally {
      setIsProcessing(false);
      setAgentWallet(prev => ({ ...prev, status: 'idle' }));
    }
  };

  // Execute full cycle
  const handleFullCycle = async () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    toast.info('🔄 Starting full ETF investment cycle...');
    setAutoMode(true);
    
    // Start with bridging
    await handleBridgeToBase();
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-600">Initializing ETF Manager Agent...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-white shadow-lg border-slate-200">
        <CardContent className="text-center py-16">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ETF Manager Agent
          </h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto text-lg">
            Connect your wallet to access automated ETF management with cross-chain bridging and portfolio optimization
          </p>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-lg px-8 py-3 h-auto">
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-xl border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/baevii-logo.png" alt="Baevii" width={48} height={48} className="rounded-lg" />
              <div>
                <h1 className="text-3xl font-bold">ETF Manager Agent</h1>
                <p className="text-blue-200 mt-1">Automated cross-chain ETF investment & management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-4 py-2">
                Agent: {agentWallet.address.slice(0, 6)}...{agentWallet.address.slice(-4)}
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-4 py-2">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm text-blue-200">Agent FLOW Balance</div>
              <div className="text-2xl font-bold">{agentWallet.balance.FLOW}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm text-blue-200">Base USDC Balance</div>
              <div className="text-2xl font-bold">{agentWallet.balance.USDC_BASE}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm text-blue-200">ETF Tokens</div>
              <div className="text-2xl font-bold">{agentWallet.balance.ETF_TOKENS}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm text-blue-200">Portfolio Value</div>
              <div className="text-2xl font-bold">${etfPortfolio.totalValue}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Investment Flow */}
        <div className="space-y-6">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <ArrowDownToLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold">Invest in ETF</span>
                  <p className="text-sm text-green-600 font-normal">FLOW → Base USDC → ETF Tokens</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="deposit-amount" className="text-base font-medium">
                  Amount to Invest (FLOW)
                </Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="10.0"
                  className="mt-2 h-12 text-lg"
                />
                <p className="text-sm text-slate-600 mt-1">
                  ≈ ${(parseFloat(depositAmount || '0') * 0.85).toFixed(2)} USDC on Base
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-700 mb-3">Investment Flow:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Bridge FLOW to Base USDC via Stargate/Across</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Mint ETF tokens with diversified portfolio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Store tokens securely in agent wallet</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleBridgeToBase}
                  disabled={isProcessing || agentWallet.status !== 'idle'}
                  className="h-12 bg-blue-600 hover:bg-blue-700"
                >
                  {agentWallet.status === 'bridging' ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                  )}
                  1. Bridge to Base
                </Button>
                
                <Button
                  onClick={handleMintETFTokens}
                  disabled={isProcessing || parseFloat(agentWallet.balance.USDC_BASE) < 100}
                  className="h-12 bg-purple-600 hover:bg-purple-700"
                >
                  {agentWallet.status === 'minting' ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  2. Mint ETF
                </Button>
              </div>

              <Button
                onClick={handleFullCycle}
                disabled={isProcessing || agentWallet.status !== 'idle'}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isProcessing ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5 mr-2" />
                )}
                Execute Full Investment Cycle
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Flow */}
        <div className="space-y-6">
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <ArrowUpFromLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold">Withdraw from ETF</span>
                  <p className="text-sm text-orange-600 font-normal">ETF Tokens → Base USDC → FLOW</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="withdraw-amount" className="text-base font-medium">
                  ETF Tokens to Withdraw
                </Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max={agentWallet.balance.ETF_TOKENS}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="5.0"
                  className="mt-2 h-12 text-lg"
                />
                <p className="text-sm text-slate-600 mt-1">
                  Available: {agentWallet.balance.ETF_TOKENS} tokens
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-700 mb-3">Withdrawal Flow:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Redeem ETF tokens for underlying assets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Convert to USDC and bridge back to Flow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Receive FLOW in your wallet</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleWithdrawToFlow}
                disabled={isProcessing || parseFloat(agentWallet.balance.ETF_TOKENS) < parseFloat(withdrawAmount || '0')}
                className="w-full h-14 text-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                {agentWallet.status === 'withdrawing' ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Target className="w-5 h-5 mr-2" />
                )}
                Withdraw to FLOW
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ETF Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">ETF Portfolio Composition</span>
                <p className="text-sm text-slate-600 font-normal">Diversified crypto portfolio</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {etfPortfolio.allocations.map((allocation) => (
              <Card key={allocation.token} className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Image 
                      src={allocation.logo} 
                      alt={allocation.symbol} 
                      width={32} 
                      height={32} 
                      className="rounded-full"
                    />
                  </div>
                  <h3 className="font-bold text-lg">{allocation.symbol}</h3>
                  <p className="text-2xl font-bold text-blue-600">{allocation.weight}%</p>
                  <p className="text-sm text-slate-600">${allocation.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Operations */}
      {bridgeOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              Recent Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bridgeOperations.slice(0, 5).map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      operation.status === 'completed' ? 'bg-green-100 text-green-600' :
                      operation.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                      operation.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {operation.status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
                       operation.status === 'processing' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                       operation.status === 'failed' ? <AlertCircle className="w-4 h-4" /> :
                       <ArrowLeftRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {operation.fromAmount} {operation.fromToken} → {operation.toAmount} {operation.toToken}
                      </p>
                      <p className="text-sm text-slate-600">
                        {operation.fromChain} → {operation.toChain}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      operation.status === 'completed' ? 'default' :
                      operation.status === 'processing' ? 'secondary' :
                      operation.status === 'failed' ? 'destructive' :
                      'outline'
                    }>
                      {operation.status}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(operation.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
