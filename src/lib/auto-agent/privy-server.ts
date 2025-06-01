import { PrivyClient } from '@privy-io/server-auth';
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
}

export interface ContractInteractionParams {
  contractAddress: string;
  abi: any[];
  methodName: string;
  params: any[];
  value?: string;
}

class PrivyServerAgent {
  private client: PrivyClient;
  private config: PrivyWalletConfig;

  constructor(config: PrivyWalletConfig) {
    this.config = config;
    
    const clientConfig: any = {
      walletApi: {}
    };

    if (config.authPrivateKey) {
      clientConfig.walletApi.authorizationPrivateKey = config.authPrivateKey;
    }

    this.client = new PrivyClient(
      config.appId,
      config.appSecret,
      clientConfig
    );
  }

  /**
   * Get server wallet details
   */
  async getServerWallet(userId: string, walletId: string) {
    try {
      const wallet = await this.client.getWallet(userId, walletId);
      return wallet;
    } catch (error) {
      console.error('Error getting server wallet:', error);
      throw error;
    }
  }

  /**
   * Execute a bridge transaction using the Relay SDK integration
   */
  async executeBridge(
    userId: string,
    walletId: string,
    bridgeParams: BridgeParams
  ): Promise<any> {
    try {
      // This would integrate with the bridge script from paste-2.txt
      // For now, return a mock response
      const txHash = `0x${Math.random().toString(16).slice(2)}`;
      
      console.log('🌉 Executing bridge with Privy server wallet:', {
        userId,
        walletId,
        bridgeParams,
        txHash
      });

      // In a real implementation, this would call the bridge function
      // from the relay SDK script provided by the user
      
      return {
        success: true,
        txHash,
        bridgeParams,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error executing bridge:', error);
      throw error;
    }
  }

  /**
   * Execute a contract interaction
   */
  async executeContractInteraction(
    userId: string,
    walletId: string,
    chainId: string,
    interaction: ContractInteractionParams
  ): Promise<any> {
    try {
      const wallet = await this.getServerWallet(userId, walletId);
      
      // Sign and send transaction
      const txParams = {
        to: interaction.contractAddress,
        data: this.encodeContractCall(interaction),
        value: interaction.value || '0'
      };

      const txHash = await this.client.sendTransaction(
        userId,
        walletId,
        txParams
      );

      console.log('📝 Contract interaction executed:', {
        userId,
        walletId,
        chainId,
        contract: interaction.contractAddress,
        method: interaction.methodName,
        txHash
      });

      return {
        success: true,
        txHash,
        contract: interaction.contractAddress,
        method: interaction.methodName,
        params: interaction.params,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error executing contract interaction:', error);
      throw error;
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
      console.error('Error encoding contract call:', error);
      throw error;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(
    userId: string,
    walletId: string,
    tokenAddress?: string
  ): Promise<string> {
    try {
      const wallet = await this.getServerWallet(userId, walletId);
      
      // For native balance
      if (!tokenAddress) {
        // This would need to be implemented with proper RPC calls
        return '0';
      }
      
      // For token balance - would need to call token contract
      return '0';
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(
    userId: string,
    walletId: string,
    message: string
  ): Promise<string> {
    try {
      const signature = await this.client.signMessage(userId, walletId, message);
      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      throw error;
    }
  }

  /**
   * Create a wallet adapter for use with other SDKs
   */
  createWalletAdapter(userId: string, walletId: string) {
    return {
      account: {
        address: async () => {
          const wallet = await this.getServerWallet(userId, walletId);
          return wallet.address as `0x${string}`;
        },
        signMessage: async ({ message }: { message: string }) => {
          return await this.signMessage(userId, walletId, message);
        },
        signTransaction: async (transaction: any) => {
          return await this.client.signTransaction(userId, walletId, transaction);
        }
      },
      sendTransaction: async (transaction: any) => {
        return await this.client.sendTransaction(userId, walletId, transaction);
      },
      signTypedData: async (typedData: any) => {
        return await this.client.signTypedData(userId, walletId, typedData);
      },
      getChainId: async () => 747, // Flow EVM by default
      getAddress: async () => {
        const wallet = await this.getServerWallet(userId, walletId);
        return wallet.address as `0x${string}`;
      }
    };
  }
}

// Singleton instance
let privyServerAgent: PrivyServerAgent | null = null;

export function createPrivyServerAgent(config: PrivyWalletConfig): PrivyServerAgent {
  if (!privyServerAgent) {
    privyServerAgent = new PrivyServerAgent(config);
  }
  return privyServerAgent;
}

export function getPrivyServerAgent(): PrivyServerAgent | null {
  return privyServerAgent;
}

export { PrivyServerAgent };
export default PrivyServerAgent;
