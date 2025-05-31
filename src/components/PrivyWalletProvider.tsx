'use client';

import { ReactNode, useEffect, useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

interface PrivyWalletProviderProps {
  children: ReactNode;
}

export function PrivyWalletProvider({ children }: PrivyWalletProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const [appUrl, setAppUrl] = useState<string>('');

  // Get the current URL for WalletConnect metadata
  useEffect(() => {
    // Get the base URL (protocol + hostname)
    const baseUrl = window.location.origin;
    setAppUrl(baseUrl);
  }, []);

  if (!appId) {
    console.warn('NEXT_PUBLIC_PRIVY_APP_ID is not set. Please add it to your .env.local file.');
    // Return children without Privy provider if no app ID is set
    return <>{children}</>;
  }

  // Only render the provider once we have the URL
  if (!appUrl && typeof window !== 'undefined') {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Appearance configuration
        appearance: {
          theme: 'light',
          accentColor: '#2563eb', // Blue accent color matching the UI
          logo: '/baevii-logo.png',
          showWalletLoginFirst: true,
        },
        // Login methods - allowing both email/social and wallet connections
        loginMethods: ['email', 'wallet', 'google', 'twitter'],
        // Embedded wallet config
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Create embedded wallet for users without external wallet
        },
        // WalletConnect project ID
        walletConnectCloudProjectId: '34357d3c125c2bcf2ce2bc3309d98715',
        // Default chain configuration for Base Sepolia
        defaultChain: {
          id: 84532,
          name: 'Base Sepolia',
          network: 'base-sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'Ethereum',
            symbol: 'ETH',
          },
          rpcUrls: {
            default: {
              http: ['https://sepolia.base.org'],
            },
            public: {
              http: ['https://sepolia.base.org'],
            },
          },
          blockExplorers: {
            default: {
              name: 'Blockscout',
              url: 'https://base-sepolia.blockscout.com',
            },
          },
          testnet: true,
        },
        // Supported chains
        supportedChains: [
          {
            id: 84532,
            name: 'Base Sepolia',
            network: 'base-sepolia',
            nativeCurrency: {
              decimals: 18,
              name: 'Ethereum',
              symbol: 'ETH',
            },
            rpcUrls: {
              default: {
                http: ['https://sepolia.base.org'],
              },
              public: {
                http: ['https://sepolia.base.org'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Blockscout',
                url: 'https://base-sepolia.blockscout.com',
              },
            },
            testnet: true,
          },
          // Flow EVM Testnet Chain (add to supported chains)
          {
            id: 545,
            name: 'Flow EVM Testnet',
            network: 'flow-evm-testnet',
            nativeCurrency: {
              decimals: 18,
              name: 'Flow',
              symbol: 'FLOW',
            },
            rpcUrls: {
              default: {
                http: ['https://testnet.evm.nodes.onflow.org'],
              },
              public: {
                http: ['https://testnet.evm.nodes.onflow.org'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Flowscan',
                url: 'https://evm-testnet.flowscan.io',
              },
            },
            testnet: true,
          },
          // Add more chains as needed
          {
            id: 1,
            name: 'Ethereum',
            network: 'homestead',
            nativeCurrency: {
              decimals: 18,
              name: 'Ethereum',
              symbol: 'ETH',
            },
            rpcUrls: {
              default: {
                http: ['https://cloudflare-eth.com'],
              },
              public: {
                http: ['https://cloudflare-eth.com'],
              },
            },
            blockExplorers: {
              default: {
                name: 'Etherscan',
                url: 'https://etherscan.io',
              },
            },
            testnet: false,
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
