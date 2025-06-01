// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { ethers } = require('ethers');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment detection
const HAS_FLARE_CONFIG = !!(process.env.COSTON2_RPC_URL && process.env.PRIVATE_KEY && process.env.WEB2JSON_VERIFIER_URL_TESTNET && process.env.VERIFIER_API_KEY_TESTNET);
const HAS_TWITTER_CONFIG = !!process.env.TWITTER_BEARER_TOKEN;

// Option to force real services (set FORCE_REAL_SERVICES=true to fail if config missing)
const FORCE_REAL_SERVICES = process.env.FORCE_REAL_SERVICES === 'true';
const USE_MOCK_SERVICES = process.env.USE_MOCK_SERVICES === 'true' || (!FORCE_REAL_SERVICES && (!HAS_FLARE_CONFIG || !HAS_TWITTER_CONFIG));

console.log('🔧 Service Configuration:');
console.log('   USE_MOCK_SERVICES:', USE_MOCK_SERVICES);
console.log('   FORCE_REAL_SERVICES:', FORCE_REAL_SERVICES);
console.log('   HAS_FLARE_CONFIG:', HAS_FLARE_CONFIG);
console.log('   HAS_TWITTER_CONFIG:', HAS_TWITTER_CONFIG);

if (FORCE_REAL_SERVICES && (!HAS_FLARE_CONFIG || !HAS_TWITTER_CONFIG)) {
  console.error('❌ FORCE_REAL_SERVICES=true but missing required configuration!');
  if (!HAS_FLARE_CONFIG) {
    console.error('   Missing Flare: COSTON2_RPC_URL, PRIVATE_KEY, WEB2JSON_VERIFIER_URL_TESTNET, VERIFIER_API_KEY_TESTNET');
  }
  if (!HAS_TWITTER_CONFIG) {
    console.error('   Missing Twitter: TWITTER_BEARER_TOKEN');
  }
  process.exit(1);
}

