import { NextRequest, NextResponse } from 'next/server';
import { createEnhancedGeminiAgent } from '@/lib/auto-agent/gemini-enhanced';
import { AgentContext } from '@/lib/auto-agent/gemini';

export async function POST(request: NextRequest) {
  try {
    const { goal, context } = await request.json();

    if (!goal) {
      return NextResponse.json({
        success: false,
        error: 'Goal is required'
      }, { status: 400 });
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API key is not configured on the server'
      }, { status: 500 });
    }

    console.log('🤖 Creating auto-agent plan:', {
      goal,
      contextKeys: Object.keys(context || {}),
      timestamp: new Date().toISOString()
    });

    // Create Enhanced Gemini agent with environment variable API key
    const agent = createEnhancedGeminiAgent(apiKey, {
      model: 'gemini-2.0-flash',
      temperature: 0.3,
      maxTokens: 8192
    });
    
    // Create execution plan using advanced planning
    const plan = await agent.createAdvancedPlan(goal, context as AgentContext || {});
    
    console.log('✅ Plan created successfully:', {
      planId: plan.id,
      actionsCount: plan.actions.length,
      status: plan.status
    });

    return NextResponse.json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('❌ Error creating plan:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create plan'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return example plans or recent plans
    const examplePlans = [
      {
        id: 'example_1',
        goal: 'Bridge 10 FLOW to Base USDC',
        actions: [
          {
            id: 'action_1',
            type: 'bridge',
            description: 'Bridge 10 FLOW from Flow EVM to Base USDC',
            parameters: {
              fromChain: '747',
              toChain: '8453',
              amount: '10.0',
              asset: 'FLOW'
            },
            status: 'pending',
            timestamp: Date.now()
          }
        ],
        status: 'planning',
        created: Date.now(),
        updated: Date.now()
      },
      {
        id: 'example_2',
        goal: 'Deposit into ITF and rebalance portfolio',
        actions: [
          {
            id: 'action_1',
            type: 'deposit',
            description: 'Deposit 50 WFLOW into ITF vault',
            parameters: {
              token: 'WFLOW',
              amount: '50.0'
            },
            status: 'pending',
            timestamp: Date.now()
          },
          {
            id: 'action_2',
            type: 'rebalance',
            description: 'Rebalance portfolio for optimal allocation',
            parameters: {
              strategy: 'optimize_returns'
            },
            status: 'pending',
            timestamp: Date.now() + 1000
          }
        ],
        status: 'planning',
        created: Date.now(),
        updated: Date.now()
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        examples: examplePlans
      }
    });

  } catch (error) {
    console.error('❌ Error getting plans:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get plans'
    }, { status: 500 });
  }
}
