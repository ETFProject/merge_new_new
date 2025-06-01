import { NextRequest, NextResponse } from 'next/server';

// In a real implementation, this would be a database
// For now, we'll use a mock in-memory storage
const bioVerifications = new Map();
const verifications = new Map();

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

// Mock Twitter service (in a real implementation, this would use the Twitter API)
const mockGetUserProfile = async (handle: string) => {
  await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API delay
  
  // Check if there's a pending verification code for this handle
  let code = '';
  for (const [key, verification] of bioVerifications.entries()) {
    if (key.includes(handle.toLowerCase())) {
      code = verification.verificationCode;
      break;
    }
  }
  
  const description = code
    ? `Web3 developer. Building DeFi apps. Verification code: ${code}`
    : 'Web3 developer. Building DeFi apps.';
  
  return {
    screen_name: handle,
    name: 'Mock User',
    description,
    verified: false,
    followers_count: 100,
    following_count: 50,
    location: 'Crypto City'
  };
};

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
    
    // Check if already verified
    if (verifications.has(normalizedWallet)) {
      return NextResponse.json(
        { error: 'Wallet address already verified' },
        { status: 409 }
      );
    }
    
    // Find bio verification
    const bioKey = `${normalizedWallet}_${normalizedHandle}`;
    const bioVerification = bioVerifications.get(bioKey);
    
    console.log('Checking bio verification:', {
      key: bioKey,
      exists: !!bioVerification,
      currentVerifications: Array.from(bioVerifications.keys())
    });
    
    if (!bioVerification) {
      return NextResponse.json(
        { error: 'No pending bio verification found. Please initiate bio verification first.' },
        { status: 400 }
      );
    }
    
    // Check expiration
    if (Date.now() > bioVerification.expiresAt) {
      bioVerifications.delete(bioKey);
      return NextResponse.json(
        { error: 'Verification code has expired. Please initiate bio verification again.' },
        { status: 400 }
      );
    }
    
    // Increment attempts
    bioVerification.attempts++;
    bioVerifications.set(bioKey, bioVerification);
    
    console.log(`Completing bio verification:`, {
      key: bioKey,
      code: bioVerification.verificationCode,
      attempts: bioVerification.attempts
    });
    
    // Fetch user profile (mocked)
    const userProfile = await mockGetUserProfile(normalizedHandle);
    
    // Check if bio contains verification code (case insensitive)
    const bioText = (userProfile.description || '').trim();
    const expectedCode = bioVerification.verificationCode.trim();
    
    const bioContainsCode = bioText.toLowerCase().includes(expectedCode.toLowerCase());
    
    if (!bioContainsCode) {
      return NextResponse.json(
        { error: `Verification code "${bioVerification.verificationCode}" not found in Twitter bio. Please add the code to your bio and try again.` },
        { status: 400 }
      );
    }
    
    // Clean up bio verification
    bioVerifications.delete(bioKey);
    
    // Submit to Flare blockchain (mocked)
    const attestationData = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      verificationMethod: 'bio',
      verificationCode: bioVerification.verificationCode,
      userProfile,
      timestamp: Date.now()
    };
    
    const flareAttestation = await mockFlareAttestation(attestationData);
    
    // Store verification
    const verificationRecord = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      verificationMethod: 'bio',
      verificationCode: bioVerification.verificationCode,
      userProfile,
      flareAttestation,
      verified: true,
      verifiedAt: new Date().toISOString()
    };
    
    verifications.set(normalizedWallet, verificationRecord);
    
    console.log(`Bio verification completed for wallet: ${normalizedWallet}`);
    
    return NextResponse.json({
      success: true,
      message: 'Twitter account successfully verified via bio',
      verification: verificationRecord
    });
    
  } catch (error) {
    console.error('Error in bio verification completion:', error);
    return NextResponse.json(
      { error: `Bio verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 