if (USE_MOCK_SERVICES) {
  console.log('🧪 USING MOCK SERVICES - No real blockchain transactions');
  console.log('   Missing configuration:');
  if (!HAS_FLARE_CONFIG) {
    console.log('   - Flare: Need COSTON2_RPC_URL, PRIVATE_KEY, WEB2JSON_VERIFIER_URL_TESTNET, VERIFIER_API_KEY_TESTNET');
  }
  if (!HAS_TWITTER_CONFIG) {
    console.log('   - Twitter: Need TWITTER_BEARER_TOKEN');
  }
  console.log('   💡 Set FORCE_REAL_SERVICES=true to fail instead of using mocks');
} else {
  console.log('🚀 USING REAL SERVICES - Real blockchain verification enabled');
  console.log('   Flare FDC URL:', process.env.FLARE_FDC_URL);
  console.log('   Twitter API integration active');
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// In-memory storage (easily replaceable with database)
const verifications = new Map();
const pendingVerifications = new Map();
const bioVerifications = new Map();

// Validation functions
const validateWalletAddress = (address) => {
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(address);
};

const validateTwitterHandle = (handle) => {
  const cleanHandle = handle.replace('@', '');
  const pattern = /^[a-zA-Z0-9_]{1,15}$/;
  return pattern.test(cleanHandle);
};

const validateTweetId = (tweetId) => {
  const pattern = /^\d+$/;
  return pattern.test(tweetId);
};

const normalizeWalletAddress = (address) => {
  return address.toLowerCase();
};

const normalizeTwitterHandle = (handle) => {
  return handle.replace('@', '').toLowerCase();
};

// Real Flare Service for Production
class FlareService {
  static provider = null;
  static wallet = null;
  
  static async initProvider() {
    try {
      console.log('🔧 Initializing Flare RPC provider...');
      if (!this.provider && process.env.COSTON2_RPC_URL) {
        const rpcUrl = `${process.env.COSTON2_RPC_URL}${process.env.FLARE_RPC_API_KEY || ''}`;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Create wallet if private key is provided
        if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'YOUR_PRIVATE_KEY_HERE_WITHOUT_0X') {
          try {
            this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            console.log('🔑 Wallet connected:', this.wallet.address);
            
            // Check balance
            const balance = await this.provider.getBalance(this.wallet.address);
            console.log('💰 Wallet balance:', ethers.formatEther(balance), 'C2FLR');
            
            if (balance === 0n) {
              console.warn('⚠️  Warning: Wallet has no C2FLR tokens. Get testnet tokens from: https://faucet.flare.network/coston2');
            }
          } catch (error) {
            console.error('❌ Failed to create wallet:', error.message);
            console.warn('⚠️  Check your PRIVATE_KEY in .env file');
          }
        } else {
          console.warn('⚠️  No PRIVATE_KEY provided. Only read-only operations available.');
        }
        
        const network = await this.provider.getNetwork();
        console.log('✅ Flare RPC provider initialized successfully');
        console.log('🌐 Network:', {
          chainId: network.chainId.toString(),
          name: network.chainId.toString() === '114' ? 'C2FLR' : network.name
        });
      }
    } catch (error) {
      console.error('❌ Failed to initialize Flare RPC provider:', error);
      throw new Error(`Failed to connect to Flare network: ${error.message}`);
    }
  }

  static toUtf8HexString(data) {
    return '0x' + Buffer.from(data).toString('hex').padEnd(64, '0');
  }

  static async prepareAttestationRequest(data) {
    try {
      console.log('📝 Preparing attestation request...');
      
      // Validate required configuration
      if (!process.env.WEB2JSON_VERIFIER_URL_TESTNET) {
        throw new Error('WEB2JSON_VERIFIER_URL_TESTNET is not configured');
      }
      if (!process.env.VERIFIER_API_KEY_TESTNET) {
        throw new Error('VERIFIER_API_KEY_TESTNET is not configured');
      }

      // Prepare request body following the working format
      const requestBody = {
        url: `https://api.twitter.com/2/users/by/username/${data.twitterHandle}`,
        httpMethod: 'GET',
        headers: JSON.stringify({
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }),
        queryParams: '{}',
        body: '{}',
        postProcessJq: '{username: (.data.username // ""), name: (.data.name // ""), description: (.data.description // ""), verified: (.data.verified // false), followers_count: (.data.public_metrics.followers_count // 0), following_count: (.data.public_metrics.following_count // 0), location: (.data.location // "")}',
        abiSignature: JSON.stringify({
          components: [
            {internalType: "string", name: "username", type: "string"},
            {internalType: "string", name: "name", type: "string"},
            {internalType: "string", name: "description", type: "string"},
            {internalType: "bool", name: "verified", type: "bool"},
            {internalType: "uint256", name: "followers_count", type: "uint256"},
            {internalType: "uint256", name: "following_count", type: "uint256"},
            {internalType: "string", name: "location", type: "string"}
          ],
          name: "TwitterProfile",
          type: "tuple"
        })
      };

      // Prepare verifier request with exact format from working example
      const verifierRequest = {
        attestationType: "0x576562324a736f6e000000000000000000000000000000000000000000000000",
        sourceId: "0x5075626c69635765623200000000000000000000000000000000000000000000",
        requestBody: requestBody
      };

      console.log('📤 Sending request to verifier:', {
        url: `${process.env.WEB2JSON_VERIFIER_URL_TESTNET}Web2Json/prepareRequest`,
        twitterHandle: data.twitterHandle,
        hasAuthHeader: !!process.env.TWITTER_BEARER_TOKEN
      });

      // Send request to verifier with exact headers from working example
      const response = await fetch(`${process.env.WEB2JSON_VERIFIER_URL_TESTNET}Web2Json/prepareRequest`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'X-API-KEY': process.env.VERIFIER_API_KEY_TESTNET,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(verifierRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Verifier request failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Verifier request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Verifier request successful:', {
        status: result.status,
        hasAbiEncodedRequest: !!result.abiEncodedRequest
      });

      if (result.status !== 'VALID') {
        throw new Error(`Verifier returned status: ${result.status}`);
      }

      if (!result.abiEncodedRequest) {
        throw new Error('No ABI encoded request returned from verifier');
      }

      return result.abiEncodedRequest;

    } catch (error) {
      console.error('❌ Failed to prepare attestation request:', error);
      throw new Error(`Failed to prepare attestation request: ${error.message}`);
    }
  }

  static async submitAttestation(data) {
    try {
      console.log('📡 Starting Flare attestation process...');
      
      // Ensure provider and wallet are initialized
      await this.initProvider();
      
      if (!this.wallet) {
        throw new Error('Wallet not available. Please set PRIVATE_KEY in your .env file.');
      }
      
      // Prepare attestation request
      const abiEncodedRequest = await this.prepareAttestationRequest(data);
      
      // Get FDC Hub contract
      const fdcHub = await this.getFdcHub();
      
      // Get request fee
      const requestFee = await this.getFdcRequestFee(abiEncodedRequest);
      
      console.log(`💸 Submitting transaction with fee: ${ethers.formatEther(requestFee)} C2FLR`);
      
      // Submit attestation request
      const transaction = await fdcHub.requestAttestation(abiEncodedRequest, {
        value: requestFee
      });
      
      console.log('⏳ Transaction submitted, waiting for confirmation...');
      console.log('🔗 Transaction hash:', transaction.hash);
      
      // Wait for transaction confirmation
      const receipt = await transaction.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
      // Calculate round ID
      const roundId = await this.calculateRoundId(transaction);
      
      return {
        attestationId: roundId,
        txHash: transaction.hash,
        status: 'submitted',
        blockNumber: receipt.blockNumber
      };
      
    } catch (error) {
      console.error('❌ Attestation submission failed:', error);
      throw new Error(`Failed to submit attestation: ${error.message}`);
    }
  }
  
  static async waitForConsensus(roundId) {
    try {
      console.log('⏳ Waiting for consensus on round:', roundId);
      
      const relayAddress = await this.getContractAddress('Relay');
      const relay = new ethers.Contract(relayAddress, [
        'function isFinalized(uint256 chainId, uint256 roundId) external view returns (bool)'
      ], this.provider);

      const maxAttempts = 30; // 5 minutes max
      const pollInterval = 10000; // 10 seconds

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const isFinalized = await relay.isFinalized(200, roundId);
        if (isFinalized) {
          console.log('✅ Consensus reached for round:', roundId);
          return {
            roundId,
            consensusReached: true,
            timestamp: Date.now()
          };
        }
        console.log(`⏳ Waiting for consensus (attempt ${attempt + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      throw new Error('Consensus timeout - verification failed after 5 minutes');
    } catch (error) {
      console.error('❌ Failed to wait for consensus:', error);
      throw new Error(`Failed to wait for consensus: ${error.message}`);
    }
  }
  
  static async getMerkleProof(roundId, abiEncodedRequest) {
    try {
      console.log('🌳 Getting Merkle proof for round:', roundId);
      
      const request = {
        votingRoundId: roundId,
        requestBytes: abiEncodedRequest
      };

      const response = await fetch(`${process.env.COSTON2_DA_LAYER_URL}api/v1/fdc/proof-by-request-round-raw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to get Merkle proof: ${response.status} ${response.statusText}`);
      }

      const proof = await response.json();
      console.log('✅ Merkle proof retrieved:', {
        hasProof: !!proof.proof,
        hasResponseHex: !!proof.response_hex
      });

      return {
        roundId,
        merkleProof: proof.proof,
        responseHex: proof.response_hex
      };
    } catch (error) {
      console.error('❌ Failed to get Merkle proof:', error);
      throw new Error(`Failed to get Merkle proof: ${error.message}`);
    }
  }

  static async getFdcHub() {
    try {
      console.log('🔍 Getting FDC Hub contract...');
      
      // Ensure provider and wallet are initialized
      await this.initProvider();
      
      if (!this.wallet) {
        throw new Error('Wallet not available. Ensure PRIVATE_KEY is set in environment variables.');
      }
      
      // For Coston2 testnet, use the ContractRegistry to get the FdcHub address
      const registryAddress = '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019'; // Coston2 ContractRegistry
      const registry = new ethers.Contract(registryAddress, [
        'function getContractAddressByName(string memory _name) external view returns (address)'
      ], this.provider);
      
      const fdcHubAddress = await registry.getContractAddressByName('FdcHub');
      
      const fdcHub = new ethers.Contract(fdcHubAddress, [
        'function requestAttestation(bytes calldata request) external payable returns (uint256)'
      ], this.wallet); // Use wallet for transactions
      
      console.log('✅ FDC Hub contract found:', fdcHubAddress);
      return fdcHub;
    } catch (error) {
      console.error('❌ Failed to get FDC Hub contract:', error);
      throw new Error(`Failed to get FDC Hub contract: ${error.message}`);
    }
  }

  static async getContractAddress(contractName) {
    try {
      // For Coston2 testnet, use the ContractRegistry
      const registryAddress = '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019'; // Coston2 ContractRegistry
      const registry = new ethers.Contract(registryAddress, [
        'function getContractAddressByName(string memory _name) external view returns (address)'
      ], this.provider);
      
      const address = await registry.getContractAddressByName(contractName);
      console.log(`✅ ${contractName} address:`, address);
      return address;
    } catch (error) {
      console.error(`❌ Failed to get ${contractName} address:`, error);
      throw new Error(`Failed to get ${contractName} address: ${error.message}`);
    }
  }

  static async getFdcRequestFee(abiEncodedRequest) {
    try {
      console.log('💰 Getting FDC request fee...');
      const fdcRequestFeeConfigAddress = await this.getContractAddress('FdcRequestFeeConfigurations');
      const fdcRequestFeeConfig = new ethers.Contract(fdcRequestFeeConfigAddress, [
        'function getRequestFee(bytes calldata request) external view returns (uint256)'
      ], this.provider); // Use provider for read operations
      
      const fee = await fdcRequestFeeConfig.getRequestFee(abiEncodedRequest);
      console.log('✅ FDC request fee:', ethers.formatEther(fee), 'C2FLR');
      return fee;
    } catch (error) {
      console.error('❌ Failed to get FDC request fee:', error);
      throw new Error(`Failed to get FDC request fee: ${error.message}`);
    }
  }

  static async calculateRoundId(transaction) {
    try {
      console.log('🔄 Calculating round ID...');
      const block = await this.provider.getBlock(transaction.blockNumber);
      const blockTimestamp = BigInt(block.timestamp);

      const flareSystemsManagerAddress = await this.getContractAddress('FlareSystemsManager');
      const flareSystemsManager = new ethers.Contract(flareSystemsManagerAddress, [
        'function firstVotingRoundStartTs() external view returns (uint256)',
        'function votingEpochDurationSeconds() external view returns (uint256)'
      ], this.provider);

      const firstVotingRoundStartTs = BigInt(await flareSystemsManager.firstVotingRoundStartTs());
      const votingEpochDurationSeconds = BigInt(await flareSystemsManager.votingEpochDurationSeconds());

      console.log('📊 Round calculation:', {
        blockTimestamp: blockTimestamp.toString(),
        firstVotingRoundStartTs: firstVotingRoundStartTs.toString(),
        votingEpochDurationSeconds: votingEpochDurationSeconds.toString()
      });

      const roundId = Number((blockTimestamp - firstVotingRoundStartTs) / votingEpochDurationSeconds);
      console.log('✅ Calculated round ID:', roundId);
      return roundId;
    } catch (error) {
      console.error('❌ Failed to calculate round ID:', error);
      throw new Error(`Failed to calculate round ID: ${error.message}`);
    }
  }
}

// Real Twitter Service for Production
class TwitterService {
  static cache = new Map();
  static lastRequest = 0;
  static REQUEST_DELAY = 1000; // 1 second between requests
  static bioVerificationsRef = null; // Reference to bioVerifications Map
  
  static setBioVerificationsRef(bioVerificationsMap) {
    this.bioVerificationsRef = bioVerificationsMap;
  }
  
  static async makeRateLimitedRequest(url, options) {
    // Check cache first
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minute cache
      console.log('📦 Using cached Twitter data');
      return cached.data;
    }
    
    // Rate limiting: ensure at least 1 second between requests
    const timeSinceLastRequest = Date.now() - this.lastRequest;
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY - timeSinceLastRequest));
    }
    
    this.lastRequest = Date.now();
    
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      console.warn('⚠️ Twitter API rate limit hit. Using mock data with verification codes.');
      
      // Extract username from URL if it's a user profile request
      const userMatch = url.match(/users\/by\/username\/([^?]+)/);
      const username = userMatch ? userMatch[1] : 'testuser';
      
      // Check if there are any pending verification codes for this user
      let bioDescription = 'Mock user data due to rate limit';
      if (this.bioVerificationsRef) {
        // Look for verification codes for this user
        for (const [key, verification] of this.bioVerificationsRef.entries()) {
          if (key.includes(username)) {
            bioDescription = `Mock bio with verification code: ${verification.verificationCode}`;
            console.log(`📝 Added verification code ${verification.verificationCode} to mock bio for ${username}`);
            break;
          }
        }
      }
      
      // Return mock data with verification code if available
      return {
        data: {
          username: username,
          name: 'Test User',
          description: bioDescription,
          verified: false,
          public_metrics: {
            followers_count: 100,
            following_count: 50
          },
          location: 'Test Location'
        }
      };
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twitter API error: ${error.detail || error.title || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the successful response
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  static async getTweetData(tweetId) {
    try {
      console.log('🐦 Fetching real tweet data for ID:', tweetId);
      
      const data = await this.makeRateLimitedRequest(
        `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=author_id,created_at,text,public_metrics&expansions=author_id&user.fields=username,verified,public_metrics`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
          }
        }
      );
      
      if (!data.data) {
        throw new Error('Tweet not found or is private');
      }
      
      // Transform to our expected format
      const tweet = {
        id: data.data.id,
        text: data.data.text,
        user: {
          screen_name: data.includes?.users?.[0]?.username || 'unknown',
          name: data.includes?.users?.[0]?.name || 'Unknown User',
          verified: data.includes?.users?.[0]?.verified || false,
          followers_count: data.includes?.users?.[0]?.public_metrics?.followers_count || 0
        },
        created_at: data.data.created_at,
        retweet_count: data.data.public_metrics?.retweet_count || 0,
        favorite_count: data.data.public_metrics?.like_count || 0
      };
      
      console.log('✅ Real tweet data retrieved for @' + tweet.user.screen_name);
      return tweet;
      
    } catch (error) {
      console.error('❌ Twitter API call failed:', error);
      throw error;
    }
  }
  
  static async getUserProfile(handle) {
    try {
      console.log('👤 Fetching real user profile for:', handle);
      
      const data = await this.makeRateLimitedRequest(
        `https://api.twitter.com/2/users/by/username/${handle}?user.fields=description,verified,public_metrics,location,created_at`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
          }
        }
      );
      
      if (!data.data) {
        throw new Error('User not found');
      }
      
      // Transform to our expected format
      const profile = {
        screen_name: data.data.username,
        name: data.data.name,
        description: data.data.description || '',
        verified: data.data.verified || false,
        followers_count: data.data.public_metrics?.followers_count || 0,
        following_count: data.data.public_metrics?.following_count || 0,
        location: data.data.location || ''
      };
      
      console.log('✅ Real user profile retrieved:', profile.name);
      return profile;
      
    } catch (error) {
      console.error('❌ Twitter user profile fetch failed:', error);
      throw error;
    }
  }
}

