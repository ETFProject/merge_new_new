import { NextRequest, NextResponse } from 'next/server';

// API constants
const FUSION_PLUS_API_BASE_URL = 'https://api.1inch.dev/fusion-plus';

// Network IDs based on 1inch NetworkEnum
const NETWORKS = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  BSC: 56,
  POLYGON: 137,
  ARBITRUM: 42161,
  AVALANCHE: 43114,
  GNOSIS: 100,
  BASE: 8453,
  ZKSYNC: 324
};

// Handle GET requests for quote
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get required parameters
    const srcChainId = searchParams.get('srcChainId');
    const dstChainId = searchParams.get('dstChainId');
    const srcTokenAddress = searchParams.get('srcTokenAddress');
    const dstTokenAddress = searchParams.get('dstTokenAddress');
    const amount = searchParams.get('amount');
    const walletAddress = searchParams.get('walletAddress');
    
    // Optional parameters
    const enableEstimate = searchParams.get('enableEstimate') || 'true';
    
    // Validate required parameters
    if (!srcChainId || !dstChainId || !srcTokenAddress || !dstTokenAddress || !amount || !walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 });
    }
    
    // Get the quote from 1inch API
    const apiUrl = `${FUSION_PLUS_API_BASE_URL}/quote`;
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      console.error('1inch API key is not configured');
      return NextResponse.json({
        success: false,
        error: 'API key not configured'
      }, { status: 500 });
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        srcChainId: parseInt(srcChainId),
        dstChainId: parseInt(dstChainId),
        srcTokenAddress,
        dstTokenAddress,
        amount,
        walletAddress,
        enableEstimate: enableEstimate === 'true'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('1inch API error:', errorData);
      return NextResponse.json({
        success: false,
        error: errorData.message || 'Failed to get quote from 1inch'
      }, { status: response.status });
    }
    
    const quoteData = await response.json();
    
    return NextResponse.json({
      success: true,
      data: quoteData
    });
    
  } catch (error) {
    console.error('Error getting 1inch quote:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process quote request'
    }, { status: 500 });
  }
}

// Handle POST requests for order placement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, quote, orderParams } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing action parameter'
      }, { status: 400 });
    }
    
    const apiKey = process.env.ONEINCH_API_KEY;
    
    if (!apiKey) {
      console.error('1inch API key is not configured');
      return NextResponse.json({
        success: false,
        error: 'API key not configured'
      }, { status: 500 });
    }
    
    // Handle different actions
    if (action === 'placeOrder') {
      if (!quote || !orderParams) {
        return NextResponse.json({
          success: false,
          error: 'Missing quote or order parameters'
        }, { status: 400 });
      }
      
      // Place the order with 1inch API
      const apiUrl = `${FUSION_PLUS_API_BASE_URL}/order`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          quote,
          orderParams
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('1inch API error:', errorData);
        return NextResponse.json({
          success: false,
          error: errorData.message || 'Failed to place order with 1inch'
        }, { status: response.status });
      }
      
      const orderData = await response.json();
      
      return NextResponse.json({
        success: true,
        data: orderData
      });
    } 
    else if (action === 'getActiveOrders') {
      // Get active orders
      const apiUrl = `${FUSION_PLUS_API_BASE_URL}/orders/active`;
      const page = body.page || 1;
      const limit = body.limit || 10;
      
      const response = await fetch(`${apiUrl}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('1inch API error:', errorData);
        return NextResponse.json({
          success: false,
          error: errorData.message || 'Failed to get active orders from 1inch'
        }, { status: response.status });
      }
      
      const ordersData = await response.json();
      
      return NextResponse.json({
        success: true,
        data: ordersData
      });
    }
    else if (action === 'submitSecret') {
      // Submit secret
      if (!body.orderHash || !body.secret) {
        return NextResponse.json({
          success: false,
          error: 'Missing orderHash or secret'
        }, { status: 400 });
      }
      
      const apiUrl = `${FUSION_PLUS_API_BASE_URL}/order/secret`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          orderHash: body.orderHash,
          secret: body.secret
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('1inch API error:', errorData);
        return NextResponse.json({
          success: false,
          error: errorData.message || 'Failed to submit secret to 1inch'
        }, { status: response.status });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Secret submitted successfully'
      });
    }
    else {
      return NextResponse.json({
        success: false,
        error: `Unsupported action: ${action}`
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error processing 1inch request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
} 