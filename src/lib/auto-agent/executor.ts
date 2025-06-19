import { AgentAction, AgentPlan } from './gemini';
import { PrivyServerAgent, BridgeParams, ContractInteractionParams } from './privy-server';
import { getContracts, formatAmount, parseAmount } from '@/lib/flow-contracts';
import { CONTRACT_ADDRESSES, ASSET_ADDRESSES } from '@/config/contracts';
import { ethers } from 'ethers';

export interface ActionExecutorConfig {
  privyAgent: PrivyServerAgent;
  userId: string;
  walletId: string;
  onProgress?: (action: AgentAction) => void;
  onComplete?: (action: AgentAction) => void;
  onError?: (action: AgentAction, error: Error) => void;
}

export interface ExecutionResult {
  success: boolean;
  txHash?: string;
  result?: any;
  error?: string;
}

export class ActionExecutor {
  private config: ActionExecutorConfig;

  constructor(config: ActionExecutorConfig) {
    this.config = config;
  }

  /**
   * Execute a single action
   */
  async executeAction(action: AgentAction): Promise<ExecutionResult> {
    try {
      this.updateActionStatus(action, 'executing');
      
      let result: ExecutionResult;

      switch (action.type) {
        case 'bridge':
          result = await this.executeBridge(action);
          break;
        case 'deposit':
          result = await this.executeDeposit(action);
          break;
        case 'withdraw':
          result = await this.executeWithdraw(action);
          break;
        case 'contract_interaction':
          result = await this.executeContractInteraction(action);
          break;
        case 'rebalance':
          result = await this.executeRebalance(action);
          break;
        case 'analysis':
          result = await this.executeAnalysis(action);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      if (result.success) {
        action.result = result.result;
        action.txHash = result.txHash;
        this.updateActionStatus(action, 'completed');
      } else {
        action.error = result.error;
        this.updateActionStatus(action, 'failed');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      action.error = errorMessage;
      this.updateActionStatus(action, 'failed');
      
      this.config.onError?.(action, error instanceof Error ? error : new Error(errorMessage));
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Execute a plan (sequence of actions)
   */
  async executePlan(plan: AgentPlan): Promise<AgentPlan> {
    plan.status = 'executing';
    plan.updated = Date.now();

    try {
      for (const action of plan.actions) {
        const result = await this.executeAction(action);
        
        // If an action fails, stop execution
        if (!result.success) {
          plan.status = 'failed';
          break;
        }
        
        // Small delay between actions for UX
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Check if all actions completed successfully
      const allCompleted = plan.actions.every(action => action.status === 'completed');
      plan.status = allCompleted ? 'completed' : 'failed';
      
    } catch (error) {
      console.error('Error executing plan:', error);
      plan.status = 'failed';
    }

    plan.updated = Date.now();
    return plan;
  }

  /**
   * Execute bridge action
   */
  private async executeBridge(action: AgentAction): Promise<ExecutionResult> {
    const { fromChain, toChain, amount, asset } = action.parameters;
    
    const bridgeParams: BridgeParams = {
      fromChain: fromChain || '747', // Flow EVM
      toChain: toChain || '8453', // Base
      fromToken: asset || 'FLOW',
      toToken: 'USDC',
      amount: amount || '1.0',
      recipient: '' // Will be set by the server
    };

    const result = await this.config.privyAgent.executeBridge(
      this.config.userId,
      this.config.walletId,
      bridgeParams
    );

    return {
      success: result.success,
      txHash: result.txHash,
      result: {
        bridgeParams,
        timestamp: result.timestamp
      }
    };
  }

  /**
   * Execute deposit action
   */
  private async executeDeposit(action: AgentAction): Promise<ExecutionResult> {
    const { token, amount } = action.parameters;
    
    // Only allow USDC deposits
    if (token?.toLowerCase() !== 'usdc') {
      return {
        success: false,
        error: 'Only USDC deposits are supported'
      };
    }
    
    const tokenAddress = ASSET_ADDRESSES.USDC;
    const amountWei = ethers.parseUnits(amount || '1.0', 6).toString(); // USDC has 6 decimals

    const interaction: ContractInteractionParams = {
      contractAddress: CONTRACT_ADDRESSES.etfVault,
      abi: [
        'function deposit(address token, uint256 amount) returns (uint256)'
      ],
      methodName: 'deposit',
      params: [tokenAddress, amountWei]
    };

    const result = await this.config.privyAgent.executeContractInteraction(
      this.config.userId,
      this.config.walletId,
      '545', // Flow EVM Testnet
      interaction
    );

    return {
      success: result.success,
      txHash: result.txHash,
      result: {
        token: 'USDC',
        amount,
        hash: result.txHash
      }
    };
  }

  /**
   * Execute withdraw action
   */
  private async executeWithdraw(action: AgentAction): Promise<ExecutionResult> {
    const { shares, tokenOut } = action.parameters;
    
    // Only allow USDC withdrawals
    if (tokenOut?.toLowerCase() !== 'usdc') {
      return {
        success: false,
        error: 'Only USDC withdrawals are supported'
      };
    }
    
    const tokenAddress = ASSET_ADDRESSES.USDC;
    const sharesWei = parseAmount(shares || '1.0').toString();

    const interaction: ContractInteractionParams = {
      contractAddress: CONTRACT_ADDRESSES.etfVault,
      abi: [
        'function withdraw(uint256 shares, address tokenOut, uint256 minAmountOut) returns (uint256)'
      ],
      methodName: 'withdraw',
      params: [sharesWei, tokenAddress, '0'] // minAmountOut = 0 for simplicity
    };

    const result = await this.config.privyAgent.executeContractInteraction(
      this.config.userId,
      this.config.walletId,
      '545', // Flow EVM Testnet
      interaction
    );

    return {
      success: result.success,
      txHash: result.txHash,
      result: {
        shares,
        tokenOut: 'USDC',
        hash: result.txHash
      }
    };
  }

  /**
   * Execute contract interaction
   */
  private async executeContractInteraction(action: AgentAction): Promise<ExecutionResult> {
    const { contractAddress, abi, methodName, params, value } = action.parameters;

    const interaction: ContractInteractionParams = {
      contractAddress,
      abi,
      methodName,
      params: params || [],
      value
    };

    const result = await this.config.privyAgent.executeContractInteraction(
      this.config.userId,
      this.config.walletId,
      '545', // Flow EVM Testnet
      interaction
    );

    return {
      success: result.success,
      txHash: result.txHash,
      result: {
        contract: contractAddress,
        method: methodName,
        params,
        hash: result.txHash
      }
    };
  }

  /**
   * Execute rebalance action
   */
  private async executeRebalance(action: AgentAction): Promise<ExecutionResult> {
    // For now, this is a mock implementation
    // In a real system, this would analyze current allocations and rebalance
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          result: {
            strategy: action.parameters.strategy,
            oldAllocation: { WFLOW: 70, USDC: 30 },
            newAllocation: { WFLOW: 60, USDC: 40 },
            rebalancedAt: new Date().toISOString()
          }
        });
      }, 2000);
    });
  }

  /**
   * Execute analysis action
   */
  private async executeAnalysis(action: AgentAction): Promise<ExecutionResult> {
    // Mock analysis - in reality this would fetch on-chain data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          result: {
            analysis: `Analysis completed for: ${action.parameters.query || 'portfolio'}`,
            recommendations: [
              'Portfolio is well-balanced',
              'Consider rebalancing if market conditions change',
              'Monitor gas fees for optimal transaction timing'
            ],
            marketConditions: 'Stable',
            riskLevel: 'Medium',
            analyzedAt: new Date().toISOString()
          }
        });
      }, 1500);
    });
  }

  /**
   * Update action status and trigger callbacks
   */
  private updateActionStatus(action: AgentAction, status: AgentAction['status']) {
    action.status = status;
    action.timestamp = Date.now();

    switch (status) {
      case 'executing':
        this.config.onProgress?.(action);
        break;
      case 'completed':
        this.config.onComplete?.(action);
        break;
    }
  }
}

export default ActionExecutor;
