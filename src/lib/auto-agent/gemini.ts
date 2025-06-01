'use client';

import { GoogleGenAI } from '@google/genai';

// Types for the auto-agent
export interface AgentAction {
  id: string;
  type: 'bridge' | 'contract_interaction' | 'deposit' | 'withdraw' | 'rebalance' | 'analysis';
  description: string;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  timestamp: number;
  chainId?: string;
  txHash?: string;
  estimatedDuration?: number; // in milliseconds
  priority?: 'low' | 'medium' | 'high';
}

export interface AgentPlan {
  id: string;
  goal: string;
  actions: AgentAction[];
  status: 'planning' | 'executing' | 'completed' | 'failed';
  created: number;
  updated: number;
}

export interface AgentContext {
  userAddress?: string;
  chainId?: string;
  currentBalance?: Record<string, string>;
  etfInfo?: any;
  recentTransactions?: any[];
}

class GeminiAutoAgent {
  private client: GoogleGenAI;
  private initialized: boolean = false;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
      this.initialized = true;
    } else {
      // Initialize later when API key is available
      this.client = null as any;
    }
  }

  async initialize(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.initialized = true;
  }

  async createPlan(
    goal: string, 
    context: AgentContext
  ): Promise<AgentPlan> {
    if (!this.initialized) {
      throw new Error('Gemini agent not initialized with API key');
    }

    const systemInstruction = `You are an autonomous blockchain agent that helps users manage their ETF portfolios and execute DeFi operations. 

Your capabilities include:
- Bridging assets between chains (Flow EVM ↔ Base USDC)
- Interacting with ETF vault contracts
- Depositing and withdrawing from ETFs
- Rebalancing portfolios
- Analyzing market conditions

Current context:
- User Address: ${context.userAddress || 'Not connected'}
- Chain ID: ${context.chainId || 'Unknown'}
- Balances: ${JSON.stringify(context.currentBalance || {})}
- ETF Info: ${JSON.stringify(context.etfInfo || {})}

Create a detailed execution plan with specific steps. Each step should include:
- type: The action type
- description: What the action does
- parameters: Required parameters for execution

Return a JSON object with an array of actions.`;

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Goal: ${goal}

Please create a step-by-step execution plan to achieve this goal. Consider the current context and create practical, executable actions.`,
        config: {
          systemInstruction,
          temperature: 0.3, // Lower temperature for more consistent planning
        }
      });

      const text = response.text || '';
      
      // Try to extract JSON from the response
      let actions: AgentAction[] = [];
      try {
        // Look for JSON array in the response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsedActions = JSON.parse(jsonMatch[0]);
          actions = parsedActions.map((action: any, index: number) => ({
            id: `action_${Date.now()}_${index}`,
            type: action.type || 'analysis',
            description: action.description || action.name || `Action ${index + 1}`,
            parameters: action.parameters || {},
            status: 'pending' as const,
            timestamp: Date.now()
          }));
        }
      } catch (parseError) {
        console.warn('Could not parse JSON from Gemini response, creating default actions');
        // Fallback: create actions based on goal analysis
        actions = this.createFallbackActions(goal, context);
      }

      if (actions.length === 0) {
        actions = this.createFallbackActions(goal, context);
      }

      const plan: AgentPlan = {
        id: `plan_${Date.now()}`,
        goal,
        actions,
        status: 'planning',
        created: Date.now(),
        updated: Date.now()
      };

      return plan;
    } catch (error) {
      console.error('Error creating plan with Gemini:', error);
      
      // Fallback plan
      return {
        id: `plan_${Date.now()}`,
        goal,
        actions: this.createFallbackActions(goal, context),
        status: 'planning',
        created: Date.now(),
        updated: Date.now()
      };
    }
  }

  private createFallbackActions(goal: string, context: AgentContext): AgentAction[] {
    const actions: AgentAction[] = [];
    const goalLower = goal.toLowerCase();

    // Analyze goal and create appropriate actions
    if (goalLower.includes('bridge')) {
      actions.push({
        id: `action_${Date.now()}_0`,
        type: 'bridge',
        description: 'Bridge assets between chains',
        parameters: {
          fromChain: '747', // Flow EVM
          toChain: '8453', // Base
          amount: '1.0',
          asset: 'FLOW'
        },
        status: 'pending',
        timestamp: Date.now()
      });
    }

    if (goalLower.includes('deposit') || goalLower.includes('invest')) {
      actions.push({
        id: `action_${Date.now()}_1`,
        type: 'deposit',
        description: 'Deposit assets into ETF vault',
        parameters: {
          token: 'WFLOW',
          amount: '10.0'
        },
        status: 'pending',
        timestamp: Date.now()
      });
    }

    if (goalLower.includes('rebalance') || goalLower.includes('optimize')) {
      actions.push({
        id: `action_${Date.now()}_2`,
        type: 'rebalance',
        description: 'Rebalance ETF portfolio allocation',
        parameters: {
          strategy: 'optimize_returns'
        },
        status: 'pending',
        timestamp: Date.now()
      });
    }

    if (goalLower.includes('withdraw')) {
      actions.push({
        id: `action_${Date.now()}_3`,
        type: 'withdraw',
        description: 'Withdraw shares from ETF vault',
        parameters: {
          shares: '5.0',
          tokenOut: 'WFLOW'
        },
        status: 'pending',
        timestamp: Date.now()
      });
    }

    if (goalLower.includes('analyze') || goalLower.includes('check') || goalLower.includes('status')) {
      actions.push({
        id: `action_${Date.now()}_4`,
        type: 'analysis',
        description: 'Analyze current portfolio and market conditions',
        parameters: {
          includeMarketData: true,
          generateRecommendations: true
        },
        status: 'pending',
        timestamp: Date.now()
      });
    }

    // Default action if no specific actions identified
    if (actions.length === 0) {
      actions.push({
        id: `action_${Date.now()}_default`,
        type: 'analysis',
        description: 'Analyze request and provide recommendations',
        parameters: {
          query: goal
        },
        status: 'pending',
        timestamp: Date.now()
      });
    }

    return actions;
  }

  async analyzeMarketConditions(context: AgentContext): Promise<string> {
    if (!this.initialized) {
      return 'Market analysis unavailable - Gemini agent not initialized';
    }

    const systemInstruction = `You are a DeFi market analyst. Analyze the provided context and give insights about:
1. Current market conditions
2. ETF performance
3. Recommended actions
4. Risk assessment

Keep responses concise and actionable.`;

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Analyze the current market conditions and ETF status:

Context: ${JSON.stringify(context, null, 2)}

Please provide a brief analysis and any recommendations.`,
        config: {
          systemInstruction,
          temperature: 0.4
        }
      });

      return response.text || '';
    } catch (error) {
      console.error('Error analyzing market conditions:', error);
      return 'Unable to analyze market conditions at this time.';
    }
  }

  async explainAction(action: AgentAction): Promise<string> {
    if (!this.initialized) {
      return `This action will ${action.description}`;
    }

    const systemInstruction = `You are a helpful assistant that explains blockchain and DeFi operations in simple terms. 
Explain what the action does, why it's useful, and any risks involved.`;

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Explain this blockchain action in simple terms:

Action Type: ${action.type}
Description: ${action.description}
Parameters: ${JSON.stringify(action.parameters, null, 2)}

Please explain what this does and why someone might want to do it.`,
        config: {
          systemInstruction,
          temperature: 0.5
        }
      });

      return response.text || '';
    } catch (error) {
      console.error('Error explaining action:', error);
      return 'No explanation available at this time.';
    }
  }

  async generateActionSummary(actions: AgentAction[]): Promise<string> {
    if (!this.initialized) {
      return `Executing ${actions.length} actions: ${actions.map(a => a.description).join(', ')}`;
    }

    const systemInstruction = `Create a concise summary of the actions being executed. 
Explain the overall goal and expected outcome.`;

    try {
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Summarize this sequence of actions:

${actions.map((action, i) => `${i + 1}. ${action.type}: ${action.description}`).join('\n')}

Provide a brief summary of what these actions accomplish together.`,
        config: {
          systemInstruction,
          temperature: 0.4
        }
      });

      return response.text || '';
    } catch (error) {
      console.error('Error generating action summary:', error);
      return 'Summary unavailable at this time.';
    }
  }
}

// Singleton instance
let geminiAgent: GeminiAutoAgent | null = null;

export function createGeminiAgent(apiKey?: string): GeminiAutoAgent {
  if (!geminiAgent) {
    geminiAgent = new GeminiAutoAgent(apiKey);
  } else if (apiKey && !geminiAgent['initialized']) {
    geminiAgent.initialize(apiKey);
  }
  return geminiAgent;
}

export function getGeminiAgent(): GeminiAutoAgent | null {
  return geminiAgent;
}

export { GeminiAutoAgent };
export default GeminiAutoAgent;
