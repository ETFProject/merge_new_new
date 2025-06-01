import { NextRequest, NextResponse } from 'next/server';

// In a real implementation, this would be a database query
// For now, we'll use a mock in-memory storage
const verifications = new Map();

// Helper function to validate wallet address
const validateWalletAddress = (address: string): boolean => {
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(address);
};

export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress.toLowerCase();
    
    // Validate wallet address format
    if (!validateWalletAddress(params.walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }
    
    console.log('Checking verification status for wallet:', walletAddress);
    
    // In a production environment, this would query a database
    const verification = verifications.get(walletAddress);
    
    if (!verification) {
      return NextResponse.json({
        verified: false,
        message: 'No verification found for this wallet address'
      });
    }
    
    return NextResponse.json({
      verified: true,
      ...verification
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 