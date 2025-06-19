'use client';

import { useState } from 'react';
import { useMoralisAuth } from '@/components/MoralisAuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { ETFDetailDialog } from '@/components/etf/etf-detail-dialog';

// Mock ETF data
const mockETFs = {
  blueChip: {
    name: 'BAEVII Blue Chip',
    description: 'Large-Cap Crypto Index',
    icon: '/baevii-logo.png',
    iconText: 'B',
    expenseRatio: '0.25%',
    aum: '$12.4M',
    performance30D: '+16.3%',
    holdings: [
      { symbol: 'BTC', weight: '35.2%' },
      { symbol: 'ETH', weight: '28.7%' },
      { symbol: 'SOL', weight: '18.4%' },
      { symbol: 'BNB', weight: '12.1%' }
    ]
  },
  defiGrowth: {
    name: 'DeFi Growth',
    description: 'DeFi Protocol Index',
    icon: '/baevii-logo.png',
    iconText: 'D',
    expenseRatio: '0.35%',
    aum: '$8.7M',
    performance30D: '+24.7%',
    holdings: [
      { symbol: 'UNI', weight: '25.2%' },
      { symbol: 'AAVE', weight: '22.7%' },
      { symbol: 'MKR', weight: '20.4%' },
      { symbol: 'SNX', weight: '15.1%' }
    ]
  },
  aiWeb3: {
    name: 'AI & Web3',
    description: 'AI Innovation Index',
    icon: '/baevii-logo.png',
    iconText: 'A',
    expenseRatio: '0.45%',
    aum: '$6.2M',
    performance30D: '+42.1%',
    holdings: [
      { symbol: 'OCEAN', weight: '30.2%' },
      { symbol: 'FET', weight: '25.7%' },
      { symbol: 'AGIX', weight: '22.4%' },
      { symbol: 'NMR', weight: '15.1%' }
    ]
  },
  metaverse: {
    name: 'Metaverse Index',
    description: 'Virtual World & Gaming',
    icon: '/baevii-logo.png',
    iconText: 'M',
    expenseRatio: '0.40%',
    aum: '$5.1M',
    performance30D: '+28.5%',
    holdings: [
      { symbol: 'MANA', weight: '28.5%' },
      { symbol: 'SAND', weight: '25.3%' },
      { symbol: 'AXS', weight: '20.1%' },
      { symbol: 'ENJ', weight: '15.4%' }
    ]
  },
  layer2: {
    name: 'Layer 2 Growth',
    description: 'Scaling Solutions Index',
    icon: '/baevii-logo.png',
    iconText: 'L2',
    expenseRatio: '0.38%',
    aum: '$7.3M',
    performance30D: '+31.2%',
    holdings: [
      { symbol: 'MATIC', weight: '32.1%' },
      { symbol: 'ARB', weight: '28.4%' },
      { symbol: 'OP', weight: '22.3%' },
      { symbol: 'IMX', weight: '12.5%' }
    ]
  },
  privacy: {
    name: 'Privacy Focus',
    description: 'Privacy Tech Index',
    icon: '/baevii-logo.png',
    iconText: 'P',
    expenseRatio: '0.42%',
    aum: '$4.2M',
    performance30D: '+19.8%',
    holdings: [
      { symbol: 'XMR', weight: '35.5%' },
      { symbol: 'ZEC', weight: '25.2%' },
      { symbol: 'SCRT', weight: '20.1%' },
      { symbol: 'ROSE', weight: '14.5%' }
    ]
  },
  cryptoCasey: {
    name: 'Crypto Casey',
    description: 'Technical Analysis Focus',
    icon: '/baevii-logo.png',
    iconText: 'C',
    expenseRatio: '0.40%',
    aum: '$4.8M',
    performance30D: '+19.5%',
    holdings: [
      { symbol: 'BTC', weight: '40.2%' },
      { symbol: 'ETH', weight: '35.7%' },
      { symbol: 'ADA', weight: '12.4%' },
      { symbol: 'DOT', weight: '8.1%' }
    ]
  },
  coinBureau: {
    name: 'Coin Bureau',
    description: 'Research-Driven Portfolio',
    icon: '/baevii-logo.png',
    iconText: 'CB',
    expenseRatio: '0.35%',
    aum: '$9.2M',
    performance30D: '+22.7%',
    holdings: [
      { symbol: 'ETH', weight: '35.0%' },
      { symbol: 'DOT', weight: '25.5%' },
      { symbol: 'LINK', weight: '20.2%' },
      { symbol: 'ATOM', weight: '15.8%' }
    ]
  },
  digitalAssets: {
    name: 'Digital Assets',
    description: 'Institutional Grade',
    icon: '/baevii-logo.png',
    iconText: 'DA',
    expenseRatio: '0.32%',
    aum: '$15.4M',
    performance30D: '+17.9%',
    holdings: [
      { symbol: 'BTC', weight: '45.0%' },
      { symbol: 'ETH', weight: '35.0%' },
      { symbol: 'SOL', weight: '12.5%' },
      { symbol: 'AVAX', weight: '7.5%' }
    ]
  }
};

