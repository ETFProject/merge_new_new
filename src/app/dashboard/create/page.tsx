'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateETFForm } from "@/components/etf/create-etf-form";

export default function CreateEtfPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Create New ETF</h2>
        <p className="text-muted-foreground">
          Create a custom ETF portfolio with your desired token allocations
        </p>
      </div>
      
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>ETF Configuration</CardTitle>
          <CardDescription>
            Configure your ETF settings and token allocations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateETFForm onSuccess={() => router.push('/dashboard')} />
        </CardContent>
      </Card>
      
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>ETF Creation Guidelines</CardTitle>
          <CardDescription>
            Important information about creating ETFs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold">Diversification</h4>
            <p className="text-sm text-muted-foreground">
              For optimal portfolio performance, it&apos;s recommended to include tokens from different sectors
              and with varying market capitalizations.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold">Risk Management</h4>
            <p className="text-sm text-muted-foreground">
              Consider including some stable assets alongside higher volatility tokens to balance risk.
              A good rule of thumb is to allocate 20-30% to stable assets.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold">Rebalancing</h4>
            <p className="text-sm text-muted-foreground">
              You can rebalance your ETF periodically to maintain your target allocations as market
              conditions change. This helps manage risk and optimize returns.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold">Fees</h4>
            <p className="text-sm text-muted-foreground">
              Creating an ETF incurs a small one-time setup fee, plus gas costs for the initial transaction.
              Rebalancing operations will also incur gas costs based on network conditions.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="mr-2">
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 