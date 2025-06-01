import { ethers } from 'ethers';

export interface PrivyWalletConfig {
  appId: string;
  appSecret: string;
  authPrivateKey?: string;
}

export interface BridgeParams {
  fromChain: string;
  toChain: string;
  fromToken: string;
  toToken: string;
  amount: string;
  recipient: string;
  slippageTolerance?: number;
  deadline?: number;
}

export interface ContractInteractionParams {
  contractAddress: string;
  abi: any[];
  methodName: string;
  params: any[];
  value?: string;
}

export interface BridgeResult {
  success: boolean;
  txHash?: string;
  bridgeParams?: BridgeParams;
  timestamp?: string;
  inputAmount?: string;
  outputAmount?: string;
  sourceTxHash?: string;
  destinationTxHash?: string;
  error?: string;
  fees?: {
    bridgeFee: string;
    gasFees: string;
  };
}

export interface RelayBridgeResponse {
  success: boolean;
  inputAmount?: string;
  outputAmount?: string;
  transactions?: any[];
  recipient?: string;
  error?: string;
  result?: any;
  txHashes?: {
    source?: string[];
    destination?: string[];
  };
  logs?: string[];
}

/**
 * Enhanced Privy Server Agent with real bridge integration
 */
class EnhancedPrivyServerAgent {
  private config: PrivyWalletConfig;
  private bridgeServerUrl: string;

  constructor(config: PrivyWalletConfig, bridgeServerUrl?: string) {
    this.config = config;
    this.bridgeServerUrl = bridgeServerUrl || 'http://localhost:3012'; // Default to local bridge server
    
    console.log('🔧 Enhanced Privy Server Agent initialized:', {
      appId: config.appId,
      hasAppSecret: !!config.appSecret,
      hasAuthKey: !!config.authPrivateKey,
      bridgeServerUrl: this.bridgeServerUrl
    });
  }

  /**
   * Get server wallet details using Privy API
   */
  async getServerWallet(userId: string, walletId: string) {
    console.log('📱 Getting server wallet for:', { userId, walletId });
    
    try {
      // In a real implementation, this would call the Privy server API
      // For now, we'll simulate the response
      const wallet = {
        id: walletId,
        address: walletId, // Using walletId as address for simplification
        chainType: 'ethereum',
        userId
      };
      
      console.log('✅ Server wallet retrieved:', wallet.address);
      return wallet;
    } catch (error) {
      console.error('❌ Error getting server wallet:', error);
      throw new Error(`Failed to get server wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute bridge using the real Relay protocol integration
   */
  async executeBridge(
    userId: string,
    walletId: string,
    bridgeParams: BridgeParams
  ): Promise<BridgeResult> {
    console.log('🌉 Executing bridge via Relay protocol:', {
      userId,
      walletId,
      bridgeParams
    });

    try {
      // Verify wallet exists first
      const wallet = await this.getServerWallet(userId, walletId);
      
      // Call the bridge server endpoint
      const bridgeRequest = {
        userId,
        walletId,
        flowAmount: bridgeParams.amount,
        privyConfig: this.config
      };

      console.log('📡 Calling bridge server...');
      const response = await fetch(`${this.bridgeServerUrl}/bridge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bridgeRequest)
      });

      if (!response.ok) {
        throw new Error(`Bridge server responded with ${response.status}: ${response.statusText}`);
      }

