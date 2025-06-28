'use client';

import { useMoralisAuth } from './MoralisAuthProvider';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, HelpCircle, Wallet } from 'lucide-react';

export const WalletConnectButton = () => {
  const { 
    isInitialized, 
    isAuthenticated, 
    user, 
    isLoading, 
    error, 
    connectWallet, 
    disconnect 
  } = useMoralisAuth();

  const [walletDetected, setWalletDetected] = useState<boolean | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Check for wallet availability
  useEffect(() => {
    const checkWallet = () => {
      if (typeof window !== 'undefined') {
        const hasWallet = typeof window.ethereum !== 'undefined';
        setWalletDetected(hasWallet);
        
        if (!hasWallet) {
          console.warn('No Ethereum wallet detected');
        } else {
          console.log('Ethereum wallet detected');
        }
      }
    };

    checkWallet();
  }, []);

  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('No wallet detected')) return 'no-wallet';
    if (errorMessage.includes('Multiple wallet extensions detected')) return 'wallet-conflict';
    if (errorMessage.includes('No accounts found') || errorMessage.includes('wallet must has at least one account')) return 'no-accounts';
    if (errorMessage.includes('Connection rejected')) return 'rejected';
    if (errorMessage.includes('Wallet is locked')) return 'locked';
    return 'general';
  };

  const getErrorGuidance = (errorType: string) => {
    switch (errorType) {
      case 'no-wallet':
        return {
          title: 'No Wallet Detected',
          steps: [
            'Install MetaMask from metamask.io',
            'Create a new wallet or import existing one',
            'Refresh this page after installation'
          ]
        };
      case 'wallet-conflict':
        return {
          title: 'Multiple Wallet Extensions Detected',
          steps: [
            'Disable other wallet extensions (Coinbase Wallet, Phantom, etc.)',
            'Keep only MetaMask enabled',
            'Refresh this page and try again',
            'Or use an incognito/private window'
          ]
        };
      case 'no-accounts':
        return {
          title: 'No Accounts Found',
          steps: [
            'Open MetaMask and unlock your wallet',
            'Create a new account or import existing one',
            'Make sure you have at least one account active',
            'Try connecting again'
          ]
        };
      case 'rejected':
        return {
          title: 'Connection Rejected',
          steps: [
            'Check MetaMask popup and approve connection',
            'Make sure MetaMask is unlocked',
            'Try clicking "Connect Wallet" again'
          ]
        };
      case 'locked':
        return {
          title: 'Wallet is Locked',
          steps: [
            'Open MetaMask and enter your password',
            'Unlock your wallet',
            'Try connecting again'
          ]
        };
      default:
        return {
          title: 'Connection Error',
          steps: [
            'Make sure MetaMask is installed and unlocked',
            'Create or import an account in MetaMask',
            'Try refreshing the page',
            'Disable other wallet extensions if conflicts occur'
          ]
        };
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-muted-foreground">Initializing...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-500" />
        <span className="text-sm text-muted-foreground">
          {user.address.slice(0, 6)}...{user.address.slice(-4)}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={disconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  // Show different states based on wallet detection
  if (walletDetected === false) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">No Wallet Detected</h3>
            <p className="text-xs text-yellow-700">Please install MetaMask to continue</p>
          </div>
        </div>
        <Button 
          onClick={() => window.open('https://metamask.io/download/', '_blank')}
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Wallet className="w-4 h-4" />
          Install MetaMask
        </Button>
      </div>
    );
  }

  const errorType = error ? getErrorType(error) : null;
  const guidance = errorType ? getErrorGuidance(errorType) : null;

  return (
    <div className="flex flex-col gap-3">
      <Button 
        onClick={connectWallet} 
        disabled={isLoading}
        className="gap-2"
      >
        <Wallet className="w-4 h-4" />
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      
      {error && guidance && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-2">{guidance.title}</h3>
              <ul className="text-xs text-red-700 space-y-1">
                {guidance.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="mt-2 text-xs text-red-600 hover:text-red-700 gap-1"
          >
            <HelpCircle className="w-3 h-3" />
            {showHelp ? 'Hide' : 'Show'} detailed help
          </Button>
        </div>
      )}

      {showHelp && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Detailed Setup Guide:</h4>
          <ol className="text-xs text-blue-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                <strong>Install MetaMask:</strong> Go to metamask.io and install the browser extension
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <div>
                <strong>Create/Import Wallet:</strong> Set up a new wallet or import existing one with seed phrase
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                <strong>Unlock Wallet:</strong> Make sure MetaMask is unlocked and you have at least one account
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
              <div>
                <strong>Connect:</strong> Click "Connect Wallet" and approve the connection in MetaMask
              </div>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
};
