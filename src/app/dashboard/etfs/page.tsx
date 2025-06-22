'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ITFDetailDialog } from "@/components/etf/etf-detail-dialog";
import Image from "next/image";
import { Plus, TrendingUp, TrendingDown, Eye, Edit, Trash2 } from "lucide-react";

// Mock ITF data for the user's portfolios
const mockUserITFs = {
  blueChip: {
    name: 'My Blue Chip ITF',
    description: 'Personal Large-Cap Crypto Index',
    icon: '/baevii-logo.png',
    influencerImage: '/chatgpt.png',
    expenseRatio: '0.25%',
    aum: '$2.4M',
    performance30D: '+16.3%',
    holdings: [
      { symbol: 'BTC', weight: '40.0%' },
      { symbol: 'ETH', weight: '30.0%' },
      { symbol: 'SOL', weight: '20.0%' },
      { symbol: 'BNB', weight: '10.0%' }
    ],
    status: 'active',
    createdAt: '2024-01-15',
    shares: '1,250',
    value: '$2,400'
  },
  defiGrowth: {
    name: 'DeFi Growth Portfolio',
    description: 'Personal DeFi Protocol Index',
    icon: '/baevii-logo.png',
    influencerImage: '/coffee.png',
    expenseRatio: '0.35%',
    aum: '$1.7M',
    performance30D: '+24.7%',
    holdings: [
      { symbol: 'UNI', weight: '30.0%' },
      { symbol: 'AAVE', weight: '25.0%' },
      { symbol: 'MKR', weight: '25.0%' },
      { symbol: 'SNX', weight: '20.0%' }
    ],
    status: 'active',
    createdAt: '2024-02-01',
    shares: '850',
    value: '$1,700'
  },
  aiWeb3: {
    name: 'AI & Web3 Innovation',
    description: 'Personal AI Innovation Index',
    icon: '/baevii-logo.png',
    influencerImage: '/cassette.png',
    expenseRatio: '0.45%',
    aum: '$1.2M',
    performance30D: '+42.1%',
    holdings: [
      { symbol: 'OCEAN', weight: '30.0%' },
      { symbol: 'FET', weight: '30.0%' },
      { symbol: 'AGIX', weight: '20.0%' },
      { symbol: 'NMR', weight: '20.0%' }
    ],
    status: 'active',
    createdAt: '2024-02-15',
    shares: '600',
    value: '$1,200'
  }
};

export default function MyITFsPage() {
  const [selectedITF, setSelectedITF] = useState<keyof typeof mockUserITFs | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My ITFs</h1>
          <p className="text-muted-foreground">
            Manage your personal ITF portfolios and track their performance
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create New ITF
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">3</div>
            <div className="text-sm text-muted-foreground">Total ITFs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">$5.3M</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">+27.7%</div>
            <div className="text-sm text-muted-foreground">30D Performance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">2,700</div>
            <div className="text-sm text-muted-foreground">Total Shares</div>
          </CardContent>
        </Card>
      </div>

      {/* ITF Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(mockUserITFs).map(([key, itf]) => (
          <Card key={key} className="hover:shadow-lg transition-all duration-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden">
                    <Image 
                      src={itf.influencerImage} 
                      alt={itf.name}
                      width={40} 
                      height={40} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{itf.name}</CardTitle>
                    <CardDescription className="text-sm">{itf.description}</CardDescription>
                  </div>
                </div>
                <div className="px-2 py-1 bg-muted rounded-md text-xs">
                  {itf.status}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Value</div>
                  <div className="font-semibold">{itf.value}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Shares</div>
                  <div className="font-semibold">{itf.shares}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">30D Performance</div>
                  <div className={`font-semibold ${itf.performance30D.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {itf.performance30D}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Expense Ratio</div>
                  <div className="font-semibold">{itf.expenseRatio}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-2"
                  onClick={() => setSelectedITF(key as keyof typeof mockUserITFs)}
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      <Card className="text-center py-12">
        <CardContent>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No ITFs Created Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start building your portfolio by creating your first ITF
          </p>
          <Button>Create Your First ITF</Button>
        </CardContent>
      </Card>

      {/* ITF Detail Dialog */}
      {selectedITF && (
        <ITFDetailDialog
          isOpen={true}
          onClose={() => setSelectedITF(null)}
          itf={mockUserITFs[selectedITF]}
        />
      )}
    </div>
  );
} 