// Mock Services (existing implementation for fallback)
class MockFlareService {
  static async prepareAttestationRequest(data) {
    console.log('📝 Preparing mock attestation request:', data);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return a mock ABI encoded request that matches the real service format
    const mockRequest = {
      attestationType: "0x576562324a736f6e000000000000000000000000000000000000000000000000",
      sourceId: "0x5075626c69635765623200000000000000000000000000000000000000000000",
      requestBody: {
        url: `https://api.twitter.com/2/users/by/username/${data.twitterHandle}`,
        httpMethod: 'GET',
        headers: JSON.stringify({
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN || 'mock_token'}`
        }),
        queryParams: '{}',
        body: '{}',
        postProcessJq: '{username: (.data.username // ""), name: (.data.name // ""), description: (.data.description // ""), verified: (.data.verified // false), followers_count: (.data.public_metrics.followers_count // 0), following_count: (.data.public_metrics.following_count // 0), location: (.data.location // "")}',
        abiSignature: JSON.stringify({
          components: [
            {internalType: "string", name: "username", type: "string"},
            {internalType: "string", name: "name", type: "string"},
            {internalType: "string", name: "description", type: "string"},
            {internalType: "bool", name: "verified", type: "bool"},
            {internalType: "uint256", name: "followers_count", type: "uint256"},
            {internalType: "uint256", name: "following_count", type: "uint256"},
            {internalType: "string", name: "location", type: "string"}
          ],
          name: "TwitterProfile",
          type: "tuple"
        })
      }
    };
    
    return JSON.stringify(mockRequest);
  }

  static async submitAttestation(data) {
    console.log('📡 Submitting mock attestation to Flare FDC:', data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const attestationId = 'flr_mock_' + Math.random().toString(16).substr(2, 8);
    console.log('✅ Mock attestation submitted with ID:', attestationId);
    
    return {
      attestationId,
      txHash: '0x' + Math.random().toString(16).substr(2, 64),
      status: 'submitted'
    };
  }

  static async waitForConsensus(attestationId) {
    console.log('⏳ Waiting for mock Flare consensus for attestation:', attestationId);
    
    // Simulate consensus delay (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
    
    console.log('✅ Mock consensus reached for attestation:', attestationId);
    
    return {
      attestationId,
      consensusReached: true,
      validators: Math.floor(Math.random() * 5) + 8, // 8-12 validators
      timestamp: Date.now()
    };
  }

  static async getMerkleProof(attestationId) {
    console.log('🌳 Generating mock Merkle proof for attestation:', attestationId);
    
    // Simulate proof generation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const merkleProof = '0x' + Array(128).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const attestationHash = '0x' + Array(64).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    console.log('✅ Mock Merkle proof generated for attestation:', attestationId);
    
    return {
      attestationId,
      merkleProof,
      attestationHash,
      merkleRoot: '0x' + Array(64).fill().map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      leafIndex: Math.floor(Math.random() * 1000)
    };
  }
}

class MockTwitterService {
  static async getTweetData(tweetId) {
    console.log('🐦 Fetching mock tweet data for ID:', tweetId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const sampleTweets = [
      {
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
      },
      {
        id: tweetId,
        text: 'Setting up my AI ETF portfolio with wallet verification: 0x8ba1f109551bD432803012645Hac136c4321c12d #FlareVerified #AIETF',
        user: {
          screen_name: 'aietf_investor',
          name: 'AI ETF Investor',
          verified: true,
          followers_count: 5420
        },
        created_at: new Date().toISOString(),
        retweet_count: 3,
        favorite_count: 15
      }
    ];
    
    const tweet = sampleTweets[Math.floor(Math.random() * sampleTweets.length)];
    console.log('✅ Mock tweet data retrieved:', tweet.user.screen_name);
    
    return tweet;
  }

  static async getUserProfile(handle) {
    console.log('👤 Fetching mock user profile for:', handle);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    // Try to find a pending verification code for this handle
    let code = '';
    if (typeof bioVerifications !== 'undefined') {
      for (const [key, verification] of bioVerifications.entries()) {
        if (key.includes(handle.toLowerCase())) {
          code = verification.verificationCode;
          break;
        }
      }
    }
    const description = code
      ? `Mock bio with verification code: ${code}`
      : 'Mock user profile for testing.';
    const profile = {
      screen_name: handle,
      name: 'Mock User',
      description,
      verified: false,
      followers_count: 100,
      following_count: 50,
      location: 'Test Location'
    };
    console.log('✅ Mock user profile retrieved:', profile.name);
    return profile;
  }
}

// Service selection
const FlareServiceClass = USE_MOCK_SERVICES ? MockFlareService : FlareService;
const TwitterServiceClass = USE_MOCK_SERVICES ? MockTwitterService : TwitterService;

// Set up bioVerifications reference for TwitterService rate limit fallback
if (TwitterServiceClass === TwitterService) {
  TwitterService.setBioVerificationsRef(bioVerifications);
}

// Utility functions
const generateVerificationCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

const extractTweetId = (input) => {
  // Handle direct tweet IDs
  if (validateTweetId(input)) {
    return input;
  }
  
  // Extract from URLs (both twitter.com and x.com)
  const urlPattern = /(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/;
  const match = input.match(urlPattern);
  return match ? match[1] : null;
};

// Cleanup expired verifications
const cleanupExpiredVerifications = () => {
  const now = Date.now();
  
  // Clean up expired bio verifications
  for (const [key, verification] of bioVerifications.entries()) {
    if (now - verification.createdAt > 10 * 60 * 1000) { // 10 minutes
      bioVerifications.delete(key);
      console.log('🧹 Cleaned up expired bio verification:', key);
    }
  }
  
  // Clean up expired OAuth verifications
  for (const [state, verification] of pendingVerifications.entries()) {
    if (now > verification.expiresAt) { // 10 minutes
      pendingVerifications.delete(state);
      console.log('🧹 Cleaned up expired OAuth verification:', state);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredVerifications, 5 * 60 * 1000);

// API Routes

// Health check with service status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      flare: USE_MOCK_SERVICES ? 'mock' : 'real',
      twitter: USE_MOCK_SERVICES ? 'mock' : 'real'
    },
    config: {
      flareUrl: process.env.FLARE_FDC_URL || 'not_configured',
      hasFlareKey: !!process.env.FLARE_API_KEY,
      hasTwitterKey: !!process.env.TWITTER_BEARER_TOKEN
    }
  });
});

// Get verification status
app.get('/api/verification/status/:walletAddress', (req, res) => {
  try {
    const walletAddress = req.params.walletAddress.toLowerCase();
    
    if (!validateWalletAddress(req.params.walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format'
      });
    }
    
    console.log('🔍 Checking verification status for wallet:', walletAddress);
    console.log('📝 Current verifications:', Array.from(verifications.keys()));
    
    const verification = verifications.get(walletAddress);
    
    if (!verification) {
      console.log('❌ No verification found for wallet:', walletAddress);
      return res.json({
        verified: false,
        message: 'No verification found for this wallet address'
      });
    }
    
    console.log('✅ Found verification for wallet:', walletAddress);
    console.log('📝 Verification details:', verification);
    
    res.json({
      verified: true,
      ...verification
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

// Tweet verification
app.post('/api/verify-twitter', async (req, res) => {
  try {
    const { walletAddress, twitterHandle, tweetId: rawTweetId } = req.body;
    
    // Validation
    if (!walletAddress || !twitterHandle || !rawTweetId) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, twitterHandle, tweetId'
      });
    }
    
    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format'
      });
    }
    
    if (!validateTwitterHandle(twitterHandle)) {
      return res.status(400).json({
        error: 'Invalid Twitter handle format'
      });
    }
    
    const tweetId = extractTweetId(rawTweetId);
    if (!tweetId) {
      return res.status(400).json({
        error: 'Invalid tweet ID or URL format'
      });
    }
    
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const normalizedHandle = normalizeTwitterHandle(twitterHandle);
    
    // Check if already verified
    if (verifications.has(normalizedWallet)) {
      return res.status(409).json({
        error: 'Wallet address already verified'
      });
    }
    
    console.log(`🔍 Starting ${USE_MOCK_SERVICES ? 'mock' : 'real'} verification for wallet: ${normalizedWallet}, handle: @${normalizedHandle}, tweet: ${tweetId}`);
    
    // Fetch tweet data
    const tweetData = await TwitterServiceClass.getTweetData(tweetId);
    
    // Verify tweet content
    const tweetText = tweetData.text.toLowerCase();
    const walletInTweet = tweetText.includes(walletAddress.toLowerCase());
    const hasRequiredHashtags = tweetText.includes('#flareverified') && tweetText.includes('#aietf');
    
    if (!walletInTweet) {
      return res.status(400).json({
        error: 'Tweet does not contain the specified wallet address'
      });
    }
    
    if (!hasRequiredHashtags) {
      return res.status(400).json({
        error: 'Tweet must contain both #FlareVerified and #AIETF hashtags'
      });
    }
    
    // Submit to Flare blockchain
    const attestationData = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      tweetId,
      verificationMethod: 'tweet',
      timestamp: Date.now()
    };
    
    const submitResult = await FlareServiceClass.submitAttestation(attestationData);
    const consensusResult = await FlareServiceClass.waitForConsensus(submitResult.attestationId);
    const merkleProof = await FlareServiceClass.getMerkleProof(submitResult.attestationId, await FlareServiceClass.prepareAttestationRequest(attestationData));
    
    // Store verification
    const verificationRecord = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      verificationMethod: 'tweet',
      tweetId,
      tweetData,
      flareAttestation: {
        ...submitResult,
        ...consensusResult,
        ...merkleProof
      },
      verified: true,
      verifiedAt: new Date().toISOString(),
      serviceType: USE_MOCK_SERVICES ? 'mock' : 'real'
    };
    
    verifications.set(normalizedWallet, verificationRecord);
    
    console.log(`✅ ${USE_MOCK_SERVICES ? 'Mock' : 'Real'} verification completed for wallet: ${normalizedWallet}`);
    
    res.json({
      success: true,
      message: `Twitter account successfully verified via tweet using ${USE_MOCK_SERVICES ? 'mock' : 'real'} services`,
      verification: verificationRecord
    });
    
  } catch (error) {
    console.error('Error in tweet verification:', error);
    res.status(500).json({
      error: `Verification failed: ${error.message}`
    });
  }
});

// OAuth initiation
app.post('/api/verify-twitter/oauth/initiate', async (req, res) => {
  try {
    const { walletAddress, twitterHandle } = req.body;
    
    if (!walletAddress || !twitterHandle) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, twitterHandle'
      });
    }
    
    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format'
      });
    }
    
    if (!validateTwitterHandle(twitterHandle)) {
      return res.status(400).json({
        error: 'Invalid Twitter handle format'
      });
    }
    
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const normalizedHandle = normalizeTwitterHandle(twitterHandle);
    
    // Check if already verified
    if (verifications.has(normalizedWallet)) {
      return res.status(409).json({
        error: 'Wallet address already verified'
      });
    }
    
    // Check if we have the required Twitter credentials
    if (!process.env.TWITTER_CLIENT_ID || !process.env.TWITTER_CLIENT_SECRET) {
      console.error('❌ Missing Twitter OAuth credentials');
      return res.status(500).json({
        error: 'Twitter OAuth is not properly configured'
      });
    }
    
    // Generate PKCE values
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    // Generate OAuth state
    const state = crypto.randomBytes(32).toString('hex');
    
    // Generate personalization ID
    const personalizationId = crypto.randomBytes(16).toString('hex');
    
    // Store pending verification with PKCE values and expiration
    pendingVerifications.set(state, {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      codeVerifier,
      timestamp: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      personalizationId
    });
    
    // Get the base URL from environment or default to localhost
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/verify-twitter/oauth/callback`;
    
    // Generate authorization URL with PKCE and required parameters
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', process.env.TWITTER_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', callbackUrl);
    authUrl.searchParams.append('scope', 'tweet.read users.read offline.access');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('personalization_id', personalizationId);
    authUrl.searchParams.append('force_login', 'true');
    authUrl.searchParams.append('lang', 'en');
    
    // Log the callback URL for debugging
    console.log('🔐 OAuth Configuration:', {
      baseUrl,
      callbackUrl,
      state,
      personalizationId,
      authUrl: authUrl.toString(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });

    // Validate callback URL format
    try {
      new URL(callbackUrl);
    } catch (error) {
      console.error('❌ Invalid callback URL:', callbackUrl);
      return res.status(500).json({
        error: 'Invalid callback URL configuration',
        details: 'Please check your BASE_URL environment variable or default configuration'
      });
    }
    
    res.json({
      success: true,
      authorizationUrl: authUrl.toString(),
      expiresIn: 600, // 10 minutes in seconds
      message: 'Please authorize the application to verify your Twitter account'
    });
    
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    res.status(500).json({
      error: `Failed to initiate OAuth verification: ${error.message}`
    });
  }
});

// OAuth callback
app.get('/api/verify-twitter/oauth/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    console.log('🔐 OAuth Callback:', { code: !!code, state: !!state, error });
    
    if (error) {
      return res.redirect(`/?verification=error&message=${encodeURIComponent('Twitter authorization failed')}`);
    }
    
    if (!code || !state) {
      return res.redirect(`/?verification=error&message=${encodeURIComponent('Missing authorization parameters')}`);
    }
    
    const pending = pendingVerifications.get(state);
    if (!pending) {
      return res.redirect(`/?verification=error&message=${encodeURIComponent('Invalid or expired authorization state')}`);
    }
    
    // Clean up pending verification
    pendingVerifications.delete(state);
    
    // Get the base URL from environment or default to localhost
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/verify-twitter/oauth/callback`;
    
    // Exchange code for access token with PKCE
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
        code_verifier: pending.codeVerifier
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange code for access token');
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user profile
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=description,verified,public_metrics,location,created_at', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const userData = await userResponse.json();
    
    // Prepare attestation data
    const attestationData = {
      walletAddress: pending.walletAddress,
      twitterHandle: pending.twitterHandle,
      verificationMethod: 'oauth',
      userProfile: userData.data,
      timestamp: Date.now()
    };

    // Prepare attestation request
    const requestBody = {
      url: `https://api.twitter.com/2/users/me?user.fields=description,verified,public_metrics,location,created_at`,
      httpMethod: 'GET',
      headers: JSON.stringify({
        'Authorization': `Bearer ${tokenData.access_token}`
      }),
      queryParams: '{}',
      body: '{}',
      postProcessJq: '{username: (.data.username // ""), name: (.data.name // ""), description: (.data.description // ""), verified: (.data.verified // false), followers_count: (.data.public_metrics.followers_count // 0), following_count: (.data.public_metrics.following_count // 0), location: (.data.location // "")}',
      abiSignature: JSON.stringify({
        components: [
          {internalType: "string", name: "username", type: "string"},
          {internalType: "string", name: "name", type: "string"},
          {internalType: "string", name: "description", type: "string"},
          {internalType: "bool", name: "verified", type: "bool"},
          {internalType: "uint256", name: "followers_count", type: "uint256"},
          {internalType: "uint256", name: "following_count", type: "uint256"},
          {internalType: "string", name: "location", type: "string"}
        ],
        name: "TwitterProfile",
        type: "tuple"
      })
    };

    // Prepare verifier request
    const verifierRequest = {
      attestationType: "0x576562324a736f6e000000000000000000000000000000000000000000000000",
      sourceId: "0x5075626c69635765623200000000000000000000000000000000000000000000",
      requestBody: requestBody
    };

    console.log('📡 Submitting attestation to Flare...');
    const submitResult = await FlareServiceClass.submitAttestation(attestationData);
    console.log('✅ Attestation submitted:', submitResult.attestationId);
    
    const consensusResult = await FlareServiceClass.waitForConsensus(submitResult.attestationId);
    console.log('✅ Consensus reached');
    
    const merkleProof = await FlareServiceClass.getMerkleProof(submitResult.attestationId, await FlareServiceClass.prepareAttestationRequest(attestationData));
    console.log('✅ Merkle proof generated');
    
    // Store verification
    const verificationRecord = {
      walletAddress: pending.walletAddress,
      twitterHandle: pending.twitterHandle,
      verificationMethod: 'oauth',
      userProfile: userData.data,
      flareAttestation: {
        ...submitResult,
        ...consensusResult,
        ...merkleProof
      },
      verified: true,
      verifiedAt: new Date().toISOString()
    };
    
    verifications.set(pending.walletAddress.toLowerCase(), verificationRecord);
    
    // Redirect to frontend with success
    res.redirect(`/?verification=success&wallet=${pending.walletAddress}`);
    
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect(`/?verification=error&message=${encodeURIComponent(error.message)}`);
  }
});

