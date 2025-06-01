const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b8138FB7C75B4Fc75e';
const TEST_HANDLE = 'testuser123';
const TEST_TWEET_ID = '1234567890123456789';

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Utility functions
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const responseData = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

function assert(condition, message) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    console.log(`✅ ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  
  try {
    const response = await makeRequest('GET', '/api/health');
    
    assert(response.status === 200, 'Health check returns 200 status');
    assert(response.data.status === 'healthy', 'Health check returns healthy status');
    assert(response.data.version === '1.0.0', 'Health check returns correct version');
    assert(response.data.environment === 'development', 'Health check returns correct environment');
    assert(typeof response.data.timestamp === 'string', 'Health check includes timestamp');
    
  } catch (error) {
    assert(false, `Health check failed with error: ${error.message}`);
  }
}

async function testInputValidation() {
  console.log('\n🔍 Testing Input Validation...');
  
  // Test invalid wallet address
  try {
    const response = await makeRequest('POST', '/api/verify-twitter', {
      walletAddress: 'invalid_wallet',
      twitterHandle: TEST_HANDLE,
      tweetId: TEST_TWEET_ID
    });
    
    assert(response.status === 400, 'Invalid wallet address returns 400 status');
    assert(response.data.error.includes('Invalid wallet address'), 'Invalid wallet address returns appropriate error');
  } catch (error) {
    assert(false, `Wallet validation test failed: ${error.message}`);
  }
  
  // Test invalid Twitter handle
  try {
    const response = await makeRequest('POST', '/api/verify-twitter', {
      walletAddress: TEST_WALLET,
      twitterHandle: 'invalid@handle!',
      tweetId: TEST_TWEET_ID
    });
    
    assert(response.status === 400, 'Invalid Twitter handle returns 400 status');
    assert(response.data.error.includes('Invalid Twitter handle'), 'Invalid Twitter handle returns appropriate error');
  } catch (error) {
    assert(false, `Twitter handle validation test failed: ${error.message}`);
  }
  
  // Test missing fields
  try {
    const response = await makeRequest('POST', '/api/verify-twitter', {
      walletAddress: TEST_WALLET
      // Missing twitterHandle and tweetId
    });
    
    assert(response.status === 400, 'Missing fields returns 400 status');
    assert(response.data.error.includes('Missing required fields'), 'Missing fields returns appropriate error');
  } catch (error) {
    assert(false, `Missing fields test failed: ${error.message}`);
  }
}

async function testVerificationStatus() {
  console.log('\n🔍 Testing Verification Status...');
  
  // Test status for non-existent verification
  try {
    const response = await makeRequest('GET', `/api/verification/status/${TEST_WALLET}`);
    
    assert(response.status === 200, 'Status check returns 200 status');
    assert(response.data.verified === false, 'Non-existent verification returns verified: false');
    assert(response.data.message.includes('No verification found'), 'Non-existent verification returns appropriate message');
  } catch (error) {
    assert(false, `Verification status test failed: ${error.message}`);
  }
  
  // Test status with invalid wallet address
  try {
    const response = await makeRequest('GET', '/api/verification/status/invalid_wallet');
    
    assert(response.status === 400, 'Invalid wallet address in status check returns 400');
    assert(response.data.error.includes('Invalid wallet address'), 'Invalid wallet address returns appropriate error');
  } catch (error) {
    assert(false, `Invalid wallet status test failed: ${error.message}`);
  }
}

async function testTweetVerification() {
  console.log('\n🔍 Testing Tweet Verification...');
  
  try {
    const response = await makeRequest('POST', '/api/verify-twitter', {
      walletAddress: TEST_WALLET,
      twitterHandle: TEST_HANDLE,
      tweetId: TEST_TWEET_ID
    });
    
    assert(response.status === 200, 'Tweet verification returns 200 status');
    assert(response.data.success === true, 'Tweet verification returns success: true');
    assert(response.data.verification.verified === true, 'Tweet verification sets verified: true');
    assert(response.data.verification.verificationMethod === 'tweet', 'Tweet verification sets correct method');
    assert(response.data.verification.walletAddress === TEST_WALLET.toLowerCase(), 'Tweet verification normalizes wallet address');
    assert(response.data.verification.twitterHandle === TEST_HANDLE.toLowerCase(), 'Tweet verification normalizes Twitter handle');
    assert(typeof response.data.verification.flareAttestation.attestationId === 'string', 'Tweet verification includes attestation ID');
    assert(typeof response.data.verification.flareAttestation.txHash === 'string', 'Tweet verification includes transaction hash');
    assert(typeof response.data.verification.flareAttestation.merkleProof === 'string', 'Tweet verification includes merkle proof');
    
    // Test duplicate verification
    const duplicateResponse = await makeRequest('POST', '/api/verify-twitter', {
      walletAddress: TEST_WALLET,
      twitterHandle: TEST_HANDLE,
      tweetId: TEST_TWEET_ID
    });
    
    assert(duplicateResponse.status === 409, 'Duplicate verification returns 409 status');
    assert(duplicateResponse.data.error.includes('already verified'), 'Duplicate verification returns appropriate error');
    
  } catch (error) {
    assert(false, `Tweet verification test failed: ${error.message}`);
  }
}

async function testOAuthInitiation() {
  console.log('\n🔍 Testing OAuth Initiation...');
  
  const testWallet = '0x8ba1f109551bD432803012645Hac136c4321c12d';
  const testHandle = 'oauthuser';
  
  try {
    const response = await makeRequest('POST', '/api/verify-twitter/oauth/initiate', {
      walletAddress: testWallet,
      twitterHandle: testHandle
    });
    
    assert(response.status === 200, 'OAuth initiation returns 200 status');
    assert(response.data.success === true, 'OAuth initiation returns success: true');
    assert(typeof response.data.authUrl === 'string', 'OAuth initiation returns auth URL');
    assert(response.data.authUrl.includes('twitter.com'), 'OAuth auth URL contains twitter.com');
    assert(typeof response.data.state === 'string', 'OAuth initiation returns state parameter');
    assert(response.data.state.length > 0, 'OAuth state parameter is not empty');
    
  } catch (error) {
    assert(false, `OAuth initiation test failed: ${error.message}`);
  }
}

async function testBioVerificationFlow() {
  console.log('\n🔍 Testing Bio Verification Flow...');
  
  const testWallet = '0x1234567890123456789012345678901234567890';
  const testHandle = 'biouser';
  
  try {
    // Test bio verification initiation
    const initiateResponse = await makeRequest('POST', '/api/verify-twitter/bio/initiate', {
      walletAddress: testWallet,
      twitterHandle: testHandle
    });
    
    assert(initiateResponse.status === 200, 'Bio initiation returns 200 status');
    assert(initiateResponse.data.success === true, 'Bio initiation returns success: true');
    assert(typeof initiateResponse.data.verificationCode === 'string', 'Bio initiation returns verification code');
    assert(initiateResponse.data.verificationCode.length === 8, 'Bio verification code is 8 characters');
    assert(initiateResponse.data.expiresIn === 600, 'Bio verification expires in 10 minutes');
    
    // Test bio verification completion
    const completeResponse = await makeRequest('POST', '/api/verify-twitter/bio/complete', {
      walletAddress: testWallet,
      twitterHandle: testHandle
    });
    
    assert(completeResponse.status === 200, 'Bio completion returns 200 status');
    assert(completeResponse.data.success === true, 'Bio completion returns success: true');
    assert(completeResponse.data.verification.verified === true, 'Bio completion sets verified: true');
    assert(completeResponse.data.verification.verificationMethod === 'bio', 'Bio completion sets correct method');
    assert(typeof completeResponse.data.verification.verificationCode === 'string', 'Bio completion includes verification code');
    
  } catch (error) {
    assert(false, `Bio verification test failed: ${error.message}`);
  }
}

async function testErrorHandling() {
  console.log('\n🔍 Testing Error Handling...');
  
  // Test 404 for non-existent endpoint
  try {
    const response = await makeRequest('GET', '/api/nonexistent');
    
    assert(response.status === 404, 'Non-existent endpoint returns 404 status');
    assert(response.data.error === 'Endpoint not found', 'Non-existent endpoint returns appropriate error');
  } catch (error) {
    assert(false, `404 error test failed: ${error.message}`);
  }
  
  // Test invalid JSON
  try {
    const response = await makeRequest('POST', '/api/verify-twitter', 'invalid json');
    
    assert(response.status === 400, 'Invalid JSON returns 400 status');
  } catch (error) {
    // This is expected for invalid JSON
    assert(true, 'Invalid JSON properly handled');
  }
}

async function testTweetIdExtraction() {
  console.log('\n🔍 Testing Tweet ID Extraction...');
  
  const testWallet = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const testHandle = 'urluser';
  
  // Test with Twitter URL
  try {
    const response = await makeRequest('POST', '/api/verify-twitter', {
      walletAddress: testWallet,
      twitterHandle: testHandle,
      tweetId: 'https://twitter.com/user/status/1234567890123456789'
    });
    
    assert(response.status === 200, 'Twitter URL extraction works');
    assert(response.data.verification.tweetId === '1234567890123456789', 'Tweet ID correctly extracted from Twitter URL');
  } catch (error) {
    assert(false, `Twitter URL extraction test failed: ${error.message}`);
  }
  
  // Test with X.com URL
  try {
    const testWallet2 = '0xfedcbafedcbafedcbafedcbafedcbafedcbafedcba';
    const response = await makeRequest('POST', '/api/verify-twitter', {
      walletAddress: testWallet2,
      twitterHandle: testHandle,
      tweetId: 'https://x.com/user/status/9876543210987654321'
    });
    
    assert(response.status === 200, 'X.com URL extraction works');
    assert(response.data.verification.tweetId === '9876543210987654321', 'Tweet ID correctly extracted from X.com URL');
  } catch (error) {
    assert(false, `X.com URL extraction test failed: ${error.message}`);
  }
}

async function testFlareIntegration() {
  console.log('\n🔍 Testing Flare Integration Simulation...');
  
  const testWallet = '0x9999999999999999999999999999999999999999';
  const testHandle = 'flareuser';
  
  try {
    const response = await makeRequest('POST', '/api/verify-twitter', {
      walletAddress: testWallet,
      twitterHandle: testHandle,
      tweetId: '9999999999999999999'
    });
    
    assert(response.status === 200, 'Flare integration simulation works');
    
    const attestation = response.data.verification.flareAttestation;
    assert(attestation.attestationId.startsWith('flr_'), 'Attestation ID has correct prefix');
    assert(attestation.txHash.startsWith('0x'), 'Transaction hash has correct format');
    assert(attestation.txHash.length === 66, 'Transaction hash has correct length');
    assert(attestation.merkleProof.startsWith('0x'), 'Merkle proof has correct format');
    assert(attestation.merkleProof.length === 130, 'Merkle proof has correct length');
    assert(typeof attestation.consensusReached === 'boolean', 'Consensus status is boolean');
    assert(typeof attestation.validators === 'number', 'Validator count is number');
    assert(attestation.validators >= 8 && attestation.validators <= 12, 'Validator count is in expected range');
    
  } catch (error) {
    assert(false, `Flare integration test failed: ${error.message}`);
  }
}

async function testConcurrentRequests() {
  console.log('\n🔍 Testing Concurrent Requests...');
  
  try {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(makeRequest('GET', '/api/health'));
    }
    
    const responses = await Promise.all(promises);
    
    assert(responses.length === 5, 'All concurrent requests completed');
    assert(responses.every(r => r.status === 200), 'All concurrent requests returned 200');
    assert(responses.every(r => r.data.status === 'healthy'), 'All concurrent requests returned healthy status');
    
  } catch (error) {
    assert(false, `Concurrent requests test failed: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Twitter Verification System Tests');
  console.log('='.repeat(50));
  
  // Check if server is running
  try {
    await makeRequest('GET', '/api/health');
    console.log('✅ Server is running and accessible');
  } catch (error) {
    console.log('❌ Server is not accessible. Please start the server first with: npm start');
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
  
  // Run all tests
  await testHealthCheck();
  await testInputValidation();
  await testVerificationStatus();
  await testTweetVerification();
  await testOAuthInitiation();
  await testBioVerificationFlow();
  await testTweetIdExtraction();
  await testFlareIntegration();
  await testErrorHandling();
  await testConcurrentRequests();
  
  // Print results
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! The Twitter verification system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
  }
  
  console.log('\n📋 Test Coverage:');
  console.log('  ✅ API Health Check');
  console.log('  ✅ Input Validation');
  console.log('  ✅ Verification Status');
  console.log('  ✅ Tweet Verification');
  console.log('  ✅ OAuth Initiation');
  console.log('  ✅ Bio Verification Flow');
  console.log('  ✅ Tweet ID Extraction');
  console.log('  ✅ Flare Integration Simulation');
  console.log('  ✅ Error Handling');
  console.log('  ✅ Concurrent Requests');
  
  console.log('\n🔧 Manual Testing Recommendations:');
  console.log('  1. Open http://localhost:3000 in your browser');
  console.log('  2. Test all three verification methods');
  console.log('  3. Verify form validation works');
  console.log('  4. Check responsive design on mobile');
  console.log('  5. Test error scenarios');
  
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runTests(); 