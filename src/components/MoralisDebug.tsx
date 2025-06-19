'use client';

import { useMoralisAuth } from './MoralisAuthProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const MoralisDebug = () => {
  const { 
    isInitialized, 
    isAuthenticated, 
    user, 
    isLoading, 
    error, 
    connectWallet, 
    disconnect 
  } = useMoralisAuth();

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Moralis Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Initialized:</span>
            <span className={isInitialized ? 'text-green-600' : 'text-red-600'}>
              {isInitialized ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Authenticated:</span>
            <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
              {isAuthenticated ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Loading:</span>
            <span className={isLoading ? 'text-yellow-600' : 'text-gray-600'}>
              {isLoading ? '⏳ Yes' : 'No'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">Error: {error}</p>
          </div>
        )}

        {user && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-800">User Info:</p>
            <p className="text-xs text-green-700">Address: {user.address}</p>
            <p className="text-xs text-green-700">Chain: {user.chainId}</p>
            <p className="text-xs text-green-700">Auth: {new Date(user.authenticatedAt).toLocaleString()}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!isAuthenticated ? (
            <Button 
              onClick={connectWallet} 
              disabled={isLoading || !isInitialized}
              className="flex-1"
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          ) : (
            <Button 
              onClick={disconnect}
              variant="outline"
              className="flex-1"
            >
              Disconnect
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>Check browser console for detailed logs</p>
        </div>
      </CardContent>
    </Card>
  );
}; 