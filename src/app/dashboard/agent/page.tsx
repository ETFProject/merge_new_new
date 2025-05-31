'use client';

import { AgentMonitoringClient } from "@/components/etf/agent-monitoring-client";

export default function AgentMonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Agent Monitoring</h2>
        <p className="text-muted-foreground">
          Monitor and manage ETF agent operations on the Flow EVM Testnet
        </p>
      </div>
      
      <AgentMonitoringClient onSuccess={() => console.log('Agent operation completed successfully')} />
      
      <div className="p-4 bg-muted/30 rounded-lg text-sm">
        <h3 className="font-medium mb-2">About ETF Agents</h3>
        <p className="mb-3">
          ETF Agents are specialized smart contract wallets that handle cross-chain rebalancing operations, 
          deposits, withdrawals, and other operations on behalf of ETF vault contracts.
        </p>
        
        <h4 className="font-medium mb-1">Agent Capabilities</h4>
        <ul className="list-disc list-inside mb-3 space-y-1">
          <li>Execute batched operations on ETF vaults</li>
          <li>Handle cross-chain liquidity transfers</li>
          <li>Manage fee collection and distribution</li>
          <li>Implement EIP-7702 delegated transaction execution</li>
        </ul>
        
        <h4 className="font-medium mb-1">Security Considerations</h4>
        <p className="mb-3">
          Agent wallets have limited permissions and can only execute operations authorized by the ETF vault owner.
          All operations are logged and can be monitored through this dashboard.
        </p>
      </div>
    </div>
  );
} 