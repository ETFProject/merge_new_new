'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { usePrivyWallets } from '@/components/PrivyWalletsWrapper';
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

export default function TransactionsPage() {
  const [privyData, setPrivyData] = useState<{ privyId: string; address: string } | null>(null);
  const { wallets } = usePrivyWallets();
  const { user } = usePrivy();
  const connectedWallet = wallets?.[0];

  useEffect(() => {
    const fetchPrivyData = async () => {
      try {
        const response = await fetch(`https://baevii.ffdi.be/user/${user?.id}`);
        const data = await response.json();
        setPrivyData(data);
      } catch (error) {
        console.error('Error fetching Privy data:', error);
      }
    };

    fetchPrivyData();
  }, [user?.id]);

  const openFlowscan = () => {
    window.open(`https://evm.flowscan.io/address/${privyData.address}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">
            View the agents transaction history maintaining your ETF
          </p>
          {privyData && (
            <div className="mt-4 p-4 bg-muted/20 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">User Privy ID:</span> {user?.id}
              </p>
              <p className="text-sm">
                <span className="font-medium">Server Wallet Privy ID:</span> {privyData.privyId}
              </p>
              <p className="text-sm">
                <span className="font-medium">Server Wallet Address:</span> {privyData.address}
              </p>
            </div>
          )}
        </div>
        {/* <div className="flex flex-col items-end gap-2">
          <WalletConnectButton />
        </div> */}
      </div>

      {/* Flowscan Button */}
      <Card>
        <CardContent className="p-6">
          <Button 
            onClick={openFlowscan}
            className="w-full md:w-auto"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Transactions on Flowscan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
