'use client';

import { FlowETFClient } from "@/components/etf/flow-etf-client";

export default function FlowEtfPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Flow ETF Manager</h2>
        <p className="text-muted-foreground">
          Manage your ETF on the Flow EVM Testnet (Chain ID: 545)
        </p>
      </div>
      
      <FlowETFClient onSuccess={() => console.log('Operation completed successfully')} />
      
      <div className="p-4 bg-muted/30 rounded-lg text-sm">
        <h3 className="font-medium mb-2">About Flow EVM ETFs</h3>
        <p className="mb-3">
          This ETF manager allows you to interact with the Flow ETF contracts deployed on Flow EVM Testnet.
          You can deposit assets, withdraw, and rebalance your ETF portfolio.
        </p>
        
        <h4 className="font-medium mb-1">Deployed Contracts</h4>
        <ul className="list-disc list-inside mb-3 space-y-1">
          <li>ETF Vault: <code className="text-xs">0x8Cdb066f5190efF591f65C8dedA667D8e45665B3</code></li>
          <li>Asset Factory: <code className="text-xs">0x2a78CF76ec1b5F349b96E70B38360e21323Fd2d1</code></li>
          <li>WFLOW: <code className="text-xs">0x65604A8Cfbaa318C8EDa47fcF8352EB77BDAA15E</code></li>
        </ul>
        
        <h4 className="font-medium mb-1">Network Information</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Network Name: Flow EVM Testnet</li>
          <li>RPC URL: https://testnet.evm.nodes.onflow.org</li>
          <li>Chain ID: 545</li>
          <li>Symbol: FLOW</li>
          <li>Block Explorer: <a href="https://evm-testnet.flowscan.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://evm-testnet.flowscan.io</a></li>
        </ul>
      </div>
    </div>
  );
} 