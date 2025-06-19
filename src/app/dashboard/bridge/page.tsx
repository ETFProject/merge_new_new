'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ArrowRight, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

// Mock bridge data
const BRIDGE_PROTOCOLS = [
  {
    id: 'stargate',
    name: 'Stargate',
    icon: '/1byone1.jpg',
    description: 'Omnichain native asset bridge',
    fee: '0.06%',
    speed: 'Fast',
    security: 'High'
  },
  {
    id: 'across',
    name: 'Across',
    icon: '/1byone5.jpg',
    description: 'Fast cross-chain bridge',
    fee: '0.05%',
    speed: 'Very Fast',
    security: 'High'
  },
  {
    id: 'hop',
    name: 'Hop Protocol',
    icon: '/1byone8.jpg',
    description: 'Layer 2 bridge',
    fee: '0.08%',
    speed: 'Medium',
    security: 'High'
  }
];

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', icon: '/1byone1.jpg', nativeToken: 'ETH' },
  { id: 8453, name: 'Base', icon: '/1byone5.jpg', nativeToken: 'ETH' },
  { id: 42161, name: 'Arbitrum', icon: '/1byone13.jpg', nativeToken: 'ETH' },
  { id: 137, name: 'Polygon', icon: '/1byone10.jpg', nativeToken: 'MATIC' },
  { id: 43114, name: 'Avalanche', icon: '/1byone19.jpg', nativeToken: 'AVAX' },
  { id: 545, name: 'Flow EVM', icon: '/tornado.png', nativeToken: 'FLOW' }
];

const SUPPORTED_TOKENS = {
  USDC: { symbol: 'USDC', decimals: 6, logo: '/flower.png' },
  WETH: { symbol: 'WETH', decimals: 18, logo: '/sandwave.png' },
  USDT: { symbol: 'USDT', decimals: 6, logo: '/snail.png' },
  FLOW: { symbol: 'FLOW', decimals: 18, logo: '/tornado.png' }
};

// Mock bridge transactions
const mockBridgeTransactions = [
  {
    id: 'bridge_001',
    fromChain: 'Base',
    toChain: 'Flow EVM',
    fromToken: 'USDC',
    toToken: 'USDC',
    amount: '1,000',
    status: 'completed',
    timestamp: '2024-03-15T10:30:00Z',
    txHash: '0x1234...5678',
    protocol: 'Stargate'
  },
  {
    id: 'bridge_002',
    fromChain: 'Ethereum',
    toChain: 'Base',
    fromToken: 'WETH',
    toToken: 'WETH',
    amount: '0.5',
    status: 'pending',
    timestamp: '2024-03-15T09:15:00Z',
    txHash: '0xabcd...efgh',
    protocol: 'Across'
  },
  {
    id: 'bridge_003',
    fromChain: 'Flow EVM',
    toChain: 'Arbitrum',
    fromToken: 'FLOW',
    toToken: 'WETH',
    amount: '100',
    status: 'failed',
    timestamp: '2024-03-15T08:45:00Z',
    txHash: '0x9876...5432',
    protocol: 'Hop'
  }
];

export default function BridgePage() {
  const [sourceChain, setSourceChain] = useState(SUPPORTED_CHAINS[1]); // Base
  const [destChain, setDestChain] = useState(SUPPORTED_CHAINS[5]); // Flow EVM
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState(BRIDGE_PROTOCOLS[0]);
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeTransactions, setBridgeTransactions] = useState(mockBridgeTransactions);

  const handleBridge = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      return;
    }

    setIsBridging(true);
    
    // Simulate bridge transaction
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newTransaction = {
      id: `bridge_${Date.now()}`,
      fromChain: sourceChain.name,
      toChain: destChain.name,
      fromToken: selectedToken,
      toToken: selectedToken,
      amount: amount,
      status: 'pending',
      timestamp: new Date().toISOString(),
      txHash: `0x${Math.random().toString(36).substring(2, 15)}`,
      protocol: selectedProtocol.name
    };
    
    setBridgeTransactions([newTransaction, ...bridgeTransactions]);
    setIsBridging(false);
    setAmount('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cross-Chain Bridge</h1>
        <p className="text-muted-foreground">
          Bridge assets between different blockchain networks
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bridge Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Bridge Assets</CardTitle>
            <CardDescription>
              Transfer tokens between different blockchain networks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Source Chain */}
            <div>
              <label className="text-sm font-medium">From</label>
              <Select value={sourceChain.id.toString()} onValueChange={(value: string) => {
                const chain = SUPPORTED_CHAINS.find(c => c.id.toString() === value);
                if (chain) setSourceChain(chain);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CHAINS.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded" />
                        {chain.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>

            {/* Destination Chain */}
            <div>
              <label className="text-sm font-medium">To</label>
              <Select value={destChain.id.toString()} onValueChange={(value: string) => {
                const chain = SUPPORTED_CHAINS.find(c => c.id.toString() === value);
                if (chain) setDestChain(chain);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CHAINS.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded" />
                        {chain.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Token Selection */}
            <div>
              <label className="text-sm font-medium">Token</label>
              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUPPORTED_TOKENS).map(([key, token]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Image src={token.logo} alt={token.symbol} width={16} height={16} className="rounded" />
                        {token.symbol}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
              />
            </div>

            {/* Protocol Selection */}
            <div>
              <label className="text-sm font-medium">Bridge Protocol</label>
              <Select value={selectedProtocol.id} onValueChange={(value: string) => {
                const protocol = BRIDGE_PROTOCOLS.find(p => p.id === value);
                if (protocol) setSelectedProtocol(protocol);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRIDGE_PROTOCOLS.map((protocol) => (
                    <SelectItem key={protocol.id} value={protocol.id}>
                      <div className="flex items-center gap-2">
                        <Image src={protocol.icon} alt={protocol.name} width={16} height={16} className="rounded" />
                        {protocol.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bridge Info */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bridge Fee:</span>
                <span>{selectedProtocol.fee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Estimated Time:</span>
                <span>{selectedProtocol.speed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Security:</span>
                <span>{selectedProtocol.security}</span>
              </div>
            </div>

            {/* Bridge Button */}
            <Button 
              onClick={handleBridge} 
              disabled={isBridging || !amount}
              className="w-full"
            >
              {isBridging ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Bridging...
                </>
              ) : (
                'Bridge Assets'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Bridge Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bridge Transactions</CardTitle>
            <CardDescription>
              Track your cross-chain transfers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bridgeTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(tx.status)}
                    <div>
                      <div className="text-sm font-medium">
                        {tx.amount} {tx.fromToken}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.fromChain} → {tx.toChain}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supported Protocols */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Bridge Protocols</CardTitle>
          <CardDescription>
            Choose from multiple secure bridge protocols
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {BRIDGE_PROTOCOLS.map((protocol) => (
              <div key={protocol.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Image src={protocol.icon} alt={protocol.name} width={24} height={24} className="rounded" />
                  <h3 className="font-semibold">{protocol.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{protocol.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Fee:</span>
                    <span>{protocol.fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span>{protocol.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security:</span>
                    <span>{protocol.security}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 