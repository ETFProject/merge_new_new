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

// Mock implementation for demo purposes
class PrivyServerAgent {
  private config: PrivyWalletConfig;

  constructor(config: PrivyWalletConfig) {
    this.config = config;
    console.log('Initialized Privy Server Agent with config:', {
      appId: config.appId,
      hasAppSecret: !!config.appSecret,
      hasAuthKey: !!config.authPrivateKey
    });
  }

  /**
   * Get server wallet details (mock implementation)
   */
  async getServerWallet(userId: string, walletId: string) {
    console.log('Getting server wallet for:', { userId, walletId });
    return {
      id: walletId,
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
      chainType: 'ethereum'
    };
  }

  /**
   * Execute a bridge transaction (mock implementation)
   */
  async executeBridge(
    userId: string,
    walletId: string,
    bridgeParams: BridgeParams
  ) {
    const txHash = `0x${Math.random().toString(16).slice(2)}`;
    
    console.log('🌉 Executing bridge with Privy server wallet:', {
      userId,
      walletId,
      bridgeParams,
      txHash
    });
    
    return {
      success: true,
      txHash,
      bridgeParams,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute a contract interaction (mock implementation)
   */
  async executeContractInteraction(
    userId: string,
    walletId: string,
    chainId: string,
    interaction: ContractInteractionParams
  ) {
    const txHash = `0x${Math.random().toString(16).slice(2)}`;
    
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
   * Get wallet balance (mock implementation)
   */
  async getWalletBalance(
    userId: string,
    walletId: string,
    tokenAddress?: string
  ): Promise<string> {
    console.log('Getting wallet balance:', { userId, walletId, tokenAddress });
    
    // Mock balance
    if (!tokenAddress) {
      return '1.5'; // Native token
    }
    
    // ERC20 token
    return '100.0';
  }

  /**
   * Sign a message (mock implementation)
   */
  async signMessage(
    userId: string,
    walletId: string,
    message: string
  ): Promise<string> {
    console.log('Signing message:', { userId, walletId, message });
    return `0x${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Create a wallet adapter for use with other SDKs (mock implementation)
   */
  createWalletAdapter(userId: string, walletId: string) {
    return {
      account: {
        address: async () => {
          const address = `0x${Math.random().toString(16).slice(2, 42)}`;
          return address as `0x${string}`;
        },
        signMessage: async ({ message }: { message: string }) => {
          console.log('Signing message with adapter:', { message });
          return `0x${Math.random().toString(16).slice(2)}`;
        },
        signTransaction: async (transaction: any) => {
          console.log('Signing transaction with adapter:', { transaction });
          return `0x${Math.random().toString(16).slice(2)}`;
        }
      },
      sendTransaction: async (transaction: any) => {
        console.log('Sending transaction with adapter:', { transaction });
        return `0x${Math.random().toString(16).slice(2)}`;
      },
      signTypedData: async (typedData: any) => {
        console.log('Signing typed data with adapter:', { typedData });
        return `0x${Math.random().toString(16).slice(2)}`;
      },
      getChainId: async () => 747, // Flow EVM by default
      getAddress: async () => {
        const address = `0x${Math.random().toString(16).slice(2, 42)}`;
        return address as `0x${string}`;
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