export default function DashboardPage() {
  const { isAuthenticated, user } = useMoralisAuth();
  const [selectedETF, setSelectedETF] = useState<keyof typeof mockETFs | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome to BAEVII ETF Manager</h1>
          <p className="text-muted-foreground max-w-md">
            Connect your wallet to start managing your ETFs with AI-powered insights.
          </p>
        </div>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Your ETF portfolio overview.
          </p>
        </div>
        <WalletConnectButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
            <CardTitle>Wallet Status</CardTitle>
            <CardDescription>Your connected wallet information</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Address:</span>
                <span className="text-sm font-mono">
                  {user?.address.slice(0, 6)}...{user?.address.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Chain:</span>
                <span className="text-sm">{user?.chainId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Connected:</span>
                <span className="text-sm">
                  {user?.authenticatedAt ? new Date(user.authenticatedAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Current native token balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">-- ETH</div>
              <div className="text-xs text-muted-foreground">
                Balance will be displayed here
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ETF Portfolio</CardTitle>
            <CardDescription>Your managed ETFs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No ETFs created yet</p>
              <Button>Create Your First ETF</Button>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Our ETFs Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Our ETFs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(mockETFs).slice(0, 3).map(([key, etf]) => (
            <Card
              key={key}
              className="hover:shadow-lg transition-all duration-200 border border-gray-200 bg-card h-auto flex flex-col cursor-pointer pt-4 px-1 pb-4"
              onClick={() => setSelectedETF(key as keyof typeof mockETFs)}
            >
              <CardHeader className="pt-0 pb-0 border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      {etf.iconText}
                    </div>
                    <div>
                      <CardTitle className="text-xs font-semibold text-foreground leading-tight mb-0">{etf.name}</CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground leading-tight mt-0">{etf.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium">ER</div>
                    <div className="text-xs font-semibold text-foreground">{etf.expenseRatio}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="space-y-0 flex-1">
                  <div className="flex justify-between items-center mt-0 mb-0">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-medium">AUM</div>
                      <div className="text-xs font-bold text-foreground">{etf.aum}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground font-medium">30D</div>
                      <div className="text-xs font-bold text-green-600">{etf.performance30D}</div>
                    </div>
                  </div>
                  <div className="mt-0 mb-0">
                    <div className="flex justify-between items-center mb-0 mt-0">
                      <span className="text-[10px] font-medium text-foreground">Top Holdings</span>
                      <span className="text-[10px] text-muted-foreground">Weight</span>
                </div>
                    <div className="space-y-0">
                      {etf.holdings.map((h) => (
                        <div key={h.symbol} className="flex justify-between items-center">
                          <span className="text-[10px] font-medium text-foreground">{h.symbol}</span>
                          <span className="text-[10px] text-muted-foreground">{h.weight}</span>
                </div>
                      ))}
                </div>
                </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Influencer ETFs Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Influencer ETFs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(mockETFs).slice(3).map(([key, etf]) => (
            <Card
              key={key}
              className="hover:shadow-lg transition-all duration-200 border border-gray-200 bg-card h-auto flex flex-col cursor-pointer pt-4 px-1 pb-4"
              onClick={() => setSelectedETF(key as keyof typeof mockETFs)}
            >
              <CardHeader className="pt-0 pb-0 border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                      {etf.iconText}
                    </div>
                    <div>
                      <CardTitle className="text-xs font-semibold text-foreground leading-tight mb-0">{etf.name}</CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground leading-tight mt-0">{etf.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium">ER</div>
                    <div className="text-xs font-semibold text-foreground">{etf.expenseRatio}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="space-y-0 flex-1">
                  <div className="flex justify-between items-center mt-0 mb-0">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-medium">AUM</div>
                      <div className="text-xs font-bold text-foreground">{etf.aum}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground font-medium">30D</div>
                      <div className="text-xs font-bold text-green-600">{etf.performance30D}</div>
                    </div>
                  </div>
                  <div className="mt-0 mb-0">
                    <div className="flex justify-between items-center mb-0 mt-0">
                      <span className="text-[10px] font-medium text-foreground">Top Holdings</span>
                      <span className="text-[10px] text-muted-foreground">Weight</span>
                    </div>
                    <div className="space-y-0">
                      {etf.holdings.map((h) => (
                        <div key={h.symbol} className="flex justify-between items-center">
                          <span className="text-[10px] font-medium text-foreground">{h.symbol}</span>
                          <span className="text-[10px] text-muted-foreground">{h.weight}</span>
                      </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ETF Detail Dialog */}
      {selectedETF && (
        <ETFDetailDialog
          isOpen={true}
          onClose={() => setSelectedETF(null)}
          etf={mockETFs[selectedETF]}
        />
      )}
    </div>
  );
} 