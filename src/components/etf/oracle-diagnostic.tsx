'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ethers } from 'ethers';
import { CONTRACT_REGISTRY_ADDRESS, CONTRACT_REGISTRY_ABI, FLARE_CONTRACT_ABI, FLARE_NETWORK_CONFIG } from '@/app/config/flare-contract';

interface DiagnosticResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export function OracleDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => {
      const existingIndex = prev.findIndex(r => r.step === result.step);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = result;
        return updated;
      }
      return [...prev, result];
    });
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Step 1: Test Network Connectivity
    addResult({
      step: 'Network Connectivity',
      status: 'pending',
      message: 'Testing network connectivity to Flare Coston2...'
    });

    try {
      const response = await fetch(FLARE_NETWORK_CONFIG.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const chainId = parseInt(data.result, 16);
        
        addResult({
          step: 'Network Connectivity',
          status: 'success',
          message: `Network accessible. Chain ID: ${chainId}`,
          details: { chainId, rpcUrl: FLARE_NETWORK_CONFIG.rpcUrl }
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        step: 'Network Connectivity',
        status: 'error',
        message: `Network connectivity failed: ${errorMessage}`,
        details: error
      });
      setIsRunning(false);
      return;
    }

    // Step 2: Test RPC Connection with ethers.js
    addResult({
      step: 'RPC Connection',
      status: 'pending',
      message: 'Testing RPC connection with ethers.js...'
    });

    try {
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      const network = await provider.getNetwork();
      
      addResult({
        step: 'RPC Connection',
        status: 'success',
        message: `Connected to network: ${network.name} (Chain ID: ${network.chainId})`,
        details: { chainId: network.chainId, name: network.name }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        step: 'RPC Connection',
        status: 'error',
        message: `Failed to connect to RPC: ${errorMessage}`,
        details: error
      });
      setIsRunning(false);
      return;
    }

    // Step 3: Test ContractRegistry Connection
    addResult({
      step: 'ContractRegistry Connection',
      status: 'pending',
      message: 'Testing connection to ContractRegistry...'
    });

    try {
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      
      // Try to get contract code to verify it exists
      const code = await provider.getCode(CONTRACT_REGISTRY_ADDRESS);
      if (code === '0x') {
        throw new Error('ContractRegistry not found at specified address');
      }

      addResult({
        step: 'ContractRegistry Connection',
        status: 'success',
        message: 'ContractRegistry found and accessible',
        details: { address: CONTRACT_REGISTRY_ADDRESS, codeLength: code.length }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        step: 'ContractRegistry Connection',
        status: 'error',
        message: `Failed to connect to ContractRegistry: ${errorMessage}`,
        details: error
      });
      setIsRunning(false);
      return;
    }

    // Step 4: Get FTSOv2 Contract Address
    addResult({
      step: 'FTSOv2 Contract Lookup',
      status: 'pending',
      message: 'Getting FTSOv2 contract address from registry...'
    });

    let ftsoV2Address = '';
    try {
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      const registry = new ethers.Contract(CONTRACT_REGISTRY_ADDRESS, CONTRACT_REGISTRY_ABI, provider);
      
      ftsoV2Address = await registry.getContractAddressByName("TestFtsoV2");
      
      addResult({
        step: 'FTSOv2 Contract Lookup',
        status: 'success',
        message: `FTSOv2 contract address retrieved: ${ftsoV2Address}`,
        details: { address: ftsoV2Address }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        step: 'FTSOv2 Contract Lookup',
        status: 'error',
        message: `Failed to get FTSOv2 address: ${errorMessage}`,
        details: error
      });
      setIsRunning(false);
      return;
    }

    // Step 5: Test Individual Feed Fetch
    addResult({
      step: 'Feed Fetch Test',
      status: 'pending',
      message: 'Testing individual feed fetch (ETH/USD)...'
    });

    try {
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      const contract = new ethers.Contract(ftsoV2Address, FLARE_CONTRACT_ABI, provider);
      
      // Try to fetch ETH/USD feed
      const ethFeedId = "0x014554482f55534400000000000000000000000000"; // ETH/USD
      const [value, decimals, timestamp] = await contract.getFeedById(ethFeedId);
      const price = Number(value) / Math.pow(10, Number(decimals));
      
      addResult({
        step: 'Feed Fetch Test',
        status: 'success',
        message: `Successfully fetched ETH/USD: $${price.toLocaleString()}`,
        details: { 
          feedId: ethFeedId,
          value: value.toString(), 
          decimals: Number(decimals), 
          timestamp: Number(timestamp), 
          price,
          timestampDate: new Date(Number(timestamp) * 1000).toLocaleString()
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        step: 'Feed Fetch Test',
        status: 'error',
        message: `Failed to fetch feed: ${errorMessage}`,
        details: error
      });
    }

    // Step 6: Test Multiple Feeds Fetch
    addResult({
      step: 'Multiple Feeds Test',
      status: 'pending',
      message: 'Testing multiple feeds fetch...'
    });

    try {
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      const contract = new ethers.Contract(ftsoV2Address, FLARE_CONTRACT_ABI, provider);
      
      const feedIds = [
        "0x014554482f55534400000000000000000000000000", // ETH/USD
        "0x014254432f55534400000000000000000000000000", // BTC/USD
        "0x01534f4c2f55534400000000000000000000000000"  // SOL/USD
      ];
      
      const [values, decimals, timestamp] = await contract.getFeedsById(feedIds);
      
      const feedData = feedIds.map((feedId, index) => ({
        feedId,
        value: values[index]?.toString(),
        decimals: Number(decimals[index]),
        price: Number(values[index]) / Math.pow(10, Number(decimals[index]))
      }));
      
      addResult({
        step: 'Multiple Feeds Test',
        status: 'success',
        message: `Successfully fetched ${feedData.length} feeds`,
        details: { 
          feedCount: feedData.length, 
          timestamp: Number(timestamp),
          timestampDate: new Date(Number(timestamp) * 1000).toLocaleString(),
          feeds: feedData
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        step: 'Multiple Feeds Test',
        status: 'error',
        message: `Multiple feeds fetch failed: ${errorMessage}`,
        details: error
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          🔧 Oracle Diagnostics
        </CardTitle>
        <CardDescription className="text-blue-600">
          Advanced diagnostics for Flare Network FTSOv2 oracle connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? '🔄 Running Diagnostics...' : '🚀 Run Full Diagnostics'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  result.status === 'success' ? 'bg-green-50 border-green-200' :
                  result.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{getStatusIcon(result.status)}</span>
                  <span className="font-semibold">{result.step}</span>
                </div>
                <p className={`text-sm ${getStatusColor(result.status)}`}>
                  {result.message}
                </p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer">
                      View Details
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Fixes */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold mb-2">Common Solutions:</h4>
          <ul className="text-sm space-y-1">
            <li>• Check if Flare Coston2 testnet is experiencing issues</li>
            <li>• Verify network connectivity</li>
            <li>• Try refreshing the feeds manually</li>
            <li>• Check browser console for additional error details</li>
          </ul>
        </div>

        <div className="p-4 rounded-lg border bg-muted/30 text-sm mt-6">
          <h3 className="font-medium mb-2">About Flare Oracle Data</h3>
          <p className="mb-2">
            The Flare Network Oracle provides real-time price data for various cryptocurrencies through its FTSO (Flare Time Series Oracle) system.
          </p>
          <p className="mb-2">
            <strong>Note:</strong> We&apos;ve applied price corrections to ensure accuracy with market rates. Raw oracle data may require adjustments 
            to match current market prices from sources like CoinMarketCap.
          </p>
          <p>
            For more information about the Flare Network Oracle, visit the 
            <a href="https://docs.flare.network/apis/ftso/" target="_blank" rel="noopener noreferrer" className="underline">
              Flare documentation
            </a>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 