      const result: RelayBridgeResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Bridge operation failed');
      }

      console.log('✅ Bridge completed successfully:', {
        inputAmount: result.inputAmount,
        outputAmount: result.outputAmount,
        sourceTxs: result.txHashes?.source?.length || 0,
        destinationTxs: result.txHashes?.destination?.length || 0
      });

      return {
        success: true,
        txHash: result.txHashes?.source?.[0] || result.txHashes?.destination?.[0],
        bridgeParams,
        timestamp: new Date().toISOString(),
        inputAmount: result.inputAmount,
        outputAmount: result.outputAmount,
        sourceTxHash: result.txHashes?.source?.[0],
        destinationTxHash: result.txHashes?.destination?.[0],
        fees: {
          bridgeFee: '0.1', // Mock fee
          gasFees: '0.005'  // Mock gas fee
        }
      };

    } catch (error) {
      console.error('❌ Bridge execution failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown bridge error',
        bridgeParams,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Execute contract interaction with enhanced error handling
   */
  async executeContractInteraction(
    userId: string,
    walletId: string,
    chainId: string,
    interaction: ContractInteractionParams
  ): Promise<BridgeResult> {
    console.log('📝 Executing contract interaction:', {
      userId,
      walletId,
      chainId,
      contract: interaction.contractAddress,
      method: interaction.methodName
    });

    try {
      // Verify wallet
      const wallet = await this.getServerWallet(userId, walletId);
      
      // Encode contract call data
      const callData = this.encodeContractCall(interaction);
      
      // For demonstration, we'll simulate the transaction
      const txHash = `0x${Math.random().toString(16).slice(2)}`;
      
      // In a real implementation, this would:
      // 1. Create a transaction object
      // 2. Sign it with the Privy server wallet
      // 3. Broadcast it to the network
      // 4. Monitor for confirmation
      
      console.log('🔗 Contract interaction simulated:', {
        contract: interaction.contractAddress,
        method: interaction.methodName,
        txHash
      });

      return {
        success: true,
        txHash,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Contract interaction failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Contract interaction failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Enhanced wallet balance checking
   */
  async getWalletBalance(
    userId: string,
    walletId: string,
    tokenAddress?: string,
    chainId?: string
  ): Promise<{
    balance: string;
    decimals: number;
    symbol: string;
    usdValue?: number;
  }> {
    console.log('💰 Getting wallet balance:', { 
      userId, 
      walletId, 
      tokenAddress, 
      chainId 
    });
    
    try {
      // In a real implementation, this would query the blockchain
      const mockBalance = {
        balance: tokenAddress ? '100.0' : '1.5',
        decimals: tokenAddress ? 18 : 18,
        symbol: tokenAddress ? 'TOKEN' : 'ETH',
        usdValue: Math.random() * 1000
      };
      
      console.log('✅ Balance retrieved:', mockBalance);
      return mockBalance;
    } catch (error) {
      console.error('❌ Error getting balance:', error);
      throw error;
    }
  }

  /**
   * Check bridge availability and get quotes
   */
  async getBridgeQuote(bridgeParams: Omit<BridgeParams, 'recipient'>): Promise<{
    inputAmount: string;
    outputAmount: string;
    fees: {
      bridgeFee: string;
      gasFees: string;
    };
    estimatedTime: string;
    route: string[];
  }> {
    console.log('💱 Getting bridge quote:', bridgeParams);
    
    try {
      // In a real implementation, this would call the Relay API for quotes
      const quote = {
        inputAmount: bridgeParams.amount,
        outputAmount: (parseFloat(bridgeParams.amount) * 0.999).toFixed(6), // 0.1% fee
        fees: {
          bridgeFee: (parseFloat(bridgeParams.amount) * 0.001).toFixed(6),
          gasFees: '0.005'
        },
        estimatedTime: '2-5 minutes',
        route: [`Chain ${bridgeParams.fromChain}`, 'Relay Protocol', `Chain ${bridgeParams.toChain}`]
      };
      
      console.log('✅ Bridge quote generated:', quote);
      return quote;
    } catch (error) {
      console.error('❌ Error getting bridge quote:', error);
      throw error;
    }
  }

  /**
   * Monitor transaction status
   */
  async monitorTransaction(
    txHash: string,
    chainId: string,
    onProgress?: (status: {
      confirmations: number;
      status: 'pending' | 'confirmed' | 'failed';
      blockNumber?: number;
    }) => void
  ): Promise<{
    success: boolean;
    confirmations: number;
    blockNumber?: number;
    gasUsed?: string;
  }> {
    console.log('👀 Monitoring transaction:', { txHash, chainId });
    
    return new Promise((resolve) => {
      let confirmations = 0;
      
      const monitor = setInterval(() => {
        confirmations++;
        
        const status = {
          confirmations,
          status: confirmations < 3 ? 'pending' as const : 'confirmed' as const,
          blockNumber: confirmations > 0 ? Math.floor(Math.random() * 1000000) : undefined
        };
        
        onProgress?.(status);
        
        if (confirmations >= 3) {
          clearInterval(monitor);
          resolve({
            success: true,
            confirmations,
            blockNumber: status.blockNumber,
            gasUsed: Math.floor(Math.random() * 100000).toString()
          });
        }
      }, 2000); // 2 second intervals
    });
  }

  /**
   * Create wallet adapter for external SDK integration
   */
  createWalletAdapter(userId: string, walletId: string) {
    return {
      account: {
        address: async () => {
          const wallet = await this.getServerWallet(userId, walletId);
          return wallet.address as `0x${string}`;
        },
        signMessage: async ({ message }: { message: string }) => {
          console.log('✍️ Signing message with Privy server wallet:', { message });
          return `0x${Math.random().toString(16).slice(2)}`;
        },
        signTransaction: async (transaction: any) => {
          console.log('✍️ Signing transaction with Privy server wallet:', { transaction });
          return `0x${Math.random().toString(16).slice(2)}`;
        }
      },
      sendTransaction: async (transaction: any) => {
        console.log('📤 Sending transaction with Privy server wallet:', { transaction });
        return `0x${Math.random().toString(16).slice(2)}`;
      },
      signTypedData: async (typedData: any) => {
        console.log('✍️ Signing typed data with Privy server wallet:', { typedData });
        return `0x${Math.random().toString(16).slice(2)}`;
      },
      getChainId: async () => 747, // Flow EVM by default
      getAddress: async () => {
        const wallet = await this.getServerWallet(userId, walletId);
        return wallet.address as `0x${string}`;
      }
    };
  }

  /**
   * Health check for the bridge server
   */
  async checkBridgeServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.bridgeServerUrl}/health`, {
        method: 'GET',
        timeout: 5000
      } as any);
      
      const isHealthy = response.ok;
      console.log(`🏥 Bridge server health check: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      return isHealthy;
    } catch (error) {
      console.warn('⚠️ Bridge server health check failed:', error);
      return false;
    }
  }

  /**
   * Encode contract call data
   */
  private encodeContractCall(interaction: ContractInteractionParams): string {
    try {
      const iface = new ethers.Interface(interaction.abi);
      return iface.encodeFunctionData(interaction.methodName, interaction.params);
    } catch (error) {
      console.error('❌ Error encoding contract call:', error);
      throw new Error(`Failed to encode contract call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Enhanced singleton management
let enhancedPrivyServerAgent: EnhancedPrivyServerAgent | null = null;

export function createEnhancedPrivyServerAgent(
  config: PrivyWalletConfig,
  bridgeServerUrl?: string
): EnhancedPrivyServerAgent {
  if (!enhancedPrivyServerAgent) {
    enhancedPrivyServerAgent = new EnhancedPrivyServerAgent(config, bridgeServerUrl);
  }
  return enhancedPrivyServerAgent;
}

export function getEnhancedPrivyServerAgent(): EnhancedPrivyServerAgent | null {
  return enhancedPrivyServerAgent;
}

export { EnhancedPrivyServerAgent };
export default EnhancedPrivyServerAgent;
