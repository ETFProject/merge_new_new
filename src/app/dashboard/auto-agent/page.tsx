'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallets } from '@/components/PrivyWalletsWrapper';
import { 
  NotificationProvider, 
  TransactionPopupProvider, 
  useNotification, 
  useTransactionPopup, 
  requestNotificationPermission 
} from '@/lib/blockscout/sdk-enhanced';
import { AgentPlan, AgentAction } from '@/lib/auto-agent/gemini';
import { toast } from 'sonner';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Zap, 
  Wallet, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp,
  Activity,
  Shield,
  RefreshCw,
  ChevronRight,
  Info,
  Sparkles,
  Target,
  GitBranch,
  BarChart3
} from 'lucide-react';

// Enhanced types for better type safety
interface PrivyConfig {
  appId: string;
  appSecret: string;
  authPrivateKey?: string;
}

interface AgentConfig {
  privyConfig: PrivyConfig;
  autoExecute: boolean;
  maxGasPrice: string;
  slippageTolerance: number;
  retryAttempts: number;
}

interface AgentContextType {
  userAddress: string;
  chainId: string;
  userId?: string;
  walletId: string;
  currentBalance: Record<string, string>;
  etfInfo: {
    totalValue: string;
    userShares: string;
    status: string;
  };
}

interface AgentStats {
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  totalValueProcessed: string;
  costsSaved: string;
}

