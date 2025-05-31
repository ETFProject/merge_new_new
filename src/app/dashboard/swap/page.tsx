'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CrossChainSwap } from "@/components/etf/cross-chain-swap";
import Image from "next/image";
import Link from "next/link";

export default function SwapTestPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cross-Chain Swap Testing</h2>
        <p className="text-muted-foreground">
          Test 1inch Fusion+ cross-chain swaps between Base and Arbitrum
        </p>
      </div>
      
      <CrossChainSwap onSuccess={() => console.log('Swap completed successfully')} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1inch Fusion+ Features</CardTitle>
            <CardDescription>
              Key features of the 1inch Fusion+ protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Image src="/flower.png" alt="Security" width={16} height={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Trustless Cross-Chain Swaps</h4>
                <p className="text-sm text-muted-foreground">
                  Execute cross-chain swaps without relying on centralized bridges, using secure hashlock contracts.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Image src="/sandwave.png" alt="MEV Protection" width={16} height={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">MEV Protection</h4>
                <p className="text-sm text-muted-foreground">
                  Fusion+ provides protection against MEV (Maximal Extractable Value) attacks, ensuring optimal execution.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Image src="/snail.png" alt="Gas Optimization" width={16} height={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Gas Optimization</h4>
                <p className="text-sm text-muted-foreground">
                  The protocol optimizes gas costs across multiple chains, providing cost-effective cross-chain swaps.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>
              How 1inch Fusion+ cross-chain swaps work
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold">Hashlock Mechanism</h4>
              <p className="text-sm text-muted-foreground">
                The protocol uses hashlock contracts on both source and destination chains to ensure atomicity
                of the cross-chain swap. The order creator generates a random secret that can unlock both escrows.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold">Secret Submission</h4>
              <p className="text-sm text-muted-foreground">
                After escrows are created on both chains and finality locks expire, the secret is submitted to
                complete the swap. This process ensures that funds are only released when conditions are met on both chains.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold">Integration Example</h4>
              <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                {`
// Generate random secret
const secret = getRandomBytes32();
const secretHash = HashLock.hashSecret(secret);

// Place order with hashlock
const orderHash = await sdk.placeOrder(quote, {
  walletAddress: userAddress,
  hashLock: HashLock.forSingleFill(secret),
  secretHashes: [secretHash]
});

// Submit secret after finality period
await sdk.submitSecret(orderHash, secret);
                `.trim()}
              </pre>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
            
            <Link href="https://docs.1inch.io/docs/fusion-swap/cross-chain-swaps" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost">
                View Documentation
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 