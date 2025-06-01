# Production Setup Guide

## Overview

This Twitter verification system is designed to seamlessly transition from mock services (for development/testing) to real blockchain and API integrations (for production). The system automatically detects whether real API keys are configured and switches between mock and real services accordingly.

## Current Status

**🧪 MOCK MODE (Default)**
- No real blockchain transactions
- Simulated Twitter API calls
- Zero cost testing
- Instant verification results
- Perfect for development and demos

**🚀 PRODUCTION MODE (When API keys configured)**
- Real Flare blockchain attestations
- Real Twitter API validation
- Actual costs (~$0.01-0.10 per verification)
- Real consensus waiting (2-5 minutes)
- Permanent blockchain records

## Quick Start for Production

### 1. Environment Setup

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` with your real API credentials:

```env
# Environment Configuration for Production
NODE_ENV=production
PORT=3000

# Flare Network Configuration
FLARE_RPC_URL=https://flare-api.flare.network/ext/bc/C/rpc
FLARE_FDC_URL=https://fdc-api.flare.network
FLARE_API_KEY=your_actual_flare_api_key_here
FLARE_CHAIN_ID=14

# Twitter API v2 Configuration
TWITTER_BEARER_TOKEN=your_actual_twitter_bearer_token_here
TWITTER_CLIENT_ID=your_actual_twitter_client_id_here
TWITTER_CLIENT_SECRET=your_actual_twitter_client_secret_here

# Security
CORS_ORIGIN=https://yourdomain.com
```

### 2. Get API Keys

#### Flare API Keys
1. Visit [Flare Developer Portal](https://dev.flare.network)
2. Create an account and verify your email
3. Navigate to "API Keys" section
4. Generate a new FDC (Flare Data Connector) API key
5. Copy the API key to your `.env` file

#### Twitter API Keys
1. Visit [Twitter Developer Portal](https://developer.twitter.com)
2. Apply for a developer account (may take 1-3 days for approval)
3. Create a new app in your developer dashboard
4. Generate Bearer Token for API v2 access
5. For OAuth: Generate Client ID and Client Secret
6. Copy all credentials to your `.env` file

### 3. Start Production Server

```bash
npm start
```

The system will automatically detect your API keys and switch to production mode:

```
🚀 USING REAL SERVICES - Real blockchain verification enabled
   Flare FDC URL: https://fdc-api.flare.network
   Twitter API integration active
```

## Service Health Monitoring

Check service status:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/services
```

## Production vs Mock Differences

| Feature | Mock Services | Real Services |
|---------|---------------|---------------|
| **Blockchain** | Simulated attestations | Real Flare FDC transactions |
| **Twitter API** | Sample data | Live Twitter API v2 calls |
| **Cost** | Free | ~$0.01-0.10 per verification |
| **Speed** | Instant (2-3 seconds) | Real consensus (2-5 minutes) |
| **Data** | Generated samples | Real user profiles/tweets |
| **Persistence** | In-memory only | Permanent blockchain records |

## Database Integration (Optional)

For production, consider replacing in-memory storage with a database:

### MongoDB Example

```javascript
const { MongoClient } = require('mongodb');

// Connection
const client = new MongoClient(process.env.MONGODB_URL);
const db = client.db('twitter_verification');
const verifications = db.collection('verifications');

// Store verification
await verifications.insertOne(verificationRecord);

// Retrieve verification
const verification = await verifications.findOne({ walletAddress });
```

### PostgreSQL Example

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create table
await pool.query(`
  CREATE TABLE IF NOT EXISTS verifications (
    wallet_address VARCHAR(42) PRIMARY KEY,
    twitter_handle VARCHAR(15) NOT NULL,
    verification_method VARCHAR(10) NOT NULL,
    flare_attestation JSONB NOT NULL,
    verified_at TIMESTAMP DEFAULT NOW()
  )
`);
```

## Security Considerations

### API Key Security
- Never commit `.env` files to version control
- Use environment variables in production
- Rotate API keys regularly
- Monitor API usage for anomalies

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Input Validation
The system includes comprehensive validation:
- Wallet address format (0x + 40 hex chars)
- Twitter handle format (1-15 alphanumeric + underscore)
- Tweet ID format (numeric only)

## Deployment Options

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  twitter-verification:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - FLARE_API_KEY=${FLARE_API_KEY}
      - TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
    restart: unless-stopped
```

### Cloud Deployment

#### Heroku
```bash
heroku create your-app-name
heroku config:set FLARE_API_KEY=your_key
heroku config:set TWITTER_BEARER_TOKEN=your_token
git push heroku main
```

#### AWS/GCP/Azure
- Use environment variables for API keys
- Configure auto-scaling based on demand
- Set up monitoring and logging
- Use managed databases for persistence

## Monitoring and Logging

### Health Checks
- `/api/health` - Basic server health
- `/api/health/services` - External service connectivity

### Logging
The system provides detailed logging:
- 📡 Attestation submissions
- ⏳ Consensus waiting
- 🌳 Merkle proof generation
- 🐦 Twitter API calls
- ✅ Successful verifications
- ❌ Error conditions

### Metrics to Monitor
- Verification success rate
- Average consensus time
- API response times
- Error rates by endpoint
- Daily/monthly verification volume

## Cost Estimation

### Flare Network Costs
- Attestation submission: ~$0.005-0.02
- Consensus participation: Included
- Merkle proof generation: Included
- **Total per verification: ~$0.01-0.10**

### Twitter API Costs
- API v2 Basic: Free (up to 500K tweets/month)
- API v2 Pro: $100/month (up to 2M tweets/month)
- OAuth operations: Included in plan

## Troubleshooting

### Common Issues

**Mock services still running with API keys set:**
- Restart the server after adding API keys
- Check `.env` file is in the correct directory
- Verify API key format (no extra spaces/quotes)

**Twitter API errors:**
- Verify bearer token is valid
- Check API rate limits
- Ensure tweets/users are public

**Flare consensus timeout:**
- Normal during network congestion
- Retry after a few minutes
- Check Flare network status

**CORS errors in browser:**
- Set `CORS_ORIGIN` in `.env`
- Use HTTPS in production
- Configure proper domain whitelist

### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
DEBUG=twitter-verification:*
```

## Support

For production support:
- Check system logs first
- Monitor `/api/health/services` endpoint
- Review Flare network status
- Verify Twitter API quotas
- Contact support with specific error messages

## Migration Checklist

- [ ] Obtain Flare API key from developer portal
- [ ] Obtain Twitter API credentials
- [ ] Configure `.env` file with real credentials
- [ ] Test with small verification volume
- [ ] Set up monitoring and alerting
- [ ] Configure database (if needed)
- [ ] Set up backup and recovery
- [ ] Document operational procedures
- [ ] Train support team on troubleshooting
