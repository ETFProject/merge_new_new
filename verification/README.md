# Twitter Verification System for AI ETF Platform

A complete, production-ready Twitter verification system that integrates with Flare blockchain for trustless verification. The system automatically switches between mock services (for development) and real blockchain/API integrations (for production) based on API key configuration.

## 🚀 Features

### Three Verification Methods
- **OAuth Authorization** (Recommended) - Secure Twitter OAuth flow
- **Bio Verification** - Temporary code in Twitter bio
- **Tweet Verification** - Post verification tweet with wallet address

### Production-Ready Architecture
- **Automatic Service Detection** - Switches between mock and real services
- **Real Flare Blockchain Integration** - Actual FDC attestations and consensus
- **Real Twitter API Integration** - Live Twitter API v2 calls
- **Comprehensive Error Handling** - Robust validation and error recovery
- **Health Monitoring** - Service status and connectivity checks

### Security & Validation
- Wallet address format validation (0x + 40 hex characters)
- Twitter handle validation (1-15 alphanumeric + underscore)
- Tweet ID extraction from URLs (twitter.com and x.com)
- Input sanitization and duplicate prevention
- Automatic cleanup of expired verifications

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS) → Express API → Flare FDC + Twitter API v2
                                   ↓
                              Blockchain Attestation
                                   ↓
                              Merkle Proof Generation
```

## 📦 Quick Start

### Development Mode (Mock Services)

```bash
# Clone and install
git clone <repository>
cd twitter-verification
npm install

# Start with mock services (no API keys needed)
npm start
```

Visit `http://localhost:3000` to see the complete verification flow with simulated blockchain transactions.

### Production Mode (Real Services)

```bash
# Copy environment template
cp env.example .env

# Edit .env with your real API keys
# FLARE_API_KEY=your_flare_api_key
# TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Start with real services
npm start
```

The system automatically detects API keys and switches to production mode.

## 🔧 API Endpoints

### Health & Status
- `GET /api/health` - Server health and configuration
- `GET /api/health/services` - External service connectivity
- `GET /api/verification/status/:walletAddress` - Check verification status

### Verification Methods
- `POST /api/verify-twitter` - Tweet verification
- `POST /api/verify-twitter/oauth/initiate` - Start OAuth flow
- `GET /api/verify-twitter/oauth/callback` - OAuth callback
- `POST /api/verify-twitter/bio/initiate` - Start bio verification
- `POST /api/verify-twitter/bio/complete` - Complete bio verification

## 🔐 API Key Setup

### Flare API Keys
1. Visit [Flare Developer Portal](https://dev.flare.network)
2. Create account and generate FDC API key
3. Add to `.env` as `FLARE_API_KEY`

### Twitter API Keys
1. Visit [Twitter Developer Portal](https://developer.twitter.com)
2. Apply for developer account (1-3 days approval)
3. Create app and generate Bearer Token
4. Add to `.env` as `TWITTER_BEARER_TOKEN`

## 📊 Service Modes

| Mode | Blockchain | Twitter API | Cost | Speed | Use Case |
|------|------------|-------------|------|-------|----------|
| **Mock** | Simulated | Sample data | Free | Instant | Development/Demo |
| **Production** | Real Flare FDC | Live API v2 | ~$0.01-0.10 | 2-5 min | Production |

## 🧪 Testing

```bash
# Run comprehensive test suite
npm test

# Test specific verification method
curl -X POST http://localhost:3000/api/verify-twitter \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8138FB7C75B4Fc75e",
    "twitterHandle": "cryptouser123",
    "tweetId": "1234567890"
  }'
```

## 🔍 Validation Rules

### Wallet Address
- Format: `0x` followed by 40 hexadecimal characters
- Example: `0x742d35Cc6634C0532925a3b8138FB7C75B4Fc75e`

### Twitter Handle
- 1-15 characters: letters, numbers, underscore
- With or without @ symbol
- Example: `@cryptouser123` or `cryptouser123`

### Tweet Requirements
- Must contain the exact wallet address
- Must include hashtags: `#FlareVerified` and `#AIETF`
- Must be public and accessible

## 🌐 Production Deployment

### Docker
```bash
docker build -t twitter-verification .
docker run -p 3000:3000 --env-file .env twitter-verification
```

### Cloud Platforms
- **Heroku**: `git push heroku main`
- **AWS/GCP/Azure**: Use environment variables for API keys
- **Vercel/Netlify**: Configure serverless functions

## 📈 Monitoring

### Health Checks
```bash
# Basic health
curl http://localhost:3000/api/health

# Service connectivity
curl http://localhost:3000/api/health/services
```

### Logs
The system provides detailed logging for:
- 📡 Attestation submissions
- ⏳ Consensus waiting
- 🌳 Merkle proof generation
- 🐦 Twitter API calls
- ✅ Successful verifications
- ❌ Error conditions

## 💰 Cost Estimation

### Flare Network
- Attestation submission: ~$0.005-0.02
- Consensus + Merkle proof: Included
- **Total per verification: ~$0.01-0.10**

### Twitter API
- Basic tier: Free (500K tweets/month)
- Pro tier: $100/month (2M tweets/month)

## 🔒 Security Features

- **Input Validation**: Comprehensive format checking
- **Rate Limiting**: Configurable request limits
- **CORS Protection**: Domain whitelist support
- **Environment Variables**: Secure API key management
- **Blockchain Immutability**: Tamper-proof verification records

## 🛠️ Development

### Project Structure
```
twitter-verification/
├── server.js              # Main server with real/mock services
├── public/index.html       # Frontend UI
├── test.js                # Comprehensive test suite
├── package.json           # Dependencies and scripts
├── env.example            # Environment template
├── README.md              # This file
└── PRODUCTION-SETUP.md    # Production deployment guide
```

### Mock vs Real Services

**Mock Services** (Default):
- Zero setup required
- Instant verification results
- Perfect for development and demos
- No real blockchain transactions

**Real Services** (Production):
- Requires API keys
- Real blockchain attestations
- Live Twitter API validation
- Permanent verification records

## 📚 Documentation

- **[Production Setup Guide](PRODUCTION-SETUP.md)** - Complete production deployment
- **[API Documentation](#-api-endpoints)** - Endpoint specifications
- **[Testing Guide](#-testing)** - Test procedures and examples

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the [Production Setup Guide](PRODUCTION-SETUP.md)
2. Review system logs and health endpoints
3. Verify API key configuration
4. Open an issue with detailed error information

---

**Ready for production with zero-setup development experience!** 🚀 