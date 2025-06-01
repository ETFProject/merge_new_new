import { NextRequest, NextResponse } from 'next/server';

// In a real implementation, this would be a database
// For now, we'll use a mock in-memory storage
const bioVerifications = new Map();

// Helper functions
const validateWalletAddress = (address: string): boolean => {
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(address);
};

const validateTwitterHandle = (handle: string): boolean => {
  const cleanHandle = handle.replace('@', '');
  const pattern = /^[a-zA-Z0-9_]{1,15}$/;
  return pattern.test(cleanHandle);
};

const normalizeWalletAddress = (address: string): string => {
  return address.toLowerCase();
};

const normalizeTwitterHandle = (handle: string): string => {
  return handle.replace('@', '').toLowerCase();
};

const generateVerificationCode = (): string => {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
};

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, twitterHandle } = await request.json();
    const mockMode = request.nextUrl.searchParams.get('mock') !== 'false';
    
    // Validation
    if (!walletAddress || !twitterHandle) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, twitterHandle' },
        { status: 400 }
      );
    }
    
    if (!validateWalletAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }
    
    if (!validateTwitterHandle(twitterHandle)) {
      return NextResponse.json(
        { error: 'Invalid Twitter handle format' },
        { status: 400 }
      );
    }
    
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const normalizedHandle = normalizeTwitterHandle(twitterHandle);
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Store bio verification with expiration
    const bioKey = `${normalizedWallet}_${normalizedHandle}`;
    const verificationData = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      verificationCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    };
    
    bioVerifications.set(bioKey, verificationData);
    
    console.log(`Bio verification initiated:`, {
      key: bioKey,
      code: verificationCode,
      expiresAt: new Date(verificationData.expiresAt).toISOString()
    });
    
    return NextResponse.json({
      success: true,
      verificationCode,
      expiresIn: 600, // 10 minutes in seconds
      message: `Add this verification code to your Twitter bio and then complete verification`
    });
    
  } catch (error) {
    console.error('Error in bio verification initiation:', error);
    return NextResponse.json(
      { error: `Failed to initiate bio verification: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 