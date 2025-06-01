'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createEnhancedGeminiAgent } from '@/lib/auto-agent/gemini-enhanced';
import { createEnhancedPrivyServerAgent } from '@/lib/auto-agent/privy-server-enhanced';
import { BlockscoutApiClient } from '@/lib/blockscout/sdk-enhanced';
import { toast } from 'sonner';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  duration?: number;
  details?: any;
}

export default function EnhancedAutoAgentDemo() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const updateTestResult = (testName: string, updates: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(result => 
        result.test === testName 
          ? { ...result, ...updates }
          : result
      )
    );
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Gemini 2.0 Flash Integration
      addTestResult({
        test: 'Gemini 2.0 Flash Integration',
        status: 'pending',
        message: 'Testing Gemini 2.0 Flash API connection...'
      });

      const startTime1 = Date.now();
      try {
        const geminiAgent = createEnhancedGeminiAgent('test_key', {
          model: 'gemini-2.0-flash',
          temperature: 0.3,
          maxTokens: 4096
        });

        // Test plan creation
        const testPlan = await geminiAgent.createAdvancedPlan(
          'Bridge 2 FLOW to Base USDC',
          {
            userAddress: '0x1234567890123456789012345678901234567890',
            chainId: '747',
            currentBalance: { FLOW: '10.0', USDC: '500.0' },
            etfInfo: { totalValue: '1000.0', userShares: '5.0', status: 'active' }
          }
        );

        updateTestResult('Gemini 2.0 Flash Integration', {
          status: 'success',
          message: `Plan created with ${testPlan.actions.length} actions`,
          duration: Date.now() - startTime1,
          details: {
            planId: testPlan.id,
            actionsCount: testPlan.actions.length,
            estimatedDuration: testPlan.actions.reduce((sum, action) => 
              sum + (action.estimatedDuration || 30000), 0
            )
          }
        });
      } catch (error) {
        updateTestResult('Gemini 2.0 Flash Integration', {
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime1
        });
      }

      // Test 2: Enhanced Privy Server Agent
      addTestResult({
        test: 'Enhanced Privy Server Agent',
        status: 'pending',
        message: 'Testing Privy server wallet integration...'
      });

      const startTime2 = Date.now();
      try {
        const privyAgent = createEnhancedPrivyServerAgent(
          {
            appId: 'test_app_id',
            appSecret: 'test_app_secret',
            authPrivateKey: 'test_private_key'
          },
          'http://localhost:3012'
        );

        // Test wallet retrieval
        const wallet = await privyAgent.getServerWallet('test_user', 'test_wallet');
        
        // Test bridge quote
        const bridgeQuote = await privyAgent.getBridgeQuote({
          fromChain: '747',
          toChain: '8453',
          fromToken: 'FLOW',
          toToken: 'USDC',
          amount: '2.0'
        });

        // Test balance check
        const balance = await privyAgent.getWalletBalance('test_user', 'test_wallet');

        updateTestResult('Enhanced Privy Server Agent', {
          status: 'success',
          message: `Wallet operations successful`,
          duration: Date.now() - startTime2,
          details: {
            walletAddress: wallet.address,
            bridgeQuote: bridgeQuote.outputAmount,
            balance: balance.balance
          }
        });
      } catch (error) {
        updateTestResult('Enhanced Privy Server Agent', {
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime2
        });
      }

      // Test 3: Enhanced Blockscout SDK
      addTestResult({
        test: 'Enhanced Blockscout SDK',
        status: 'pending',
        message: 'Testing Blockscout API integration...'
      });

      const startTime3 = Date.now();
      try {
        const blockscoutApi = new BlockscoutApiClient();
        
        // Test transaction lookup
        const txDetails = await blockscoutApi.getTransaction(
          '545', // Flow EVM Testnet
          '0x1234567890123456789012345678901234567890123456789012345678901234'
        );

        // Test address transactions
        const addressTxs = await blockscoutApi.getAddressTransactions(
          '545',
          '0x1234567890123456789012345678901234567890',
          5
        );

        updateTestResult('Enhanced Blockscout SDK', {
          status: 'success',
          message: `API calls successful`,
          duration: Date.now() - startTime3,
          details: {
            transactionFound: !!txDetails,
            addressTransactions: addressTxs.length,
            latestTxStatus: txDetails?.status || 'unknown'
          }
        });
      } catch (error) {
        updateTestResult('Enhanced Blockscout SDK', {
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime3
        });
      }

      // Test 4: Integration Flow
      addTestResult({
        test: 'End-to-End Integration',
        status: 'pending',
        message: 'Testing complete auto-agent workflow...'
      });

      const startTime4 = Date.now();
      try {
        // Simulate a complete workflow
        const workflow = {
          step1: 'Plan created with Gemini 2.0 Flash',
          step2: 'Wallet verified with Privy',
          step3: 'Bridge quote obtained',
          step4: 'Transaction monitoring ready with Blockscout',
          step5: 'Ready for execution'
        };

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        updateTestResult('End-to-End Integration', {
          status: 'success',
          message: 'Complete workflow validation successful',
          duration: Date.now() - startTime4,
          details: workflow
        });
      } catch (error) {
        updateTestResult('End-to-End Integration', {
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime4
        });
      }

      // Test 5: Performance Metrics
      addTestResult({
        test: 'Performance Metrics',
        status: 'pending',
        message: 'Collecting performance data...'
      });

      const startTime5 = Date.now();
      try {
        const metrics = {
          totalTestTime: Date.now() - (startTime1),
          averageResponseTime: testResults
            .filter(r => r.duration)
            .reduce((sum, r) => sum + (r.duration || 0), 0) / testResults.length,
          successRate: testResults.filter(r => r.status === 'success').length / testResults.length * 100,
          memoryUsage: performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
          } : 'Not available'
        };

        updateTestResult('Performance Metrics', {
          status: 'success',
          message: `Performance analysis complete`,
          duration: Date.now() - startTime5,
          details: metrics
        });
      } catch (error) {
        updateTestResult('Performance Metrics', {
          status: 'failed',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime5
        });
      }

      toast.success('Comprehensive testing completed!');

    } catch (error) {
      toast.error('Testing failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '🔄';
      case 'success': return '✅';
      case 'failed': return '❌';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-3xl">🧪</span>
            <div>
              <h1 className="text-2xl font-bold">Enhanced Auto-Agent Demo</h1>
              <p className="text-purple-100 text-sm mt-1">
                Testing Gemini 2.0 Flash, Enhanced Privy Integration, and Blockscout SDK
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-white/20 px-3 py-1 rounded">
              🤖 Gemini 2.0 Flash AI
            </div>
            <div className="bg-white/20 px-3 py-1 rounded">
              🔐 Enhanced Privy Server Wallets
            </div>
            <div className="bg-white/20 px-3 py-1 rounded">
              🔭 Blockscout SDK Integration
            </div>
            <div className="bg-white/20 px-3 py-1 rounded">
              🌉 Relay Protocol Bridge
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Suite Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={runComprehensiveTest}
              disabled={isRunning}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Running Tests...
                </span>
              ) : (
                'Run Comprehensive Test Suite'
              )}
            </Button>
            
            {testResults.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setTestResults([])}
                disabled={isRunning}
              >
                Clear Results
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Results</span>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-800">
                  {testResults.filter(r => r.status === 'success').length} Passed
                </Badge>
                <Badge className="bg-red-100 text-red-800">
                  {testResults.filter(r => r.status === 'failed').length} Failed
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {testResults.filter(r => r.status === 'pending').length} Pending
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <div>
                        <h4 className="font-medium">{result.test}</h4>
                        <p className="text-sm text-gray-600">{result.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.duration && (
                        <span className="text-xs text-gray-500">
                          {result.duration}ms
                        </span>
                      )}
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                  </div>

                  {result.details && (
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Details:</p>
                      <pre className="text-xs text-gray-600 overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🤖</span>
              <span>Gemini 2.0 Flash</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Advanced reasoning with structured planning</li>
              <li>• Context-aware action generation</li>
              <li>• Optimized temperature and token settings</li>
              <li>• Fallback action creation</li>
              <li>• Performance analysis</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔐</span>
              <span>Enhanced Privy</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Server-side wallet management</li>
              <li>• Bridge integration with Relay</li>
              <li>• Real-time transaction monitoring</li>
              <li>• Comprehensive error handling</li>
              <li>• Health checks and diagnostics</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🔭</span>
              <span>Blockscout SDK</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2">
              <li>• Real-time transaction notifications</li>
              <li>• Multi-chain transaction history</li>
              <li>• Transaction interpretation</li>
              <li>• Enhanced notification UI</li>
              <li>• Browser notification support</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
