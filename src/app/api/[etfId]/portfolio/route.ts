import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { etfId: string } }
) {
  try {
    const etfId = params.etfId;
    console.log(`📊 Frontend: Getting REAL portfolio for ${etfId}`);
    
    // Call REAL backend server for portfolio data
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    console.log(`📡 Calling backend at: ${backendUrl}/api/etf/${etfId}/portfolio`);
    
    const response = await fetch(`${backendUrl}/api/etf/${etfId}/portfolio`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend portfolio error:', errorData);
      throw new Error(errorData.error || 'Backend request failed');
    }
    
    const result = await response.json();
    
    console.log('✅ REAL portfolio data received from backend!');
    console.log(`   Total Value: $${result.data.totalValueUSD.toFixed(2)}`);
    console.log(`   NAV per Share: $${result.data.navPerShare.toFixed(4)}`);
    console.log(`   Price Source: ${result.data.priceSource}`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Frontend: Portfolio proxy failed:', error);
    
    // Fallback response with environment-based data
    return NextResponse.json({
      success: true,
      data: {
        etfId: params.etfId,
        totalValueUSD: 10055.0, // Fallback value
        navPerShare: 1.0000,
        totalSupply: '0',
        allocation: [
          {
            symbol: 'USDC',
            percentage: 99.5,
            amount: 10000.0,
            valueUSD: 10000.0,
            priceUSD: 1.0,
            chainId: 84532,
            tokenAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
          },
          {
            symbol: 'WETH',
            percentage: 0.05,
            amount: 5.0,
            valueUSD: 5.0,
            priceUSD: 1.0,
            chainId: 84532,
            tokenAddress: process.env.NEXT_PUBLIC_WETH_ADDRESS || '0x4200000000000000000000000000000000000006'
          },

        ],
        performance: {
          totalReturn: 0,
          dailyReturn: 0,
          weeklyReturn: 0,
          monthlyReturn: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          navHistory: []
        },
        lastUpdated: new Date().toISOString(),
        priceSource: 'fallback',
        note: 'Backend server not responding - using fallback data. Start backend with: bun start'
      }
    });
  }
}