// Enhanced Agent Configuration Component
function EnhancedAgentConfig({ 
  onConfigChange, 
  currentConfig 
}: { 
  onConfigChange: (config: AgentConfig) => void;
  currentConfig?: AgentConfig;
}) {
  const [privyAppId, setPrivyAppId] = useState(currentConfig?.privyConfig?.appId || '');
  const [privyAppSecret, setPrivyAppSecret] = useState(currentConfig?.privyConfig?.appSecret || '');
  const [privyAuthKey, setPrivyAuthKey] = useState(currentConfig?.privyConfig?.authPrivateKey || '');
  const [autoExecute, setAutoExecute] = useState(currentConfig?.autoExecute || false);
  const [maxGasPrice, setMaxGasPrice] = useState(currentConfig?.maxGasPrice || '50');
  const [slippageTolerance, setSlippageTolerance] = useState(currentConfig?.slippageTolerance || 0.5);
  const [retryAttempts, setRetryAttempts] = useState(currentConfig?.retryAttempts || 3);

  const handleSaveConfig = () => {
    const config: AgentConfig = {
      privyConfig: {
        appId: privyAppId,
        appSecret: privyAppSecret,
        authPrivateKey: privyAuthKey
      },
      autoExecute,
      maxGasPrice,
      slippageTolerance,
      retryAttempts
    };
    onConfigChange(config);
    toast.success('🤖 Agent configuration updated successfully!');
  };

  const isConfigValid = privyAppId && privyAppSecret;

  return (
    <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white via-slate-50 to-blue-50">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold">Agent Configuration</span>
            <p className="text-sm text-slate-600 font-normal">Configure your autonomous blockchain agent</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium text-sm">Security Notice</p>
              <p className="text-amber-700 text-sm mt-1">
                Server wallet credentials enable automated transactions. In production, 
                these should be stored as secure environment variables.
              </p>
            </div>
          </div>
        </div>
        
        {/* Privy Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Privy Server Wallet
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="privy-app-id" className="text-sm font-medium text-slate-700">
                Privy App ID
              </Label>
              <Input
                id="privy-app-id"
                value={privyAppId}
                onChange={(e) => setPrivyAppId(e.target.value)}
                placeholder="Enter your Privy App ID"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="privy-app-secret" className="text-sm font-medium text-slate-700">
                Privy App Secret
              </Label>
              <Input
                id="privy-app-secret"
                type="password"
                value={privyAppSecret}
                onChange={(e) => setPrivyAppSecret(e.target.value)}
                placeholder="Enter your Privy App Secret"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="privy-auth-key" className="text-sm font-medium text-slate-700">
                Privy Auth Private Key (Optional)
              </Label>
              <Input
                id="privy-auth-key"
                type="password"
                value={privyAuthKey}
                onChange={(e) => setPrivyAuthKey(e.target.value)}
                placeholder="Enter your Privy Authorization Private Key"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Execution Settings
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max-gas" className="text-sm font-medium text-slate-700">
                Max Gas Price (Gwei)
              </Label>
              <Input
                id="max-gas"
                type="number"
                value={maxGasPrice}
                onChange={(e) => setMaxGasPrice(e.target.value)}
                placeholder="50"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="slippage" className="text-sm font-medium text-slate-700">
                Slippage Tolerance (%)
              </Label>
              <Input
                id="slippage"
                type="number"
                step="0.1"
                value={slippageTolerance}
                onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
                placeholder="0.5"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="retry" className="text-sm font-medium text-slate-700">
                Retry Attempts
              </Label>
              <Input
                id="retry"
                type="number"
                value={retryAttempts}
                onChange={(e) => setRetryAttempts(parseInt(e.target.value))}
                placeholder="3"
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="auto-execute"
                checked={autoExecute}
                onChange={(e) => setAutoExecute(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <Label htmlFor="auto-execute" className="text-sm font-medium text-slate-700">
                Auto-execute plans
              </Label>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSaveConfig}
          disabled={!isConfigValid}
          className={`w-full h-11 text-base transition-all shadow-md ${
            isConfigValid 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' 
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          {isConfigValid ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Configuration
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 mr-2" />
              Complete Required Fields
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Enhanced Plan Creator with AI Suggestions
function EnhancedPlanCreator({ 
  context, 
  onPlanCreated,
  config 
}: { 
  context: AgentContextType; 
  onPlanCreated: (plan: AgentPlan) => void;
  config?: AgentConfig;
}) {
  const [goal, setGoal] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Dynamic suggestions based on user context
  const generateSuggestions = useCallback(() => {
    const balance = context.currentBalance;
    const suggestions = [];

    if (parseFloat(balance.FLOW || '0') > 5) {
      suggestions.push('Bridge 10 FLOW to Base USDC for better yields');
    }
    if (parseFloat(balance.WFLOW || '0') > 20) {
      suggestions.push('Deposit 50 WFLOW into ETF for diversification');
    }
    if (parseFloat(context.etfInfo.userShares || '0') > 5) {
      suggestions.push('Rebalance ETF portfolio for optimal allocation');
    }
    
    suggestions.push('Analyze portfolio performance and risk metrics');
    suggestions.push('Execute cross-chain arbitrage opportunities');
    suggestions.push('Auto-compound rewards from DeFi protocols');

    return suggestions;
  }, [context]);

  useEffect(() => {
    setSuggestions(generateSuggestions());
  }, [generateSuggestions]);

  const handleCreatePlan = async () => {
    if (!goal.trim()) {
      toast.error('Please enter a goal for the agent');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/auto-agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          context,
          config: config || {}
        })
      });

      const result = await response.json();
      
      if (result.success) {
        onPlanCreated(result.data);
        toast.success('🎯 Execution plan created successfully!');
        setGoal('');
      } else {
        toast.error(result.error || 'Failed to create plan');
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create plan');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white via-slate-50 to-green-50">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold">Create Execution Plan</span>
            <p className="text-sm text-slate-600 font-normal">Design your autonomous trading strategy</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Goal Input */}
        <div>
          <Label htmlFor="goal" className="text-base font-medium text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            What would you like the agent to accomplish?
          </Label>
          <Input
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe your trading goal in natural language..."
            className="mt-2 p-4 h-12 shadow-sm border-slate-300 text-base"
          />
        </div>

        {/* AI Suggestions */}
        <div className="space-y-3">
          <Label className="text-slate-700 font-medium flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            AI-Powered Suggestions
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-green-100 bg-white text-green-700 border-green-300 px-4 py-3 whitespace-normal text-left h-auto shadow-sm transition-all hover:shadow-md"
                onClick={() => setGoal(suggestion)}
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              </Badge>
            ))}
          </div>
        </div>

        {/* Context Display */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <Label className="text-slate-700 font-medium flex items-center gap-2 mb-3">
            <Info className="w-4 h-4" />
            Current Context
          </Label>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-600">Available Balance:</span>
              <div className="mt-1">
                {Object.entries(context.currentBalance).map(([token, amount]) => (
                  <div key={token} className="flex justify-between">
                    <span className="font-medium">{token}:</span>
                    <span>{amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-slate-600">ETF Portfolio:</span>
              <div className="mt-1">
                <div className="flex justify-between">
                  <span className="font-medium">Total Value:</span>
                  <span>{context.etfInfo.totalValue} FLOW</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Your Shares:</span>
                  <span>{context.etfInfo.userShares}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={context.etfInfo.status === 'active' ? 'default' : 'secondary'}>
                    {context.etfInfo.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCreatePlan}
          disabled={isCreating || !goal.trim()}
          className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
        >
          {isCreating ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Creating Strategic Plan...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Create Execution Plan
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Enhanced Action Display with better visualization
function EnhancedActionDisplay({ action }: { action: AgentAction }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          bgColor: 'bg-green-50'
        };
      case 'executing': 
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: RefreshCw,
          bgColor: 'bg-blue-50'
        };
      case 'failed': 
        return { 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          bgColor: 'bg-red-50'
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          bgColor: 'bg-gray-50'
        };
    }
  };

  const { color, icon: StatusIcon, bgColor } = getStatusConfig(action.status);

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'bridge': return '🌉';
      case 'deposit': return '📥';
      case 'withdraw': return '📤';
      case 'rebalance': return '⚖️';
      case 'analysis': return '📊';
      default: return '⚡';
    }
  };

  return (
    <Card className={`border shadow-sm hover:shadow-md transition-all ${bgColor}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{getActionTypeIcon(action.type)}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">{action.description}</h4>
                <p className="text-sm text-slate-600">Type: {action.type}</p>
              </div>
            </div>
            
            {action.estimatedDuration && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                <Clock className="w-3 h-3" />
                <span>Est. {Math.round(action.estimatedDuration / 1000)}s</span>
              </div>
            )}
          </div>
          
          <Badge className={`${color} shadow-sm flex items-center gap-1`}>
            <StatusIcon className={`w-3 h-3 ${action.status === 'executing' ? 'animate-spin' : ''}`} />
            {action.status}
          </Badge>
        </div>

        {Object.keys(action.parameters).length > 0 && (
          <div className="mt-3 bg-white rounded-lg p-3 border border-slate-200">
            <p className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Parameters:
            </p>
            <pre className="text-xs text-slate-600 overflow-auto max-h-20">
              {JSON.stringify(action.parameters, null, 2)}
            </pre>
          </div>
        )}

        {action.result && (
          <div className="mt-3 bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs font-medium text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Result:
            </p>
            <pre className="text-xs text-green-600 overflow-auto max-h-20">
              {JSON.stringify(action.result, null, 2)}
            </pre>
          </div>
        )}

        {action.error && (
          <div className="mt-3 bg-red-50 rounded-lg p-3 border border-red-200">
            <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Error:
            </p>
            <p className="text-xs text-red-600">{action.error}</p>
          </div>
        )}

        {action.txHash && (
          <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Transaction:
            </p>
            <p className="text-xs text-blue-600 font-mono break-all">{action.txHash}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced Plan Executor with better progress tracking
function EnhancedPlanExecutor({ 
  plan, 
  config, 
  context,
  onPlanUpdated 
}: { 
  plan: AgentPlan; 
  config?: AgentConfig; 
  context: AgentContextType;
  onPlanUpdated: (plan: AgentPlan) => void;
}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const { openTxToast } = useNotification();

  const stats = useMemo(() => {
    const completedActions = plan.actions.filter(a => a.status === 'completed').length;
    const failedActions = plan.actions.filter(a => a.status === 'failed').length;
    const totalActions = plan.actions.length;
    const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
    
    return {
      completedActions,
      failedActions,
      totalActions,
      progress,
      successRate: totalActions > 0 ? (completedActions / (completedActions + failedActions)) * 100 : 0
    };
  }, [plan.actions]);

  const handleExecutePlan = async () => {
    if (!config?.privyConfig?.appId || !context?.userId || !context?.walletId) {
      toast.error('Missing required configuration or wallet information');
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(0);
    
    try {
      const response = await fetch('/api/auto-agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: context.userId,
          walletId: context.walletId,
          privyConfig: config.privyConfig
        })
      });

      const result = await response.json();
      
      if (result.success) {
        onPlanUpdated(result.data);
        toast.success('🚀 Plan execution completed successfully!');
        
        // Show transaction notifications
        result.data.actions.forEach((action: AgentAction) => {
          if (action.txHash && action.status === 'completed') {
            openTxToast(context.chainId || '545', action.txHash);
          }
        });
      } else {
        toast.error(result.error || 'Failed to execute plan');
      }
    } catch (error) {
      console.error('Error executing plan:', error);
      toast.error('Failed to execute plan');
    } finally {
      setIsExecuting(false);
      setExecutionProgress(100);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': 
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
      case 'executing': 
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: RefreshCw };
      case 'failed': 
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle };
      default: 
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock };
    }
  };

  const { color, icon: StatusIcon } = getStatusConfig(plan.status);

  return (
    <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-white via-slate-50 to-purple-50">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">Execute Plan</span>
              <p className="text-sm text-slate-600 font-normal">Monitor autonomous execution</p>
            </div>
          </div>
          <Badge className={`${color} flex items-center gap-1`}>
            <StatusIcon className={`w-3 h-3 ${plan.status === 'executing' ? 'animate-spin' : ''}`} />
            {plan.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-700">Execution Progress</span>
            <span className="text-sm text-slate-600">
              {stats.completedActions}/{stats.totalActions} actions
            </span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-purple-500 to-violet-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completedActions}</p>
              <p className="text-xs text-slate-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failedActions}</p>
              <p className="text-xs text-slate-600">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-600">{stats.totalActions - stats.completedActions - stats.failedActions}</p>
              <p className="text-xs text-slate-600">Pending</p>
            </div>
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-3">
          <h4 className="font-medium text-slate-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Execution Timeline
          </h4>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {plan.actions.map((action, index) => (
              <div key={action.id} className="relative">
                {index > 0 && (
                  <div className="absolute left-6 -top-3 w-0.5 h-3 bg-slate-300" />
                )}
                <EnhancedActionDisplay action={action} />
              </div>
            ))}
          </div>
        </div>

        {/* Execution Button */}
        {plan.status === 'planning' && (
          <Button
            onClick={handleExecutePlan}
            disabled={isExecuting || !config?.privyConfig?.appId}
            className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 transition-all shadow-md"
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Executing Plan...
              </span>
            ) : !config?.privyConfig?.appId ? (
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Configure Agent First
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Execute Plan
              </span>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced Stats Dashboard
function AgentStatsDashboard({ stats }: { stats: AgentStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-800">{stats.totalExecutions}</p>
          <p className="text-xs text-blue-600">Total Executions</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-800">{stats.successRate.toFixed(1)}%</p>
          <p className="text-xs text-green-600">Success Rate</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4 text-center">
          <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-800">{stats.avgExecutionTime}s</p>
          <p className="text-xs text-purple-600">Avg Time</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
        <CardContent className="p-4 text-center">
          <Wallet className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-800">${stats.totalValueProcessed}</p>
          <p className="text-xs text-amber-600">Value Processed</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
        <CardContent className="p-4 text-center">
          <Sparkles className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-800">${stats.costsSaved}</p>
          <p className="text-xs text-emerald-600">Costs Saved</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Enhanced Auto Agent Component
function EnhancedAutoAgentContent() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = usePrivyWallets();
  const { openPopup } = useTransactionPopup();
  
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [currentPlan, setCurrentPlan] = useState<AgentPlan | null>(null);
  const [executionHistory, setExecutionHistory] = useState<AgentPlan[]>([]);
  const [activeTab, setActiveTab] = useState('agent');

  const primaryWallet = wallets?.[0];
  const userAddress = primaryWallet?.address || '';

  // Mock agent stats
  const agentStats: AgentStats = {
    totalExecutions: 47,
    successRate: 94.7,
    avgExecutionTime: 23,
    totalValueProcessed: '125,430',
    costsSaved: '1,847'
  };

  // Agent context
  const context: AgentContextType = {
    userAddress,
    chainId: '545', // Flow EVM Testnet
    userId: user?.id,
    walletId: primaryWallet?.address || '',
    currentBalance: {
      FLOW: '10.5',
      WFLOW: '25.0',
      USDC: '500.0'
    },
    etfInfo: {
      totalValue: '1250.0',
      userShares: '12.5',
      status: 'active'
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handlePlanCreated = (plan: AgentPlan) => {
    setCurrentPlan(plan);
    if (config?.autoExecute) {
      toast.success('🤖 Auto-executing plan...');
    }
  };

  const handlePlanUpdated = (plan: AgentPlan) => {
    setCurrentPlan(plan);
    if (plan.status === 'completed' || plan.status === 'failed') {
      setExecutionHistory(prev => [plan, ...prev.slice(0, 4)]);
    }
  };

  const handleViewTransactionHistory = () => {
    openPopup({
      chainId: context.chainId || '545',
      address: userAddress
    });
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-600">Initializing autonomous agent...</p>
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
            Autonomous Blockchain Agent
          </h2>
          <p className="text-slate-600 mb-8 max-w-lg mx-auto text-lg">
            Connect your wallet to unleash the power of AI-driven blockchain automation for ETF management and DeFi operations
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
      {/* Enhanced Header */}
      <Card className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Autonomous Blockchain Agent</h1>
                <p className="text-blue-200 mt-1">AI-powered execution of complex DeFi strategies</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewTransactionHistory}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Transaction History
              </Button>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-4 py-2">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-100 text-lg">
            Create sophisticated execution plans with AI and execute them autonomously using Privy server wallets.
            Supporting bridging, DeFi operations, ETF management, and advanced trading strategies.
          </p>
        </CardContent>
      </Card>

      {/* Agent Stats Dashboard */}
      <AgentStatsDashboard stats={agentStats} />

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          <TabsTrigger 
            value="agent" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white shadow-sm text-base h-10"
          >
            <Target className="w-4 h-4 mr-2" />
            Agent Control
          </TabsTrigger>
          <TabsTrigger 
            value="config" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white shadow-sm text-base h-10"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <EnhancedPlanCreator
              context={context}
              onPlanCreated={handlePlanCreated}
              config={config || undefined}
            />
            
            {currentPlan && (
              <EnhancedPlanExecutor
                plan={currentPlan}
                config={config || undefined}
                context={context}
                onPlanUpdated={handlePlanUpdated}
              />
            )}
          </div>
          
          {/* Enhanced Execution History */}
          {executionHistory.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-slate-600" />
                </div>
                Execution History
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {executionHistory.map((plan) => (
                  <Card key={plan.id} className="bg-white hover:shadow-lg transition-all border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex justify-between items-start text-lg">
                        <span className="flex-1 pr-4">{plan.goal}</span>
                        <Badge className={
                          plan.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          plan.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }>
                          {plan.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-slate-600">
                        Executed: {new Date(plan.updated).toLocaleString()}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{plan.actions.filter(a => a.status === 'completed').length} / {plan.actions.length}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                            style={{ width: `${(plan.actions.filter(a => a.status === 'completed').length / plan.actions.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="config">
          <EnhancedAgentConfig 
            onConfigChange={setConfig} 
            currentConfig={config || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main Enhanced Page Component with Providers
export default function EnhancedAutoAgentPage() {
  return (
    <NotificationProvider>
      <TransactionPopupProvider>
        <EnhancedAutoAgentContent />
      </TransactionPopupProvider>
    </NotificationProvider>
  );
}
