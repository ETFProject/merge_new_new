'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Mock data for user's current ETF investments
const userInvestments = {
  name: "John Doe",
  totalValue: "$145,328.42",
  totalChange: 2.4,
  etfs: [
    { 
      id: "etf123", 
      name: "Growth ETF", 
      description: "Diversified growth portfolio across major crypto assets",
      value: "$78,452.18", 
      invested: "$75,000.00",
      change: 3.2,
      allocation: "45% BTC, 25% ETH, 20% SOL, 10% MATIC",
      apy: "12.4%",
      status: "Active"
    },
    { 
      id: "etf456", 
      name: "Tech Basket", 
      description: "Technology-focused DeFi protocols and tokens",
      value: "$45,129.33", 
      invested: "$42,000.00",
      change: -0.8,
      allocation: "40% UNI, 30% AAVE, 20% COMP, 10% MKR",
      apy: "8.7%",
      status: "Active"
    },
    { 
      id: "etf789", 
      name: "DeFi Portfolio", 
      description: "High-yield DeFi staking and liquidity protocols",
      value: "$21,746.91", 
      invested: "$20,000.00",
      change: 5.7,
      allocation: "35% WETH, 25% USDC, 25% DAI, 15% LINK",
      apy: "15.2%",
      status: "Active"
    }
  ]
};

// Mock data for available ETF funds to invest in
const availableETFs = [
  {
    id: "available1",
    name: "Blue Chip Crypto",
    description: "Conservative portfolio of established cryptocurrencies",
    manager: "BAEVII Protocol",
    tvl: "$2.4M",
    apy: "10.8%",
    risk: "Low",
    allocation: "60% BTC, 30% ETH, 10% BNB",
    minInvestment: "$100",
    category: "Conservative",
    influencer: {
      name: "Michael Saylor",
      image: "/chatgpt.png",
      twitter: "@saylor"
    }
  },
  {
    id: "available2",
    name: "AI & Web3",
    description: "Artificial Intelligence and Web3 infrastructure tokens",
    manager: "BAEVII Labs",
    tvl: "$1.8M",
    apy: "18.5%",
    risk: "Medium",
    allocation: "30% FET, 25% OCEAN, 20% SingularityNET, 25% Other",
    minInvestment: "$250",
    category: "Technology",
    influencer: {
      name: "Vitalik Buterin",
      image: "/jellyfish.png",
      twitter: "@VitalikButerin"
    }
  },
  {
    id: "available3",
    name: "Layer 1 Champions",
    description: "Top performing Layer 1 blockchain protocols",
    manager: "Crypto Ventures",
    tvl: "$3.1M",
    apy: "14.2%",
    risk: "Medium",
    allocation: "25% SOL, 25% AVAX, 25% ATOM, 25% DOT",
    minInvestment: "$500",
    category: "Infrastructure",
    influencer: {
      name: "Anatoly Yakovenko",
      image: "/tornado.png",
      twitter: "@aeyakovenko"
    }
  },
  {
    id: "available4",
    name: "Yield Farming Max",
    description: "Aggressive high-yield farming strategies",
    manager: "DeFi Masters",
    tvl: "$956K",
    apy: "24.7%",
    risk: "High",
    allocation: "Dynamic allocation based on highest yields",
    minInvestment: "$1,000",
    category: "High Yield",
    influencer: {
      name: "Andre Cronje",
      image: "/flower.png",
      twitter: "@AndreCronjeTech"
    }
  },
  {
    id: "available5",
    name: "Gaming & NFTs",
    description: "Gaming tokens and NFT ecosystem projects",
    manager: "Metaverse Fund",
    tvl: "$1.2M",
    apy: "16.3%",
    risk: "High",
    allocation: "30% AXS, 20% SAND, 20% MANA, 30% Other",
    minInvestment: "$200",
    category: "Gaming",
    influencer: {
      name: "Yat Siu",
      image: "/cactus.png",
      twitter: "@ysiu"
    }
  },
  {
    id: "available6",
    name: "Stablecoin Plus",
    description: "Enhanced yield on stablecoin reserves",
    manager: "Stable Yields",
    tvl: "$5.7M",
    apy: "6.8%",
    risk: "Very Low",
    allocation: "40% USDC, 30% DAI, 20% USDT, 10% FRAX",
    minInvestment: "$50",
    category: "Stablecoin",
    influencer: {
      name: "Rune Christensen",
      image: "/donut.png",
      twitter: "@RuneKek"
    }
  }
];

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "Very Low": return "bg-green-100 text-green-800";
    case "Low": return "bg-green-100 text-green-800";
    case "Medium": return "bg-yellow-100 text-yellow-800";
    case "High": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userInvestments.name}. Manage your ETF portfolio and discover new investment opportunities.
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button className="w-full md:w-auto">
            Create New ETF
          </Button>
        </Link>
      </div>

      {/* Portfolio Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
          <CardDescription>Overview of your total ETF investments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{userInvestments.totalValue}</p>
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-semibold ${userInvestments.totalChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {userInvestments.totalChange > 0 ? '+' : ''}{userInvestments.totalChange}%
              </p>
              <p className="text-sm text-muted-foreground">24h Change</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your ETF Investments */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your ETF Investments</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userInvestments.etfs.map((etf) => (
            <Card key={etf.id} className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{etf.name}</CardTitle>
                  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRiskColor(etf.status)}`}>
                    {etf.status}
                  </div>
                </div>
                <CardDescription>{etf.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Value:</span>
                  <span className="font-semibold">{etf.value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invested:</span>
                  <span>{etf.invested}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">24h Change:</span>
                  <span className={`font-semibold ${etf.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {etf.change > 0 ? '+' : ''}{etf.change}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">APY:</span>
                  <span className="font-semibold text-green-600">{etf.apy}</span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">Allocation:</p>
                  <p className="text-sm">{etf.allocation}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Manage Position
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Available ETF Funds */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Available ETF Funds</h2>
          <p className="text-sm text-muted-foreground">{availableETFs.length} funds available</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableETFs.map((etf) => (
            <Card key={etf.id} className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{etf.name}</CardTitle>
                  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRiskColor(etf.risk)}`}>
                    {etf.risk}
                  </div>
                </div>
                <CardDescription>{etf.description}</CardDescription>
                
                {/* Influencer Section */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image 
                      src={etf.influencer.image} 
                      alt={etf.influencer.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{etf.influencer.name}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">𝕏</span>
                      </div>
                      <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                        {etf.influencer.twitter}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Manager:</span>
                  <span className="text-sm font-medium">{etf.manager}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">TVL:</span>
                  <span className="font-semibold">{etf.tvl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">APY:</span>
                  <span className="font-semibold text-green-600">{etf.apy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Min Investment:</span>
                  <span className="text-sm">{etf.minInvestment}</span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">Allocation:</p>
                  <p className="text-sm">{etf.allocation}</p>
                </div>
                <div className="inline-flex items-center rounded-full border-transparent bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold w-fit">
                  {etf.category}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  Invest Now
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 