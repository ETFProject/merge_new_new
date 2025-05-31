'use client';

import { ReactNode, useEffect, useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { PrivyWalletsWrapper } from './PrivyWalletsWrapper';

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
          // Configure wallet list to avoid unsupported wallets
          walletList: ['metamask', 'wallet_connect', 'coinbase_wallet', 'rainbow'],
        },
        // Login methods - allowing both email/social and wallet connections
        loginMethods: ['email', 'wallet', 'google', 'twitter'],
        // Embedded wallet config
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Create embedded wallet for users without external wallet
        },
        // Updated WalletConnect project ID (get new one from https://cloud.walletconnect.com)
        walletConnectCloudProjectId: '34357d3c125c2bcf2ce2bc3309d98715',
        // External wallet configuration
        externalWallets: {
          coinbaseWallet: {
            // Disable Coinbase Smart Wallet for unsupported chains
            connectionOptions: 'smartWalletOnly', // or 'eoaOnly' to avoid smart wallet
          },
        },
        // Set Flow EVM Testnet as default chain
        defaultChain: {
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
        // Supported chains - prioritize Flow EVM Testnet
        supportedChains: [
          // Flow EVM Testnet (PRIMARY)
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
          // Base Sepolia (SECONDARY)
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
        ],
      }}
    >
      <PrivyWalletsWrapper>
        {children}
      </PrivyWalletsWrapper>
    </PrivyProvider>
  );
}
