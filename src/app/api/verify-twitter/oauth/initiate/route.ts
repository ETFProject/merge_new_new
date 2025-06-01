import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// In a real implementation, this would be a database
// For now, we'll use a mock in-memory storage
const pendingVerifications = new Map();

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

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, twitterHandle } = await request.json();
    
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
    
    // Generate OAuth state
    const state = randomBytes(16).toString('hex');
    
    // Generate PKCE values (for real OAuth implementation)
    const codeVerifier = randomBytes(32).toString('base64url');
    const personalizationId = randomBytes(16).toString('hex');
    
    // Store pending verification with expiration
    pendingVerifications.set(state, {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      codeVerifier,
      timestamp: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      personalizationId
    });
    
    // In a real implementation, we would create an OAuth URL
    // For this mock, we'll create a redirect that will simulate the OAuth flow
    
    // Generate a mock authorization URL that points back to our app
    const baseUrl = request.nextUrl.origin;
    // This would be used in the real OAuth flow
    // const callbackUrl = `${baseUrl}/api/verify-twitter/oauth/callback`;
    
    // Create a mock auth URL that passes needed parameters
    const authUrl = new URL(`${baseUrl}/verify`);
    authUrl.searchParams.append('verification', 'success');
    authUrl.searchParams.append('wallet', normalizedWallet);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('mock', 'true');
    
    console.log('OAuth initiation:', {
      wallet: normalizedWallet,
      handle: normalizedHandle,
      state,
      authUrl: authUrl.toString()
    });
    
    return NextResponse.json({
      success: true,
      authorizationUrl: authUrl.toString(),
      state,
      expiresIn: 600, // 10 minutes in seconds
      message: 'Please authorize the application to verify your Twitter account'
    });
    
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return NextResponse.json(
      { error: `Failed to initiate OAuth verification: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 