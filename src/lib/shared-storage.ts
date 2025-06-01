// Shared storage for verification API routes
// This simulates a database in mock mode

export interface BioVerification {
  walletAddress: string;
  twitterHandle: string;
  verificationCode: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export interface TweetData {
  id: string;
  text: string;
  user: {
    screen_name: string;
    name: string;
    verified: boolean;
    followers_count: number;
  };
  created_at: string;
  retweet_count: number;
  favorite_count: number;
}

export interface TwitterUserData {
  screen_name: string;
  name: string;
  description: string;
  verified: boolean;
  followers_count: number;
  following_count: number;
  location?: string;
}

export interface VerificationRecord {
  walletAddress: string;
  twitterHandle: string;
  verificationMethod: string;
  verified: boolean;
  verifiedAt: string;
  tweetId?: string;
  tweetData?: TweetData;
  userProfile?: TwitterUserData;
  flareAttestation?: {
    attestationId: string;
    txHash: string;
    merkleProof: string;
    consensusReached: boolean;
    validators: number;
  };
}

export interface PendingVerification {
  walletAddress: string;
  twitterHandle: string;
  codeVerifier: string;
  timestamp: number;
  expiresAt: number;
  personalizationId: string;
}

// Shared storage maps
export const bioVerifications = new Map<string, BioVerification>();
export const verifications = new Map<string, VerificationRecord>();
export const pendingVerifications = new Map<string, PendingVerification>();

// Helper functions
export const validateWalletAddress = (address: string): boolean => {
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(address);
};

export const validateTwitterHandle = (handle: string): boolean => {
  const cleanHandle = handle.replace('@', '');
  const pattern = /^[a-zA-Z0-9_]{1,15}$/;
  return pattern.test(cleanHandle);
};

export const normalizeWalletAddress = (address: string): string => {
  return address.toLowerCase();
};

export const normalizeTwitterHandle = (handle: string): string => {
  return handle.replace('@', '').toLowerCase();
};

// Mock data generators
export const generateMockAttestation = () => {
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

// Always succeed in mock mode for testing
export const alwaysSucceedInMockMode = true; 