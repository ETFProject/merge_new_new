import { NextRequest, NextResponse } from 'next/server';
import { verifications, validateWalletAddress } from '@/lib/shared-storage';

export function GET(
  request: NextRequest,
) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const walletAddress = pathParts[pathParts.length - 1].toLowerCase();
    const mockMode = url.searchParams.get('mock') !== 'false';
    
    // Validate wallet address format
    if (!validateWalletAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }
    
    console.log('Checking verification status for wallet:', walletAddress, { mockMode });
    
    // If mock mode is disabled and we're in production, use real API
    if (!mockMode && process.env.NODE_ENV === 'production') {
      // In a real implementation, this would call the real verification API
      // For now, we just return not verified
      return NextResponse.json({
        verified: false,
        message: 'Real API mode: No verification found for this wallet address'
      });
    }
    
    // In mock mode or development, use in-memory storage
    const verification = verifications.get(walletAddress);
    
    if (!verification) {
      return NextResponse.json({
        verified: false,
        message: 'No verification found for this wallet address'
      });
    }
    
    // Return verification data (verification object already contains verified: true)
    return NextResponse.json(verification);
  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 