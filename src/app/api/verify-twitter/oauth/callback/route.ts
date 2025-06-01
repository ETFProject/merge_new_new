import { NextRequest, NextResponse } from 'next/server';

// In a real implementation, this would be a database
// For now, we'll use a mock in-memory storage
const pendingVerifications = new Map();
const verifications = new Map();

// Mock Flare blockchain service
const mockFlareAttestation = async (data: Record<string, unknown>) => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate blockchain delay
  
  console.log('Submitting attestation to Flare:', data);
  
  const attestationId = 'flr_mock_' + Math.random().toString(16).slice(2, 8);
  const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const merkleProof = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  
  return {
    attestationId,
    txHash,
    merkleProof,
    consensusReached: true,
    validators: Math.floor(Math.random() * 5) + 8, // 8-12 validators
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('OAuth Callback:', { code: !!code, state: !!state, error });
    
    if (error) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/verify?verification=error&message=${encodeURIComponent('Twitter authorization failed')}`
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/verify?verification=error&message=${encodeURIComponent('Missing authorization parameters')}`
      );
    }
    
    const pending = pendingVerifications.get(state);
    if (!pending) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/verify?verification=error&message=${encodeURIComponent('Invalid or expired authorization state')}`
      );
    }
    
    // Clean up pending verification
    pendingVerifications.delete(state);
    
    // In a real implementation, we would exchange the code for an access token
    // and then use that token to fetch the user's profile
    
    // For this mock, we'll simulate a successful verification
    const mockUserData = {
      id: '12345',
      username: pending.twitterHandle,
      name: 'OAuth User',
      description: 'Verified via OAuth',
      verified: false,
      public_metrics: {
        followers_count: 250,
        following_count: 100
      },
      location: 'Crypto Valley'
    };
    
    // Prepare attestation data
    const attestationData = {
      walletAddress: pending.walletAddress,
      twitterHandle: pending.twitterHandle,
      verificationMethod: 'oauth',
      userProfile: mockUserData,
      timestamp: Date.now()
    };
    
    // Submit to Flare blockchain (mocked)
    const flareAttestation = await mockFlareAttestation(attestationData);
    
    // Store verification
    const verificationRecord = {
      walletAddress: pending.walletAddress,
      twitterHandle: pending.twitterHandle,
      verificationMethod: 'oauth',
      userProfile: mockUserData,
      flareAttestation,
      verified: true,
      verifiedAt: new Date().toISOString()
    };
    
    verifications.set(pending.walletAddress, verificationRecord);
    
    console.log(`OAuth verification completed for wallet: ${pending.walletAddress}`);
    
    // Redirect to frontend with success
    return NextResponse.redirect(
      `${request.nextUrl.origin}/verify?verification=success&wallet=${pending.walletAddress}`
    );
    
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/verify?verification=error&message=${encodeURIComponent('An unexpected error occurred')}`
    );
  }
} 