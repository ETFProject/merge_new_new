import { NextRequest, NextResponse } from 'next/server';
import { createEnhancedPrivyServerAgent } from '@/lib/auto-agent/privy-server-enhanced';
import { ActionExecutor } from '@/lib/auto-agent/executor';
import { AgentPlan } from '@/lib/auto-agent/gemini';

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, walletId, privyConfig } = await request.json();

    if (!plan || !userId || !walletId) {
      return NextResponse.json({
        success: false,
        error: 'Plan, userId, and walletId are required'
      }, { status: 400 });
    }

    // Use environment variables for Privy config if available, otherwise use the client-provided config
    const serverPrivyConfig = {
      appId: process.env.PRIVY_APP_ID || privyConfig?.appId,
      appSecret: process.env.PRIVY_APP_SECRET || privyConfig?.appSecret,
      authPrivateKey: process.env.PRIVY_AUTH_KEY || privyConfig?.authPrivateKey
    };

    if (!serverPrivyConfig.appId || !serverPrivyConfig.appSecret) {
      return NextResponse.json({
        success: false,
        error: 'Privy configuration is required and not found in environment variables'
      }, { status: 400 });
    }

    console.log('🚀 Executing auto-agent plan:', {
      planId: plan.id,
      userId,
      walletId,
      actionsCount: plan.actions?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Create Enhanced Privy server agent with environment variables
    const privyAgent = createEnhancedPrivyServerAgent(serverPrivyConfig, 'http://localhost:3012');

    // Verify wallet exists
    try {
      const wallet = await privyAgent.getServerWallet(userId, walletId);
      console.log('✅ Wallet verified:', wallet.address);
    } catch (error) {
      console.error('❌ Wallet verification failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify wallet'
      }, { status: 400 });
    }

    // Create action executor
    const executor = new ActionExecutor({
      privyAgent,
      userId,
      walletId,
      onProgress: (action) => {
        console.log('📊 Action progress:', {
          actionId: action.id,
          type: action.type,
          status: action.status
        });
      },
      onComplete: (action) => {
        console.log('✅ Action completed:', {
          actionId: action.id,
          type: action.type,
          txHash: action.txHash
        });
      },
      onError: (action, error) => {
        console.error('❌ Action failed:', {
          actionId: action.id,
          type: action.type,
          error: error.message
        });
      }
    });

    // Execute the plan
    const executedPlan = await executor.executePlan(plan as AgentPlan);

    console.log('🎉 Plan execution completed:', {
      planId: executedPlan.id,
      status: executedPlan.status,
      completedActions: executedPlan.actions.filter(a => a.status === 'completed').length,
      failedActions: executedPlan.actions.filter(a => a.status === 'failed').length
    });

    return NextResponse.json({
      success: true,
      data: executedPlan
    });

  } catch (error) {
    console.error('❌ Error executing plan:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute plan'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const walletId = url.searchParams.get('walletId');

    if (!userId || !walletId) {
      return NextResponse.json({
        success: false,
        error: 'userId and walletId are required'
      }, { status: 400 });
    }

    // Return mock execution status
    return NextResponse.json({
      success: true,
      data: {
        userId,
        walletId,
        status: 'ready',
        lastExecution: null,
        availableActions: [
          'bridge',
          'deposit',
          'withdraw',
          'contract_interaction',
          'rebalance',
          'analysis'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error getting execution status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get execution status'
    }, { status: 500 });
  }
}
