'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ethers } from 'ethers';
import { FLARE_CONTRACT_ADDRESS, FLARE_CONTRACT_ABI, FLARE_NETWORK_CONFIG } from '@/app/config/flare-contract';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: unknown;
}

export function OracleDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Step 0: Test Basic Network Connectivity
    addResult({
      step: 'Network Test',
      status: 'pending',
      message: 'Testing basic network connectivity...'
    });

    try {
      const response = await fetch('https://coston2-api.flare.network/ext/C/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const blockNumber = parseInt(data.result, 16);
      
      addResult({
        step: 'Network Test',
        status: 'success',
        message: `Network connectivity OK - Block #${blockNumber.toLocaleString()}`,
        details: { blockNumber, response: data }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        step: 'Network Test',
        status: 'error',
        message: `Network connectivity failed: ${errorMessage}`,
        details: error
      });
      setIsRunning(false);
      return;
    }

    // Step 1: Test RPC Connection
    addResult({
      step: 'RPC Connection',
      status: 'pending',
      message: 'Testing connection to Flare Coston2 RPC...'
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

    // Step 2: Test Contract Connection
    addResult({
      step: 'Contract Connection',
      status: 'pending',
      message: 'Testing connection to Flare Oracle contract...'
    });

    try {
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      
      // Try to get contract code to verify it exists
      const code = await provider.getCode(FLARE_CONTRACT_ADDRESS);
      if (code === '0x') {
        throw new Error('Contract not found at specified address');
      }

      addResult({
        step: 'Contract Connection',
        status: 'success',
        message: 'Contract found and accessible',
        details: { address: FLARE_CONTRACT_ADDRESS, codeLength: code.length }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        step: 'Contract Connection',
        status: 'error',
        message: `Failed to connect to contract: ${errorMessage}`,
        details: error
      });
      setIsRunning(false);
      return;
    }

    // Step 3: Test Individual Feed Fetch
    addResult({
      step: 'Feed Fetch Test',
      status: 'pending',
      message: 'Testing individual feed fetch (BTC/USD)...'
    });

    try {
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      const contract = new ethers.Contract(FLARE_CONTRACT_ADDRESS, FLARE_CONTRACT_ABI, provider);
      
      // Try to fetch BTC/USD (index 2)
      const [value, decimals, timestamp] = await contract.getFeedById(2);
      const price = Number(value) / Math.pow(10, Number(decimals));
      
      addResult({
        step: 'Feed Fetch Test',
        status: 'success',
        message: `Successfully fetched BTC/USD: $${price.toLocaleString()}`,
        details: { value: value.toString(), decimals: Number(decimals), timestamp: Number(timestamp), price }
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

    // Step 4: Test Batch Feed Fetch
    addResult({
      step: 'Batch Fetch Test',
      status: 'pending',
      message: 'Testing batch feed fetch...'
    });

    try {
      const provider = new ethers.JsonRpcProvider(FLARE_NETWORK_CONFIG.rpcUrl);
      const contract = new ethers.Contract(FLARE_CONTRACT_ADDRESS, FLARE_CONTRACT_ABI, provider);
      
      const [values] = await contract.getFtsoV2CurrentFeedValues();
      
      addResult({
        step: 'Batch Fetch Test',
        status: 'success',
        message: `Successfully fetched batch data: ${values.length} feeds`,
        details: { totalFeeds: values.length, sampleValue: values[2]?.toString() }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addResult({
        step: 'Batch Fetch Test',
        status: 'error',
        message: `Batch fetch failed: ${errorMessage}`,
        details: error
      });
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⭕';
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'pending': return 'border-l-yellow-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Oracle Connection Diagnostics</CardTitle>
        <CardDescription>
          Test and debug Flare Oracle connection issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Diagnostic Results:</h3>
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border border-l-4 ${getBorderColor(result.status)} bg-gray-50`}
              >
                <div className="flex items-center gap-2">
                  <span>{getStatusIcon(result.status)}</span>
                  <span className="font-medium">{result.step}:</span>
                  <span className={getStatusColor(result.status)}>
                    {result.message}
                  </span>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600">
                    Show details
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto border">
                    {(() => {
                      try {
                        return result.details ? JSON.stringify(result.details, null, 2) : 'No details available';
                      } catch {
                        return 'Unable to display details';
                      }
                    })()}
                  </pre>
                </details>
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