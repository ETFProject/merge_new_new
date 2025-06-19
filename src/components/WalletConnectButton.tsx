'use client';

import { useMoralisAuth } from './MoralisAuthProvider';
import { Button } from './ui/button';

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

  if (!isInitialized) {
    return (
      <Button disabled>
        Initializing...
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
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

  return (
    <Button 
      onClick={connectWallet} 
      disabled={isLoading}
    >
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};
