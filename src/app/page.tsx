'use client';

import { useMoralisAuth } from '@/components/MoralisAuthProvider';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  const { isAuthenticated } = useMoralisAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          
        </div>
      </nav>

      {/* Hero Section */}
      <main className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center">
          <Image
            src="/baevii-logo.png"
            alt="BAEVII Logo"
            width={256}
            height={256}
            className="mb-4 drop-shadow-lg"
            priority
          />
          <h1 className="text-6xl font-extrabold text-foreground mb-8 tracking-tight">BAEVII</h1>
        </div>
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            AI-Powered ETF Management
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create, manage, and optimize your cryptocurrency ETFs with advanced AI insights. 
            Seamless cross-chain operations and intelligent portfolio rebalancing.
          </p>
          
          {!isAuthenticated ? (
            <div className="mb-12">
              <WalletConnectButton />
            </div>
          ) : (
            <div className="mb-12">
              <Link href="/dashboard">
                <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors text-lg">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          )}

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image src="/how-it-works-ai.png" alt="AI" width={32} height={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">AI-Powered Insights</h3>
              <p className="text-muted-foreground">
                Advanced algorithms analyze market trends and optimize your portfolio automatically.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image src="/how-it-works-crosschain.png" alt="Cross-chain" width={32} height={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Cross-Chain Operations</h3>
              <p className="text-muted-foreground">
                Seamlessly manage assets across multiple blockchains with unified interface.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image src="/how-it-works-deposit.png" alt="Deposit" width={32} height={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Easy Management</h3>
              <p className="text-muted-foreground">
                Simple deposit, withdraw, and rebalancing with just a few clicks.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}