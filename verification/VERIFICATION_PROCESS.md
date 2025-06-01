# Twitter Verification Process

## How It Works

1. **Start Verification**
   - User connects their Twitter account
   - System creates a unique verification code
   - User adds this code to their Twitter bio

2. **Verify Identity**
   - System checks the Twitter profile
   - Confirms the code is in the bio
   - Validates the user's identity

3. **Create Blockchain Record**
   - System creates a permanent record on Flare blockchain
   - Links Twitter account to user's wallet
   - Makes verification available for future use

## Why It's Secure

- Each verification is unique and time-limited
- Multiple validators confirm the verification
- Permanent record on blockchain prevents fraud
- Other applications can verify the attestation

## Benefits

- Secure identity verification
- Permanent blockchain record
- Reusable verification
- Trusted by other applications

## Flow
User -> Initiate -> Add Code to Bio -> Complete -> Flare Attestation -> Consensus -> Done

## Steps

1. **Initiate**
   - Generate unique code
   - Store with wallet & Twitter handle
   - Return code to user

2. **Complete**
   - Fetch Twitter profile
   - Check code in bio
   - If verified, create Flare attestation

3. **Flare Attestation**
   - Prepare data (handle, code, timestamp, wallet)
   - Submit to Flare with fee
   - Create permanent record

4. **Consensus**
   - Validators verify data
   - Reach consensus
   - Record on-chain

## API Endpoints
```
POST /api/verify-twitter/bio/initiate
POST /api/verify-twitter/bio/complete
GET /api/verification/status/:walletAddress
```

## Setup
```
FLARE_API_KEY=your_key
TWITTER_BEARER_TOKEN=your_token
BASE_URL=http://localhost:3000
```

## Error Handling

1. **Twitter API Errors**
   - Unauthorized access
   - Rate limiting
   - Profile not found

2. **Verification Errors**
   - Invalid code
   - Expired code
   - Bio not updated

3. **Blockchain Errors**
   - Insufficient funds
   - Network issues
   - Invalid data format

## Security Considerations

1. **Code Generation**
   - Uses cryptographically secure random generation
   - Codes expire after 10 minutes
   - One-time use only

2. **Data Storage**
   - Verification data stored in memory
   - No permanent storage of sensitive data
   - Automatic cleanup of expired verifications

3. **Blockchain Security**
   - Secure key management
   - Transaction signing
   - Fee management

## Integration Guide

1. **Setup Requirements**
   - Flare API key
   - Twitter API credentials
   - Valid wallet address

2. **Environment Variables**
   ```
   FLARE_API_KEY=your_api_key
   TWITTER_BEARER_TOKEN=your_bearer_token
   BASE_URL=http://localhost:3000
   ```

3. **Testing**
   - Use testnet for development
   - Mock Twitter API for testing
   - Verify attestation flow

## Maintenance

1. **Regular Checks**
   - API key validity
   - Rate limit monitoring
   - Error rate tracking

2. **Updates**
   - Twitter API changes
   - Flare protocol updates
   - Security patches

## Support

For issues or questions:
1. Check error logs
2. Verify API credentials
3. Contact support team 