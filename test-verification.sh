#!/bin/zsh

# Switch to zsh if not already in it
if [ -z "$ZSH_VERSION" ]; then
  exec /bin/zsh -l "$0" "$@"
fi

# Ensure bun is available
if ! command -v bun &> /dev/null; then
  echo "Bun is not installed or not in PATH. Please install Bun: https://bun.sh"
  exit 1
fi

# Variables
WALLET_ADDRESS="0x742d35Cc6634C0532925a3b8138FB7C75B4Fc75e"
TWITTER_HANDLE="cryptouser123"
TWEET_ID="1234567890"
BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}Testing Verification API with Bun...${NC}"

# Test status endpoint (mock mode)
echo "\n${BLUE}Testing verification status endpoint (mock mode)...${NC}"
bun run --bun curl -s "${BASE_URL}/api/verification/status/${WALLET_ADDRESS}?mock=true" | jq .

# Test Twitter verification (mock mode)
echo "\n${BLUE}Testing tweet verification endpoint (mock mode)...${NC}"
bun run --bun curl -s -X POST "${BASE_URL}/api/verify-twitter?mock=true" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"${WALLET_ADDRESS}\",\"twitterHandle\":\"${TWITTER_HANDLE}\",\"tweetId\":\"${TWEET_ID}\"}" | jq .

# Test bio initiation (mock mode)
echo "\n${BLUE}Testing bio verification initiation endpoint (mock mode)...${NC}"
bun run --bun curl -s -X POST "${BASE_URL}/api/verify-twitter/bio/initiate?mock=true" \
  -H "Content-Type: application/json" \
  -d "{\"walletAddress\":\"${WALLET_ADDRESS}\",\"twitterHandle\":\"${TWITTER_HANDLE}\"}" | jq .

echo "\n${GREEN}Test complete!${NC}" 