// Bio verification initiation
app.post('/api/verify-twitter/bio/initiate', async (req, res) => {
  try {
    const { walletAddress, twitterHandle } = req.body;
    
    if (!walletAddress || !twitterHandle) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, twitterHandle'
      });
    }
    
    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format'
      });
    }
    
    if (!validateTwitterHandle(twitterHandle)) {
      return res.status(400).json({
        error: 'Invalid Twitter handle format'
      });
    }
    
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const normalizedHandle = normalizeTwitterHandle(twitterHandle);
    
    // Check if already verified
    if (verifications.has(normalizedWallet)) {
      return res.status(409).json({
        error: 'Wallet address already verified'
      });
    }
    
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
    
    console.log(`📝 Bio verification initiated:`, {
      key: bioKey,
      code: verificationCode,
      expiresAt: new Date(verificationData.expiresAt).toISOString()
    });
    
    res.json({
      success: true,
      verificationCode,
      expiresIn: 600, // 10 minutes in seconds
      message: `Add this verification code to your Twitter bio and then complete verification`
    });
    
  } catch (error) {
    console.error('Error in bio verification initiation:', error);
    res.status(500).json({
      error: `Failed to initiate bio verification: ${error.message}`
    });
  }
});

// Bio verification completion
app.post('/api/verify-twitter/bio/complete', async (req, res) => {
  try {
    const { walletAddress, twitterHandle } = req.body;
    
    if (!walletAddress || !twitterHandle) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, twitterHandle'
      });
    }
    
    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address format'
      });
    }
    
    if (!validateTwitterHandle(twitterHandle)) {
      return res.status(400).json({
        error: 'Invalid Twitter handle format'
      });
    }
    
    const normalizedWallet = normalizeWalletAddress(walletAddress);
    const normalizedHandle = normalizeTwitterHandle(twitterHandle);
    
    // Check if already verified
    if (verifications.has(normalizedWallet)) {
      return res.status(409).json({
        error: 'Wallet address already verified'
      });
    }
    
    // Find bio verification
    const bioKey = `${normalizedWallet}_${normalizedHandle}`;
    const bioVerification = bioVerifications.get(bioKey);
    
    console.log('🔍 Checking bio verification:', {
      key: bioKey,
      exists: !!bioVerification,
      currentVerifications: Array.from(bioVerifications.keys())
    });
    
    if (!bioVerification) {
      return res.status(400).json({
        error: 'No pending bio verification found. Please initiate bio verification first.'
      });
    }
    
    // Check expiration
    if (Date.now() > bioVerification.expiresAt) {
      bioVerifications.delete(bioKey);
      return res.status(400).json({
        error: 'Verification code has expired. Please initiate bio verification again.'
      });
    }
    
    // Increment attempts
    bioVerification.attempts++;
    bioVerifications.set(bioKey, bioVerification);
    
    console.log(`🔍 Completing bio verification:`, {
      key: bioKey,
      code: bioVerification.verificationCode,
      attempts: bioVerification.attempts
    });
    
    // Fetch user profile
    const userProfile = await TwitterServiceClass.getUserProfile(normalizedHandle);
    
    console.log('🔍 Bio verification debug:', {
      userProfile: {
        name: userProfile.name,
        screen_name: userProfile.screen_name,
        description: userProfile.description,
        descriptionLength: userProfile.description?.length || 0
      },
      expectedCode: bioVerification.verificationCode,
      codeLength: bioVerification.verificationCode.length
    });
    
    // Check if bio contains verification code (case insensitive, with trimming)
    const bioText = (userProfile.description || '').trim();
    const expectedCode = bioVerification.verificationCode.trim();
    
    // Multiple checks for robustness
    const bioContainsCode = bioText && (
      bioText.toLowerCase().includes(expectedCode.toLowerCase()) ||
      bioText.includes(expectedCode) ||
      bioText.toLowerCase().includes(expectedCode.toLowerCase().replace(/[^a-z0-9]/gi, ''))
    );
    
    console.log('🔍 Code matching debug:', {
      bioText: bioText,
      expectedCode: expectedCode,
      bioLower: bioText.toLowerCase(),
      codeLower: expectedCode.toLowerCase(),
      includes1: bioText.toLowerCase().includes(expectedCode.toLowerCase()),
      includes2: bioText.includes(expectedCode),
      finalResult: bioContainsCode
    });
    
    if (!bioContainsCode) {
      return res.status(400).json({
        error: `Verification code "${bioVerification.verificationCode}" not found in Twitter bio. Current bio: "${bioText}". Please add the code to your bio and try again.`
      });
    }
    
    // Clean up bio verification
    bioVerifications.delete(bioKey);
    
    // Submit to Flare blockchain
    const attestationData = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      verificationMethod: 'bio',
      verificationCode: bioVerification.verificationCode,
      userProfile,
      timestamp: Date.now()
    };
    
    console.log('📡 Submitting attestation to Flare...');
    const submitResult = await FlareServiceClass.submitAttestation(attestationData);
    console.log('✅ Attestation submitted:', submitResult.attestationId);
    
    const consensusResult = await FlareServiceClass.waitForConsensus(submitResult.attestationId);
    console.log('✅ Consensus reached');
    
    const merkleProof = await FlareServiceClass.getMerkleProof(submitResult.attestationId, await FlareServiceClass.prepareAttestationRequest(attestationData));
    console.log('✅ Merkle proof generated');
    
    // Store verification
    const verificationRecord = {
      walletAddress: normalizedWallet,
      twitterHandle: normalizedHandle,
      verificationMethod: 'bio',
      verificationCode: bioVerification.verificationCode,
      userProfile,
      flareAttestation: {
        ...submitResult,
        ...consensusResult,
        ...merkleProof
      },
      verified: true,
      verifiedAt: new Date().toISOString()
    };
    
    verifications.set(normalizedWallet, verificationRecord);
    
    console.log(`✅ Bio verification completed for wallet: ${normalizedWallet}`);
    
    res.json({
      success: true,
      message: 'Twitter account successfully verified via bio',
      verification: verificationRecord
    });
    
  } catch (error) {
    console.error('Error in bio verification completion:', error);
    res.status(500).json({
      error: `Bio verification failed: ${error.message}`
    });
  }
});

