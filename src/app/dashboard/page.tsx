'use client';

import { useState } from 'react';
import { useMoralisAuth } from '@/components/MoralisAuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { ITFDetailDialog } from '@/components/etf/etf-detail-dialog';
import Image from 'next/image';

// Mock ITF data
const mockITFs = {
  blueChip: {
    name: 'BAEVII Blue Chip',
    description: 'Large-Cap Crypto Index',
    icon: '/baevii-logo.png',
    influencerImage: '/chatgpt.png',
    expenseRatio: '0.25%',
    aum: '$12.4M',
    performance30D: '+16.3%',
    bio: 'A diversified portfolio of established large-cap cryptocurrencies designed for long-term growth and stability. This ITF focuses on proven projects with strong fundamentals and market leadership.',
    socialMedia: {
      twitter: 'https://twitter.com/baevii_bluechip',
      youtube: 'https://youtube.com/@baevii_bluechip',
      telegram: 'https://t.me/baevii_bluechip',
      discord: 'https://discord.gg/baevii'
    },
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
    influencerImage: '/coffee.png',
    expenseRatio: '0.35%',
    aum: '$8.7M',
    performance30D: '+24.7%',
    bio: 'Targeting the most innovative DeFi protocols that are reshaping traditional finance. This ITF captures the growth potential of decentralized lending, trading, and yield farming platforms.',
    socialMedia: {
      twitter: 'https://twitter.com/baevii_defi',
      youtube: 'https://youtube.com/@baevii_defi',
      telegram: 'https://t.me/baevii_defi',
      discord: 'https://discord.gg/baevii'
    },
    holdings: [
      { symbol: 'FLOW', weight: '40%' },
      { symbol: 'BTC', weight: '25%' },
      { symbol: 'UNI', weight: '20%' },
      { symbol: 'AAVE', weight: '15%' }
    ]
  },
  aiWeb3: {
    name: 'AI & Web3',
    description: 'AI Innovation Index',
    icon: '/baevii-logo.png',
    influencerImage: '/cassette.png',
    expenseRatio: '0.45%',
    aum: '$6.2M',
    performance30D: '+42.1%',
    bio: 'The future of AI meets blockchain. This ITF invests in projects at the intersection of artificial intelligence and Web3, including decentralized AI networks, data marketplaces, and AI-powered DeFi protocols.',
    socialMedia: {
      twitter: 'https://twitter.com/baevii_ai',
      youtube: 'https://youtube.com/@baevii_ai',
      telegram: 'https://t.me/baevii_ai',
      discord: 'https://discord.gg/baevii'
    },
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
    influencerImage: '/donut.png',
    expenseRatio: '0.40%',
    aum: '$5.1M',
    performance30D: '+28.5%',
    bio: 'Dive into the digital frontier with this metaverse-focused ITF. From virtual real estate to gaming tokens, this portfolio captures the growth of immersive digital experiences and virtual economies.',
    socialMedia: {
      twitter: 'https://twitter.com/baevii_metaverse',
      youtube: 'https://youtube.com/@baevii_metaverse',
      telegram: 'https://t.me/baevii_metaverse',
      discord: 'https://discord.gg/baevii'
    },
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
    influencerImage: '/flower.png',
    expenseRatio: '0.38%',
    aum: '$7.3M',
    performance30D: '+31.2%',
    bio: 'Scaling the future of blockchain. This ITF focuses on Layer 2 solutions that are solving Ethereum\'s scalability challenges, including rollups, sidechains, and other scaling technologies.',
    socialMedia: {
      twitter: 'https://twitter.com/baevii_l2',
      youtube: 'https://youtube.com/@baevii_l2',
      telegram: 'https://t.me/baevii_l2',
      discord: 'https://discord.gg/baevii'
    },
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
    influencerImage: '/giraffehorn.png',
    expenseRatio: '0.42%',
    aum: '$4.2M',
    performance30D: '+19.8%',
    bio: 'Privacy is a fundamental human right. This ITF invests in privacy-focused cryptocurrencies and protocols that protect user data and enable anonymous transactions in the digital age.',
    socialMedia: {
      twitter: 'https://twitter.com/baevii_privacy',
      youtube: 'https://youtube.com/@baevii_privacy',
      telegram: 'https://t.me/baevii_privacy',
      discord: 'https://discord.gg/baevii'
    },
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
    influencerImage: '/ice.png',
    expenseRatio: '0.40%',
    aum: '$4.8M',
    performance30D: '+19.5%',
    bio: 'Curated by renowned crypto analyst Crypto Casey, this ITF combines technical analysis with fundamental research to identify high-potential projects with strong momentum and growth prospects.',
    socialMedia: {
      twitter: 'https://twitter.com/cryptocasey',
      youtube: 'https://youtube.com/@cryptocasey',
      telegram: 'https://t.me/cryptocasey',
      discord: 'https://discord.gg/cryptocasey'
    },
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
    influencerImage: '/jellowchurch.png',
    expenseRatio: '0.35%',
    aum: '$9.2M',
    performance30D: '+22.7%',
    bio: 'Backed by Coin Bureau\'s extensive research and analysis, this ITF focuses on projects with strong fundamentals, clear use cases, and sustainable tokenomics. Perfect for investors who value thorough due diligence.',
    socialMedia: {
      twitter: 'https://twitter.com/coinbureau',
      youtube: 'https://youtube.com/@coinbureau',
      telegram: 'https://t.me/coinbureau',
      discord: 'https://discord.gg/coinbureau'
    },
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
    influencerImage: '/jellyfish.png',
    expenseRatio: '0.32%',
    aum: '$15.4M',
    performance30D: '+17.9%',
    bio: 'Institutional-grade digital asset allocation designed for long-term wealth preservation and growth. This ITF focuses on established cryptocurrencies with proven track records and strong institutional adoption.',
    socialMedia: {
      twitter: 'https://twitter.com/baevii_institutional',
      youtube: 'https://youtube.com/@baevii_institutional',
      telegram: 'https://t.me/baevii_institutional',
      discord: 'https://discord.gg/baevii'
    },
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
  const [selectedITF, setSelectedITF] = useState<keyof typeof mockITFs | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome to BAEVII ITF Manager</h1>
          <p className="text-muted-foreground max-w-md">
            Connect your wallet to start managing your ITFs with AI-powered insights.
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
            Welcome back! Your ITF portfolio overview.
          </p>
        </div>
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
            <CardTitle>ITF Portfolio</CardTitle>
            <CardDescription>Your managed ITFs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No ITFs created yet</p>
              <Button>Create Your First ITF</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Our ITFs Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Our ITFs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(mockITFs).slice(0, 3).map(([key, itf]) => (
            <Card
              key={key}
              className="hover:shadow-lg transition-all duration-200 border border-gray-200 bg-card h-auto flex flex-col cursor-pointer pt-4 px-1 pb-4"
              onClick={() => setSelectedITF(key as keyof typeof mockITFs)}
            >
              <CardHeader className="pt-0 pb-0 border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden">
                      <Image 
                        src={itf.influencerImage} 
                        alt={itf.name}
                        width={28} 
                        height={28} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <CardTitle className="text-xs font-semibold text-foreground leading-tight mb-0">{itf.name}</CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground leading-tight mt-0">{itf.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium">ER</div>
                    <div className="text-xs font-semibold text-foreground">{itf.expenseRatio}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="space-y-0 flex-1">
                  <div className="flex justify-between items-center mt-0 mb-0">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-medium">AUM</div>
                      <div className="text-xs font-bold text-foreground">{itf.aum}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground font-medium">30D</div>
                      <div className="text-xs font-bold text-green-600">{itf.performance30D}</div>
                    </div>
                  </div>
                  <div className="mt-0 mb-0">
                    <div className="flex justify-between items-center mb-0 mt-0">
                      <span className="text-[10px] font-medium text-foreground">Top Holdings</span>
                      <span className="text-[10px] text-muted-foreground">Weight</span>
                    </div>
                    <div className="space-y-0">
                      {itf.holdings.map((h) => (
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

      {/* Influencer ITFs Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Influencer ITFs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(mockITFs).slice(3).map(([key, itf]) => (
            <Card
              key={key}
              className="hover:shadow-lg transition-all duration-200 border border-gray-200 bg-card h-auto flex flex-col cursor-pointer pt-4 px-1 pb-4"
              onClick={() => setSelectedITF(key as keyof typeof mockITFs)}
            >
              <CardHeader className="pt-0 pb-0 border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden">
                      <Image 
                        src={itf.influencerImage} 
                        alt={itf.name}
                        width={28} 
                        height={28} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <CardTitle className="text-xs font-semibold text-foreground leading-tight mb-0">{itf.name}</CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground leading-tight mt-0">{itf.description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium">ER</div>
                    <div className="text-xs font-semibold text-foreground">{itf.expenseRatio}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="space-y-0 flex-1">
                  <div className="flex justify-between items-center mt-0 mb-0">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-medium">AUM</div>
                      <div className="text-xs font-bold text-foreground">{itf.aum}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground font-medium">30D</div>
                      <div className="text-xs font-bold text-green-600">{itf.performance30D}</div>
                    </div>
                  </div>
                  <div className="mt-0 mb-0">
                    <div className="flex justify-between items-center mb-0 mt-0">
                      <span className="text-[10px] font-medium text-foreground">Top Holdings</span>
                      <span className="text-[10px] text-muted-foreground">Weight</span>
                    </div>
                    <div className="space-y-0">
                      {itf.holdings.map((h) => (
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

      {/* ITF Detail Dialog */}
      {selectedITF && (
        <ITFDetailDialog
          isOpen={true}
          onClose={() => setSelectedITF(null)}
          itf={mockITFs[selectedITF]}
        />
      )}
    </div>
  );
} 