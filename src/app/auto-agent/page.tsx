'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePrivy } from '@privy-io/react-auth';
import { usePrivyWallets } from '@/components/PrivyWalletsWrapper';
import { NotificationProvider, TransactionPopupProvider, useNotification, useTransactionPopup, requestNotificationPermission } from '@/lib/blockscout/sdk';
import { AgentPlan, AgentAction, createGeminiAgent } from '@/lib/auto-agent/gemini';
import { toast } from 'sonner';

// Agent Configuration Component
function AgentConfig({ onConfigChange }: { onConfigChange: (config: any) => void }) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [privyAppId, setPrivyAppId] = useState('');
  const [privyAppSecret, setPrivyAppSecret] = useState('');
  const [privyAuthKey, setPrivyAuthKey] = useState('');

  const handleSaveConfig = () => {
    const config = {
      geminiApiKey,
      privyConfig: {
        appId: privyAppId,
        appSecret: privyAppSecret,
        authPrivateKey: privyAuthKey
      }
    };
    onConfigChange(config);
    toast.success('Configuration saved!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔧 Agent Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="gemini-key">Gemini API Key</Label>
          <Input
            id="gemini-key"
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
          />
        </div>
        
        <div>
          <Label htmlFor="privy-app-id">Privy App ID</Label>
          <Input
            id="privy-app-id"
            value={privyAppId}
            onChange={(e) => setPrivyAppId(e.target.value)}
            placeholder="Enter your Privy App ID"
          />
        </div>
        
        <div>
          <Label htmlFor="privy-app-secret">Privy App Secret</Label>
          <Input
            id="privy-app-secret"
            type="password"
            value={privyAppSecret}
            onChange={(e) => setPrivyAppSecret(e.target.value)}
            placeholder="Enter your Privy App Secret"
          />
        </div>
        
        <div>
          <Label htmlFor="privy-auth-key">Privy Auth Private Key (Optional)</Label>
          <Input
            id="privy-auth-key"
            type="password"
            value={privyAuthKey}
            onChange={(e) => setPrivyAuthKey(e.target.value)}
            placeholder="Enter your Privy Authorization Private Key"
          />
        </div>

        <Button 
          onClick={handleSaveConfig}
          disabled={!geminiApiKey || !privyAppId || !privyAppSecret}
          className="w-full"
        >
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

// Plan Creator Component
function PlanCreator({ 
  config, 
  context, 
  onPlanCreated 
}: { 
  config: any; 
  context: any; 
  onPlanCreated: (plan: AgentPlan) => void; 
}) {
  const [goal, setGoal] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePlan = async () => {
    if (!goal.trim()) {
      toast.error('Please enter a goal');
      return;
    }

    if (!config?.geminiApiKey) {
      toast.error('Please configure your Gemini API key first');
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
          apiKey: config.geminiApiKey
        })
      });

      const result = await response.json();
      
      if (result.success) {
        onPlanCreated(result.data);
        toast.success('Plan created successfully!');
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

  const exampleGoals = [
    'Bridge 5 FLOW to Base USDC',
    'Deposit 50 WFLOW into ETF and rebalance',
    'Analyze my portfolio and suggest optimizations',
    'Withdraw 10 shares from ETF to USDC',
    'Execute a complete ETF investment strategy'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Create Execution Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="goal">What would you like the agent to do?</Label>
          <Input
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe your goal..."
            className="mt-1"
          />
        </div>

        <div className="space-y-2">
          <Label>Example Goals:</Label>
          <div className="flex flex-wrap gap-2">
            {exampleGoals.map((example, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => setGoal(example)}
              >
                {example}
              </Badge>
            ))}
          </div>
        </div>

        <Button
          onClick={handleCreatePlan}
          disabled={isCreating || !goal.trim() || !config?.geminiApiKey}
          className="w-full"
        >
          {isCreating ? 'Creating Plan...' : 'Create Plan'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Action Display Component
function ActionDisplay({ action }: { action: AgentAction }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'executing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'executing': return '🔄';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getStatusIcon(action.status)}</span>
            <h4 className="font-medium">{action.description}</h4>
          </div>
          <p className="text-sm text-gray-600 mt-1">Type: {action.type}</p>
        </div>
        <Badge className={getStatusColor(action.status)}>
          {action.status}
        </Badge>
      </div>

      {Object.keys(action.parameters).length > 0 && (
        <div className="bg-gray-50 rounded p-2">
          <p className="text-xs font-medium text-gray-700 mb-1">Parameters:</p>
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(action.parameters, null, 2)}
          </pre>
        </div>
      )}

      {action.result && (
        <div className="bg-green-50 rounded p-2">
          <p className="text-xs font-medium text-green-700 mb-1">Result:</p>
          <pre className="text-xs text-green-600 overflow-auto">
            {JSON.stringify(action.result, null, 2)}
          </pre>
        </div>
      )}

      {action.error && (
        <div className="bg-red-50 rounded p-2">
          <p className="text-xs font-medium text-red-700 mb-1">Error:</p>
          <p className="text-xs text-red-600">{action.error}</p>
        </div>
      )}

      {action.txHash && (
        <div className="bg-blue-50 rounded p-2">
          <p className="text-xs font-medium text-blue-700 mb-1">Transaction:</p>
          <p className="text-xs text-blue-600 font-mono">{action.txHash}</p>
        </div>
      )}
    </div>
  );
}

// Plan Executor Component
function PlanExecutor({ 
  plan, 
  config, 
  context,
  onPlanUpdated 
}: { 
  plan: AgentPlan; 
  config: any; 
  context: any;
  onPlanUpdated: (plan: AgentPlan) => void;
}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const { openTxToast } = useNotification();

  const handleExecutePlan = async () => {
    if (!config?.privyConfig?.appId || !context?.userId || !context?.walletId) {
      toast.error('Missing required configuration or wallet information');
      return;
    }

    setIsExecuting(true);
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
        toast.success('Plan execution completed!');
        
        // Show transaction notifications for each completed action
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
    }
  };

  const completedActions = plan.actions.filter(a => a.status === 'completed').length;
  const totalActions = plan.actions.length;
  const progress = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>🚀 Execute Plan</span>
          <Badge className={
            plan.status === 'completed' ? 'bg-green-100 text-green-800' :
            plan.status === 'executing' ? 'bg-blue-100 text-blue-800' :
            plan.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }>
            {plan.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{completedActions}/{totalActions} actions</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Actions:</h4>
          {plan.actions.map((action) => (
            <ActionDisplay key={action.id} action={action} />
          ))}
        </div>

        {plan.status === 'planning' && (
          <Button
            onClick={handleExecutePlan}
            disabled={isExecuting}
            className="w-full"
          >
            {isExecuting ? 'Executing Plan...' : 'Execute Plan'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Main Auto Agent Component
function AutoAgentContent() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = usePrivyWallets();
  const { openPopup } = useTransactionPopup();
  
  const [config, setConfig] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<AgentPlan | null>(null);
  const [executionHistory, setExecutionHistory] = useState<AgentPlan[]>([]);

  const primaryWallet = wallets?.[0];
  const userAddress = primaryWallet?.address || '';

  // Agent context
  const context = {
    userAddress,
    chainId: '545', // Flow EVM Testnet
    userId: user?.id,
    walletId: primaryWallet?.address || '', // Use address as ID since id property doesn't exist
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
    // Request notification permissions when component mounts
    requestNotificationPermission();
  }, []);

  const handlePlanCreated = (plan: AgentPlan) => {
    setCurrentPlan(plan);
  };

  const handlePlanUpdated = (plan: AgentPlan) => {
    setCurrentPlan(plan);
    if (plan.status === 'completed' || plan.status === 'failed') {
      setExecutionHistory(prev => [plan, ...prev.slice(0, 4)]); // Keep last 5
    }
  };

  const handleViewTransactionHistory = () => {
    openPopup({
      chainId: context.chainId || '545',
      address: userAddress
    });
  };

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <h2 className="text-xl font-bold mb-4">🤖 Auto Agent</h2>
          <p className="text-gray-600 mb-4">
            Connect your wallet to use the autonomous blockchain agent
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🤖 Autonomous Blockchain Agent</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewTransactionHistory}
              >
                📊 Transaction History
              </Button>
              <Badge variant="outline">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Create execution plans with AI and execute them autonomously using Privy server wallets.
            Supports bridging, DeFi operations, and ETF management.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="agent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agent">🎯 Agent</TabsTrigger>
          <TabsTrigger value="config">🔧 Config</TabsTrigger>
          <TabsTrigger value="history">📚 History</TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlanCreator
              config={config}
              context={context}
              onPlanCreated={handlePlanCreated}
            />
            
            {currentPlan && (
              <PlanExecutor
                plan={currentPlan}
                config={config}
                context={context}
                onPlanUpdated={handlePlanUpdated}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="config">
          <AgentConfig onConfigChange={setConfig} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {executionHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No execution history yet</p>
              </CardContent>
            </Card>
          ) : (
            executionHistory.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{plan.goal}</span>
                    <Badge className={
                      plan.status === 'completed' ? 'bg-green-100 text-green-800' :
                      plan.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {plan.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-2">
                    Executed: {new Date(plan.updated).toLocaleString()}
                  </p>
                  <p className="text-sm">
                    {plan.actions.filter(a => a.status === 'completed').length} of {plan.actions.length} actions completed
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Main page component with providers
export default function AutoAgentPage() {
  return (
    <NotificationProvider>
      <TransactionPopupProvider>
        <AutoAgentContent />
      </TransactionPopupProvider>
    </NotificationProvider>
  );
}
