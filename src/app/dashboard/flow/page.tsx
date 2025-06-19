'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TrendingUp, TrendingDown, ArrowRight, RefreshCw, Activity, Zap } from "lucide-react";

// Mock liquidity flow data
const LIQUIDITY_POOLS = [
  {
    id: 'pool_1',
    name: 'USDC/FLOW',
    chain: 'Flow EVM',
    tvl: '$2.4M',
    volume24h: '$156K',
    apy: '12.5%',
    status: 'active',
    icon: '/flower.png'
  },
  {
    id: 'pool_2',
    name: 'WETH/USDC',
    chain: 'Base',
    tvl: '$1.8M',
    volume24h: '$89K',
    apy: '8.2%',
    status: 'active',
    icon: '/sandwave.png'
  },
  {
    id: 'pool_3',
    name: 'FLOW/WETH',
    chain: 'Arbitrum',
    tvl: '$950K',
    volume24h: '$67K',
    apy: '15.7%',
    status: 'active',
    icon: '/tornado.png'
  }
];

const FLOW_TRANSACTIONS = [
  {
    id: 'tx_1',
    type: 'deposit',
    from: 'User Wallet',
    to: 'ITF Vault',
    amount: '1,000 USDC',
    timestamp: '2024-03-15T10:30:00Z',
    status: 'completed'
  },
  {
    id: 'tx_2',
    type: 'bridge',
    from: 'Base',
    to: 'Flow EVM',
    amount: '500 WETH',
    timestamp: '2024-03-15T09:15:00Z',
    status: 'pending'
  },
  {
    id: 'tx_3',
    type: 'swap',
    from: 'USDC',
    to: 'FLOW',
    amount: '2,000 USDC',
    timestamp: '2024-03-15T08:45:00Z',
    status: 'completed'
  },
  {
    id: 'tx_4',
    type: 'withdraw',
    from: 'ITF Vault',
    to: 'User Wallet',
    amount: '100 FLOW',
    timestamp: '2024-03-15T08:30:00Z',
    status: 'completed'
  }
];

const NETWORK_STATS = {
  totalLiquidity: '$5.2M',
  totalVolume24h: '$312K',
  activeUsers: '1,247',
  totalTransactions: '8,934',
  averageAPY: '12.1%'
};

export default function LiquidityFlowPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  const refreshData = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'withdraw':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'bridge':
        return <ArrowRight className="w-4 h-4 text-blue-500" />;
      case 'swap':
        return <Zap className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liquidity Flow</h1>
          <p className="text-muted-foreground">
            Visualize the full liquidity and service flow across networks
          </p>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{NETWORK_STATS.totalLiquidity}</div>
                <div className="text-sm text-muted-foreground">Total Liquidity</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{NETWORK_STATS.totalVolume24h}</div>
                <div className="text-sm text-muted-foreground">24h Volume</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{NETWORK_STATS.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{NETWORK_STATS.totalTransactions}</div>
                <div className="text-sm text-muted-foreground">Total TXs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{NETWORK_STATS.averageAPY}</div>
                <div className="text-sm text-muted-foreground">Avg APY</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Liquidity Pools */}
        <Card>
          <CardHeader>
            <CardTitle>Liquidity Pools</CardTitle>
            <CardDescription>
              Active liquidity pools across supported networks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {LIQUIDITY_POOLS.map((pool) => (
                <div key={pool.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Image src={pool.icon} alt={pool.name} width={32} height={32} className="rounded" />
                    <div>
                      <div className="font-medium">{pool.name}</div>
                      <div className="text-sm text-muted-foreground">{pool.chain}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{pool.tvl}</div>
                    <div className="text-sm text-muted-foreground">TVL</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">{pool.apy}</div>
                    <div className="text-sm text-muted-foreground">APY</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{pool.volume24h}</div>
                    <div className="text-sm text-muted-foreground">24h Vol</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {pool.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Flow Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Flow Transactions</CardTitle>
            <CardDescription>
              Latest liquidity and service flow activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {FLOW_TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <div className="text-sm font-medium capitalize">{tx.type}</div>
                      <div className="text-xs text-muted-foreground">
                        {tx.from} → {tx.to}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{tx.amount}</div>
                    <div className={`text-xs ${
                      tx.status === 'completed' ? 'text-green-600' : 
                      tx.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Liquidity Flow Diagram</CardTitle>
          <CardDescription>
            Visual representation of asset flow across networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* User Layer */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">User Layer</h3>
                <p className="text-sm text-muted-foreground">
                  Users deposit assets and interact with ITFs
                </p>
                <div className="mt-3 space-y-1 text-xs">
                  <div>• Wallet Connections</div>
                  <div>• Asset Deposits</div>
                  <div>• Portfolio Management</div>
                </div>
              </div>

              {/* Bridge Layer */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <ArrowRight className="w-8 h-8 text-purple-600" />
                </div>
                <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Bridge Layer</h3>
                <p className="text-sm text-muted-foreground">
                  Cross-chain asset transfers and swaps
                </p>
                <div className="mt-3 space-y-1 text-xs">
                  <div>• Stargate Protocol</div>
                  <div>• Across Protocol</div>
                  <div>• Hop Protocol</div>
                </div>
              </div>

              {/* Liquidity Layer */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Liquidity Layer</h3>
                <p className="text-sm text-muted-foreground">
                  ITF vaults and liquidity pools
                </p>
                <div className="mt-3 space-y-1 text-xs">
                  <div>• ITF Vaults</div>
                  <div>• Liquidity Pools</div>
                  <div>• Yield Generation</div>
                </div>
              </div>
            </div>

            {/* Flow Lines */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded"></div>
              <div className="h-1 bg-gradient-to-r from-purple-400 to-green-400 rounded"></div>
              <div className="h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
          <CardDescription>
            Real-time status of supported networks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {['Flow EVM', 'Base', 'Arbitrum'].map((network) => (
              <div key={network} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{network}</h3>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Status: Online</div>
                  <div>Latency: 45ms</div>
                  <div>Uptime: 99.9%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 