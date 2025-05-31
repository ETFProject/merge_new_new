import { NextRequest, NextResponse } from 'next/server';

// Mock ETF creation data to simulate backend response
interface ETFData {
  id: string;
  name: string;
  description?: string;
  riskProfile: string;
  initialAmount: string;
  imageIpfsHash?: string;
  userAddress: string;
  timestamp: string;
}

// Store ETFs in memory for demo purposes
const etfs: ETFData[] = [];

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.riskProfile || !data.initialAmount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create a new ETF entry
    const newEtf: ETFData = {
      id: `etf-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: data.name,
      description: data.description,
      riskProfile: data.riskProfile,
      initialAmount: data.initialAmount,
      imageIpfsHash: data.imageIpfsHash,
      userAddress: data.userAddress || '0xb067fB16AFcABf8A8974a35CbCee243B8FDF0EA1',
      timestamp: new Date().toISOString(),
    };
    
    // Add to our in-memory store
    etfs.push(newEtf);
    
    // Log for debugging
    console.log('Created ETF:', newEtf);
    
    // In a real implementation, you would:
    // 1. Call smart contract to create ETF
    // 2. Store data in database
    // 3. Return transaction hash and ETF ID
    
    // Mock successful response
    return NextResponse.json({
      success: true,
      data: newEtf,
      message: 'ETF created successfully',
    });
  } catch (error) {
    console.error('Error creating ETF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ETF' },
      { status: 500 }
    );
  }
}

// GET handler to retrieve ETFs (for testing/debugging)
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: etfs,
  });
}
