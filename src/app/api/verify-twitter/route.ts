import { NextRequest, NextResponse } from 'next/server';

// In a real implementation, this would be a database
// For now, we'll use a mock in-memory storage
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

const extractTweetId = (input: string): string | null => {
  // Handle direct tweet IDs
  if (/^\d+$/.test(input)) {
    return input;
  }
  
  // Extract from URLs (both twitter.com and x.com)
  const urlPattern = /(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/;
  const match = input.match(urlPattern);
  return match ? match[1] : null;
};

const normalizeWalletAddress = (address: string): string => {
  return address.toLowerCase();
};

const normalizeTwitterHandle = (handle: string): string => {
  return handle.replace('@', '').toLowerCase();
};

// Mock Twitter service (in a real implementation, this would use the Twitter API)
const mockGetTweetData = async (tweetId: string) => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
  
  return {
    id: tweetId,
    text: 'Verifying my wallet 0x742d35Cc6634C0532925a3b8138FB7C75B4Fc75e for AI ETF platform #FlareVerified #AIETF',
    user: {
      screen_name: 'cryptouser123',
      name: 'Crypto User',
      verified: false,
      followers_count: 1250
    },
    created_at: new Date().toISOString(),
    retweet_count: 0,
    favorite_count: 2
  };
};

// Mock Flare blockchain service
const mockFlareAttestation = async (attestationData: Record<string, unknown>) => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate blockchain delay
  
  console.log('Submitting attestation to Flare:', attestationData);
  
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
    const { walletAddress, twitterHandle, tweetId: rawTweetId } = await request.json();
    
    // Validation
    if (!walletAddress || !twitterHandle || !rawTweetId) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, twitterHandle, tweetId' },
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
    
    const tweetId = extractTweetId(rawTweetId);
    if (!tweetId) {
      return NextResponse.json(
        { error: 'Invalid tweet ID or URL format' },
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
    
    console.log(`Starting verification for wallet: ${normalizedWallet}, handle: @${normalizedHandle}, tweet: ${tweetId}`);
    
    // Fetch tweet data (mocked)
    const tweetData = await mockGetTweetData(tweetId);
    
    // Verify tweet content
    const tweetText = tweetData.text.toLowerCase();
    const walletInTweet = tweetText.includes(walletAddress.toLowerCase());
    const hasRequiredHashtags = tweetText.includes('#flareverified') && tweetText.includes('#aietf');
    
    if (!walletInTweet) {
      return NextResponse.json(
        { error: 'Tweet does not contain the specified wallet address' },
        { status: 400 }
      );
    }
    
    if (!hasRequiredHashtags) {
      return NextResponse.json(
        { error: 'Tweet must contain both #FlareVerified and #AIETF hashtags' },
        { status: 400 }
      );
    }
    
    // Submit to Flare blockchain (mocked)
    const attestationData = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      tweetId,
      verificationMethod: 'tweet',
      timestamp: Date.now()
    };
    
    const flareAttestation = await mockFlareAttestation(attestationData);
    
    // Store verification
    const verificationRecord = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      verificationMethod: 'tweet',
      tweetId,
      tweetData,
      flareAttestation,
      verified: true,
      verifiedAt: new Date().toISOString()
    };
    
    verifications.set(normalizedWallet, verificationRecord);
    
    console.log(`Verification completed for wallet: ${normalizedWallet}`);
    
    return NextResponse.json({
      success: true,
      message: 'Twitter account successfully verified via tweet',
      verification: verificationRecord
    });
    
  } catch (error) {
    console.error('Error in tweet verification:', error);
    return NextResponse.json(
      { error: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 