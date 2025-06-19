'use client';

import { GoogleGenAI } from '@google/genai';
import { AgentAction, AgentPlan, AgentContext } from './gemini';

// Enhanced Gemini integration with 2.0 Flash capabilities
interface GeminiConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

interface ActionTemplate {
  type: AgentAction['type'];
  description: string;
  parameters: Record<string, any>;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high';
  prerequisites?: string[];
  risks?: string[];
}

export class EnhancedGeminiAgent {
  private client: GoogleGenAI;
  private initialized: boolean = false;
  private config: GeminiConfig;

  constructor(apiKey?: string, config?: Partial<GeminiConfig>) {
    this.config = {
      model: 'gemini-2.0-flash', // Using the latest stable model
      temperature: 0.3,
      maxTokens: 8192,
      topP: 0.8,
      topK: 40,
      ...config
    };

    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
      this.initialized = true;
    } else {
      this.client = null as any;
    }
  }

  async initialize(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.initialized = true;
  }

  /**
   * Create an intelligent execution plan using advanced prompting techniques
   */
  async createAdvancedPlan(
    goal: string, 
    context: AgentContext
  ): Promise<AgentPlan> {
    if (!this.initialized) {
      throw new Error('Gemini agent not initialized with API key');
    }

    const systemInstruction = this.buildSystemInstruction(context);
    const prompt = this.buildPlanningPrompt(goal, context);

    try {
      console.log('🤖 Creating advanced plan with Gemini 2.0 Flash...');
      
      const response = await this.client.models.generateContent({
        model: this.config.model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
          topP: this.config.topP,
          topK: this.config.topK,
          // Enable advanced reasoning for complex planning
          candidateCount: 1,
          stopSequences: ['</plan>']
        }
      });

      const responseText = response.text || '';
      console.log('📝 Gemini response received:', responseText.slice(0, 200) + '...');

      const plan = this.parsePlanFromResponse(responseText, goal);
      console.log('✅ Plan created successfully:', {
        planId: plan.id,
        actionsCount: plan.actions.length,
        estimatedDuration: this.calculateTotalDuration(plan.actions)
      });

      return plan;

    } catch (error) {
      console.error('❌ Error creating advanced plan:', error);
      return this.createFallbackPlan(goal, context);
    }
  }

  /**
   * Build comprehensive system instruction for the agent
   */
  private buildSystemInstruction(context: AgentContext): string {
    return `You are an advanced autonomous blockchain agent specialized in DeFi operations and ITF management. 

## Your Capabilities:
- Cross-chain bridge operations (Flow EVM ↔ Base, other chains)
- Smart contract interactions on multiple chains
- ITF vault management (deposits, withdrawals, rebalancing)
- Portfolio analysis and optimization
- Risk assessment and mitigation
- Gas optimization and transaction timing

## Current Context:
- User Address: ${context.userAddress || 'Not connected'}
- Primary Chain: ${context.chainId || 'Unknown'}
- Available Balances: ${JSON.stringify(context.currentBalance || {}, null, 2)}
- ITF Information: ${JSON.stringify(context.itfInfo || {}, null, 2)}

## Planning Guidelines:
1. Always prioritize safety and security
2. Consider gas costs and optimize transaction order
3. Implement proper error handling and fallbacks
4. Provide clear descriptions for each action
5. Estimate realistic execution times
6. Consider dependencies between actions

## Response Format:
You must respond with a structured plan in JSON format within <plan></plan> tags:

<plan>
{
  "reasoning": "Brief explanation of your approach",
  "actions": [
    {
      "type": "bridge|deposit|withdraw|contract_interaction|rebalance|analysis",
      "description": "Clear description of what this action does",
      "parameters": {
        "key": "value"
      },
      "estimatedDuration": 30000,
      "priority": "high|medium|low",
      "prerequisites": ["list of dependencies"],
      "risks": ["potential issues to consider"]
    }
  ],
  "totalEstimatedTime": 120000,
  "riskLevel": "low|medium|high",
  "successProbability": 0.95
}
</plan>

Be precise, practical, and always consider real-world constraints.`;
  }

  /**
   * Build detailed planning prompt
   */
  private buildPlanningPrompt(goal: string, context: AgentContext): string {
    const examples = this.getRelevantExamples(goal);
    
    return `# Task: Create Execution Plan

## Goal: ${goal}

## Context Analysis:
${this.analyzeContext(context)}

## Similar Examples:
${examples}

## Requirements:
1. Break down the goal into specific, executable actions
2. Consider the user's current situation and constraints
3. Optimize for efficiency and safety
4. Provide realistic time estimates
5. Include proper risk assessment

Please create a detailed execution plan that accomplishes this goal safely and efficiently.`;
  }

  /**
   * Analyze context to provide better planning input
   */
  private analyzeContext(context: AgentContext): string {
    const analysis = [];
    
    if (context.userAddress) {
      analysis.push(`✅ Wallet connected: ${context.userAddress.slice(0, 6)}...${context.userAddress.slice(-4)}`);
    } else {
      analysis.push(`❌ No wallet connected`);
    }

    if (context.currentBalance) {
      const balances = Object.entries(context.currentBalance)
        .map(([token, amount]) => `${token}: ${amount}`)
        .join(', ');
      analysis.push(`💰 Available balances: ${balances}`);
    }

    if (context.itfInfo) {
      analysis.push(`📊 ITF Status: ${JSON.stringify(context.itfInfo)}`);
    }

    return analysis.join('\n');
  }

  /**
   * Get relevant examples based on goal
   */
  private getRelevantExamples(goal: string): string {
    const goalLower = goal.toLowerCase();
    
    if (goalLower.includes('bridge')) {
      return `Example Bridge Plan:
1. Verify source balance and destination address
2. Get optimal bridge quote with slippage protection
3. Execute bridge transaction with monitoring
4. Wait for cross-chain confirmation
5. Verify destination balance updated`;
    }
    
    if (goalLower.includes('deposit') || goalLower.includes('invest')) {
      return `Example Investment Plan:
1. Check token balance and allowance
2. Approve token spending if needed
3. Execute deposit to ITF vault
4. Monitor transaction confirmation
5. Verify shares received and update portfolio`;
    }
    
    if (goalLower.includes('rebalance')) {
      return `Example Rebalancing Plan:
1. Analyze current portfolio allocation
2. Calculate optimal target allocation
3. Determine required trades
4. Execute rebalancing transactions
5. Verify new allocation matches target`;
    }
    
    return `Generic Example:
1. Validate preconditions and requirements
2. Prepare necessary parameters
3. Execute main operation
4. Monitor progress and handle errors
5. Verify final state and cleanup`;
  }

  /**
   * Parse plan from Gemini response
   */
  private parsePlanFromResponse(responseText: string, goal: string): AgentPlan {
    try {
      // Extract JSON from <plan> tags
      const planMatch = responseText.match(/<plan>([\s\S]*?)<\/plan>/);
      if (planMatch) {
        const planData = JSON.parse(planMatch[1]);
        
        const actions: AgentAction[] = planData.actions.map((action: any, index: number) => ({
          id: `action_${Date.now()}_${index}`,
          type: action.type || 'analysis',
          description: action.description || `Action ${index + 1}`,
          parameters: action.parameters || {},
          status: 'pending' as const,
          timestamp: Date.now(),
          estimatedDuration: action.estimatedDuration || 30000,
          priority: action.priority || 'medium'
        }));

        return {
          id: `plan_${Date.now()}`,
          goal,
          actions,
          status: 'planning',
          created: Date.now(),
          updated: Date.now()
        };
      }
    } catch (parseError) {
      console.warn('Could not parse structured plan, falling back to text analysis');
    }

    // Fallback: analyze text response and create actions
    return this.createFallbackPlan(goal, {});
  }

  /**
   * Create fallback plan when AI parsing fails
   */
  private createFallbackPlan(goal: string, context: AgentContext): AgentPlan {
    const actions = this.generateFallbackActions(goal, context);
    
    return {
      id: `plan_${Date.now()}`,
      goal,
      actions,
      status: 'planning',
      created: Date.now(),
      updated: Date.now()
    };
  }

  /**
   * Generate fallback actions based on goal analysis
   */
  private generateFallbackActions(goal: string, context: AgentContext): AgentAction[] {
    const goalLower = goal.toLowerCase();
    const templates: ActionTemplate[] = [];

    // Bridge operations
    if (goalLower.includes('bridge')) {
      templates.push({
        type: 'bridge',
        description: 'Bridge assets between chains using Relay protocol',
        parameters: {
          fromChain: '747', // Flow EVM
          toChain: '8453', // Base
          amount: '1.0',
          asset: 'FLOW',
          toAsset: 'USDC'
        },
        estimatedDuration: 180000, // 3 minutes
        priority: 'high',
        prerequisites: ['Sufficient balance', 'Valid recipient address'],
        risks: ['Bridge fees', 'Slippage', 'Network congestion']
      });
    }

    // ITF operations
    if (goalLower.includes('deposit') || goalLower.includes('invest')) {
      templates.push({
        type: 'deposit',
        description: 'Deposit assets into ITF vault',
        parameters: {
          token: 'WFLOW',
          amount: '10.0'
        },
        estimatedDuration: 60000, // 1 minute
        priority: 'medium',
        prerequisites: ['Token approval', 'Minimum deposit amount'],
        risks: ['Gas fees', 'Slippage', 'Contract risks']
      });
    }

    if (goalLower.includes('withdraw')) {
      templates.push({
        type: 'withdraw',
        description: 'Withdraw shares from ITF vault',
        parameters: {
          shares: '5.0',
          tokenOut: 'WFLOW'
        },
        estimatedDuration: 45000,
        priority: 'medium',
        prerequisites: ['Sufficient shares', 'Valid output token'],
        risks: ['Exit fees', 'Market impact', 'Liquidity']
      });
    }

    if (goalLower.includes('rebalance')) {
      templates.push({
        type: 'rebalance',
        description: 'Optimize portfolio allocation',
        parameters: {
          strategy: 'risk_adjusted',
          maxSlippage: '0.5'
        },
        estimatedDuration: 120000,
        priority: 'low',
        prerequisites: ['Portfolio analysis', 'Market data'],
        risks: ['Transaction costs', 'Market volatility', 'Timing risks']
      });
    }

    // Analysis
    if (goalLower.includes('analyze') || goalLower.includes('check') || templates.length === 0) {
      templates.push({
        type: 'analysis',
        description: 'Analyze current portfolio and provide recommendations',
        parameters: {
          includeMarketData: true,
          riskAssessment: true,
          recommendations: true
        },
        estimatedDuration: 15000,
        priority: 'low',
        prerequisites: ['Market data access'],
        risks: ['Data accuracy', 'Market volatility']
      });
    }

    return templates.map((template, index) => ({
      id: `action_${Date.now()}_${index}`,
      type: template.type,
      description: template.description,
      parameters: template.parameters,
      status: 'pending' as const,
      timestamp: Date.now(),
      estimatedDuration: template.estimatedDuration,
      priority: template.priority
    }));
  }

  /**
   * Calculate total estimated duration for a plan
   */
  private calculateTotalDuration(actions: AgentAction[]): number {
    return actions.reduce((total, action) => total + (action.estimatedDuration || 30000), 0);
  }

  /**
   * Analyze action performance and provide insights
   */
  async analyzeActionPerformance(action: AgentAction): Promise<string> {
    if (!this.initialized) {
      return 'Performance analysis unavailable - Gemini agent not initialized';
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.config.model,
        contents: `Analyze the performance of this blockchain action:

Action: ${action.type}
Description: ${action.description}
Status: ${action.status}
Duration: ${action.estimatedDuration}ms
Parameters: ${JSON.stringify(action.parameters, null, 2)}
${action.result ? `Result: ${JSON.stringify(action.result, null, 2)}` : ''}
${action.error ? `Error: ${action.error}` : ''}

Provide insights on:
1. Performance vs expectations
2. Potential optimizations  
3. Risk factors encountered
4. Recommendations for similar actions`,
        config: {
          systemInstruction: 'You are a blockchain performance analyst. Provide concise, actionable insights.',
          temperature: 0.4
        }
      });

      return response.text || 'Analysis completed';
    } catch (error) {
      console.error('Error analyzing action performance:', error);
      return 'Performance analysis failed';
    }
  }

  /**
   * Generate optimization suggestions for future plans
   */
  async generateOptimizationSuggestions(
    completedPlans: AgentPlan[]
  ): Promise<string[]> {
    if (!this.initialized || completedPlans.length === 0) {
      return ['No optimization data available'];
    }

    try {
      const planSummary = completedPlans.map(plan => ({
        goal: plan.goal,
        actionsCount: plan.actions.length,
        successRate: plan.actions.filter(a => a.status === 'completed').length / plan.actions.length,
        totalDuration: plan.updated - plan.created
      }));

      const response = await this.client.models.generateContent({
        model: this.config.model,
        contents: `Analyze these completed execution plans and suggest optimizations:

Plans Summary: ${JSON.stringify(planSummary, null, 2)}

Provide 3-5 specific optimization suggestions for:
1. Execution efficiency
2. Cost reduction
3. Risk mitigation
4. User experience improvement

Return as a JSON array of strings.`,
        config: {
          systemInstruction: 'You are an AI optimization expert. Focus on practical, implementable improvements.',
          temperature: 0.3
        }
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return ['Continue monitoring performance', 'Optimize gas usage', 'Implement better error handling'];
    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      return ['Optimization analysis failed'];
    }
  }
}

// Enhanced singleton pattern
let enhancedGeminiAgent: EnhancedGeminiAgent | null = null;

export function createEnhancedGeminiAgent(
  apiKey?: string, 
  config?: Partial<GeminiConfig>
): EnhancedGeminiAgent {
  if (!enhancedGeminiAgent) {
    enhancedGeminiAgent = new EnhancedGeminiAgent(apiKey, config);
  } else if (apiKey && !enhancedGeminiAgent['initialized']) {
    enhancedGeminiAgent.initialize(apiKey);
  }
  return enhancedGeminiAgent;
}

export function getEnhancedGeminiAgent(): EnhancedGeminiAgent | null {
  return enhancedGeminiAgent;
}

export default EnhancedGeminiAgent;
