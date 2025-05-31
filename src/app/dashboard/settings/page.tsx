'use client';

import { FlowETFClient } from "@/components/etf/flow-etf-client";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and advanced ETF configurations.
        </p>
      </div>

      {/* Flow ETF Manager Section */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold tracking-tight">Flow ETF Manager</h2>
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

      {/* Additional Settings Sections */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold tracking-tight">Account Preferences</h2>
          <p className="text-muted-foreground">
            Configure your account settings and preferences.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Notifications</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Configure how you receive notifications about your ETF portfolio.
            </p>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                <span className="text-sm">Email notifications</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                <span className="text-sm">Rebalancing alerts</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm">Performance reports</span>
              </label>
            </div>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Security</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Manage your security settings and wallet connections.
            </p>
            <div className="space-y-2">
              <button className="text-sm text-primary hover:underline">
                Change password
              </button>
              <br />
              <button className="text-sm text-primary hover:underline">
                Manage connected wallets
              </button>
              <br />
              <button className="text-sm text-primary hover:underline">
                Two-factor authentication
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* API & Developer Settings */}
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold tracking-tight">Developer Settings</h2>
          <p className="text-muted-foreground">
            Advanced settings for developers and API access.
          </p>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium mb-2">API Access</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Manage your API keys and access tokens.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-mono">bae_1234567890abcdef</span>
              <button className="text-sm text-red-600 hover:underline">Revoke</button>
            </div>
            <button className="text-sm text-primary hover:underline">
              Generate new API key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 