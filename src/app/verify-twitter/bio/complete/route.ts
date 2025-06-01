import { NextRequest, NextResponse } from 'next/server';
import { 
  bioVerifications, 
  verifications, 
  validateWalletAddress, 
  validateTwitterHandle, 
  normalizeWalletAddress, 
  normalizeTwitterHandle,
  generateMockAttestation,
  alwaysSucceedInMockMode
} from '@/lib/shared-storage';

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
    
    // In mock mode, we can either succeed automatically or check for verification
    if (alwaysSucceedInMockMode && mockMode) {
      // Create a mock verification even if the code doesn't exist
      const mockCode = bioVerification?.verificationCode || 'MOCKCODE';
      
      // Clean up any existing bio verification
      if (bioVerification) {
        bioVerifications.delete(bioKey);
      }
      
      // Fetch user profile (mock)
      const userProfile = await mockGetUserProfile(normalizedHandle);
      
      // Create mock attestation
      const mockAttestation = generateMockAttestation();
      
      // Store verification
      const verificationRecord = {
        walletAddress: normalizedWallet,
        twitterHandle: normalizedHandle,
        verificationMethod: 'bio',
        verificationCode: mockCode,
        userProfile,
        flareAttestation: mockAttestation,
        verified: true,
        verifiedAt: new Date().toISOString()
      };
      
      verifications.set(normalizedWallet, verificationRecord);
      
      console.log(`Mock bio verification succeeded automatically for wallet: ${normalizedWallet}`);
      
      return NextResponse.json({
        success: true,
        message: 'Twitter account successfully verified via bio (mock mode)',
        verification: verificationRecord
      });
    }
    
    // Normal flow - check verification
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
    
    // Fetch user profile
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
    
    // Create mock attestation
    const attestation = generateMockAttestation();
    
    // Store verification
    const verificationRecord = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      verificationMethod: 'bio',
      verificationCode: bioVerification.verificationCode,
      userProfile,
      flareAttestation: attestation,
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