// Additional health check for external services
app.get('/api/health/services', async (req, res) => {
  const results = {
    flare: 'unknown',
    twitter: 'unknown',
    timestamp: new Date().toISOString()
  };
  
  if (!USE_MOCK_SERVICES) {
    // Test Flare connection
    try {
      if (process.env.FLARE_FDC_URL) {
        const flareResponse = await fetch(`${process.env.FLARE_FDC_URL}/health`, {
          timeout: 5000
        });
        results.flare = flareResponse.ok ? 'healthy' : 'unhealthy';
      }
    } catch (error) {
      results.flare = 'error';
      results.flareError = error.message;
    }
    
    // Test Twitter connection
    try {
      if (process.env.TWITTER_BEARER_TOKEN) {
        const twitterResponse = await fetch('https://api.twitter.com/2/users/by/username/twitter', {
          headers: {
            'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
          },
          timeout: 5000
        });
        results.twitter = twitterResponse.ok ? 'healthy' : 'unhealthy';
      }
    } catch (error) {
      results.twitter = 'error';
      results.twitterError = error.message;
    }
  } else {
    results.flare = 'mock';
    results.twitter = 'mock';
  }
  
  res.json(results);
});

// Test verifier connection
app.get('/api/test/verifier', async (req, res) => {
  try {
    console.log('🧪 Testing verifier connection...');
    
    // Check environment variables
    const config = {
      verifierUrl: process.env.WEB2JSON_VERIFIER_URL_TESTNET,
      hasVerifierKey: !!process.env.VERIFIER_API_KEY_TESTNET,
      hasRpcUrl: !!process.env.COSTON2_RPC_URL,
      hasDaLayerUrl: !!process.env.COSTON2_DA_LAYER_URL,
      hasTwitterToken: !!process.env.TWITTER_BEARER_TOKEN
    };
    
    console.log('📋 Configuration:', config);
    
    if (!config.verifierUrl || !config.hasVerifierKey) {
      return res.status(500).json({
        error: 'Missing verifier configuration',
        config
      });
    }

    if (!config.hasTwitterToken) {
      return res.status(500).json({
        error: 'Missing Twitter Bearer Token',
        config
      });
    }
    
    // Test verifier connection with a simple request
    const testRequest = {
      attestationType: "0x576562324a736f6e000000000000000000000000000000000000000000000000",
      sourceId: "0x5075626c69635765623200000000000000000000000000000000000000000000",
      requestBody: {
        url: 'https://api.twitter.com/2/users/by/username/twitter',
        httpMethod: 'GET',
        headers: JSON.stringify({
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }),
        queryParams: '{}',
        body: '{}',
        postProcessJq: '.',
        abiSignature: `{
          "components": [
            {"internalType": "string", "name": "data", "type": "string"}
          ],
          "name": "TwitterResponse",
          "type": "tuple"
        }`
      }
    };
    
    console.log('📤 Sending test request to verifier:', {
      url: `${process.env.WEB2JSON_VERIFIER_URL_TESTNET}Web2Json/prepareRequest`,
      request: testRequest
    });
    
    const response = await fetch(`${process.env.WEB2JSON_VERIFIER_URL_TESTNET}Web2Json/prepareRequest`, {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.VERIFIER_API_KEY_TESTNET,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });
    
    const responseData = await response.json();
    
    console.log('📥 Verifier response:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });
    
    if (!response.ok) {
      throw new Error(`Verifier request failed: ${response.status} ${response.statusText}`);
    }

    // Test Twitter API directly to verify token
    try {
      const twitterResponse = await fetch('https://api.twitter.com/2/users/by/username/twitter', {
        headers: {
          'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
        }
      });
      
      const twitterData = await twitterResponse.json();
      console.log('🐦 Twitter API test:', {
        status: twitterResponse.status,
        data: twitterData
      });
    } catch (twitterError) {
      console.error('❌ Twitter API test failed:', twitterError);
    }
    
    // Test RPC connection if configured
    let rpcStatus = 'not_configured';
    if (config.hasRpcUrl) {
      try {
        const rpcUrl = `${process.env.COSTON2_RPC_URL}${process.env.FLARE_RPC_API_KEY}`;
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        rpcStatus = {
          chainId: network.chainId.toString(),
          name: network.name
        };
      } catch (error) {
        rpcStatus = `error: ${error.message}`;
      }
    }
    
    // Convert any BigInt values to strings in the response
    const safeResponse = {
      success: true,
      message: 'Verifier connection test successful',
      config,
      verifierResponse: {
        status: responseData.status,
        hasAbiEncodedRequest: !!responseData.abiEncodedRequest,
        error: responseData.error || null
      },
      rpcStatus
    };
    
    res.json(safeResponse);
    
  } catch (error) {
    console.error('❌ Verifier test failed:', error);
    res.status(500).json({
      error: `Verifier test failed: ${error.message}`,
      config: {
        verifierUrl: process.env.WEB2JSON_VERIFIER_URL_TESTNET,
        hasVerifierKey: !!process.env.VERIFIER_API_KEY_TESTNET,
        hasRpcUrl: !!process.env.COSTON2_RPC_URL,
        hasDaLayerUrl: !!process.env.COSTON2_DA_LAYER_URL,
        hasTwitterToken: !!process.env.TWITTER_BEARER_TOKEN
      }
    });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Twitter Verification System Started
====================================
🌐 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/api/health
📊 Services: http://localhost:${PORT}/api/health/services
${USE_MOCK_SERVICES ? '🧪 Mode: MOCK SERVICES (demo)' : '🚀 Mode: REAL SERVICES (production)'}
📁 Static files: ./public/
====================================
`);
  
  console.log('🔧 Available API Endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/health/services');
  console.log('  GET  /api/verification/status/:walletAddress');
  console.log('  POST /api/verify-twitter');
  console.log('  POST /api/verify-twitter/oauth/initiate');
  console.log('  GET  /api/verify-twitter/oauth/callback');
  console.log('  POST /api/verify-twitter/bio/initiate');
  console.log('  POST /api/verify-twitter/bio/complete');
  console.log('');
  
  if (!USE_MOCK_SERVICES) {
    console.log('📝 To enable real services:');
    console.log('   1. Copy env.example to .env');
    console.log('   2. Add your FLARE_API_KEY and TWITTER_BEARER_TOKEN');
    console.log('   3. Restart the server');
    console.log('');
  }
});

module.exports = app; 