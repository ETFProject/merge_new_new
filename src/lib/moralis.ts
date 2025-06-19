import Moralis from 'moralis';

// Initialize Moralis
export const initializeMoralis = async () => {
  if (!Moralis.Core.isStarted) {
    await Moralis.start({
      apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
    });
  }
};

// Moralis configuration
export const moralisConfig = {
  apiKey: process.env.NEXT_PUBLIC_MORALIS_API_KEY,
  chains: ['eth', 'polygon', 'bsc', 'avalanche', 'arbitrum', 'optimism', 'base'], // Add more chains as needed
};

export default Moralis; 