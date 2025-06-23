'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { SimplePieChart } from '@/components/2d/SimplePieChart';
import { SimpleDistributionChart } from '@/components/2d/SimpleDistributionChart';
import { ThreeBarChart } from '@/components/3d/ThreeBarChart';
import { ThreeNetworkGraph } from '@/components/3d/ThreeNetworkGraph';
import { TransitionWrapper } from "@/components/ui/transition-wrapper";

// ITF data interface
interface ITFData {
  name: string;
  description: string;
  icon: string;
  influencerImage: string;
  expenseRatio: string;
  aum: string;
  performance30D: string;
  bio?: string;
  socialMedia?: {
    twitter?: string;
    youtube?: string;
    telegram?: string;
    discord?: string;
  };
  holdings: Array<{ symbol: string; weight: string }>;
}

// Generate performance data based on ITF characteristics
const generatePerformanceData = (itf: ITFData) => {
  const baseValue = 100;
  const performance = parseFloat(itf.performance30D.replace(/[^0-9.-]/g, ''));
  const volatility = Math.abs(performance) * 0.3; // Higher performance = higher volatility
  
  const daily = [];
  for (let i = 0; i < 30; i++) {
    const dayVariation = (Math.random() - 0.5) * volatility;
    const trend = (performance / 30) * i; // Gradual trend over 30 days
    const value = baseValue + trend + dayVariation;
    daily.push({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.max(50, Math.round(value * 100) / 100)
    });
  }
  
  return daily;
};

// Generate asset allocation data from ITF holdings
const generateAssetAllocationData = (itf: ITFData) => {
  const colors = ['#FF6B9D', '#4ECDC4', '#FFE66D', '#FF6B6B', '#A8E6CF', '#9B59B6', '#3498DB', '#E67E22'];
  
  return itf.holdings.map((holding, index) => ({
    category: holding.symbol,
    percentage: parseFloat(holding.weight),
    color: colors[index % colors.length],
    icon: `/baevii-logo.png`, // Default icon, could be enhanced with token-specific icons
    index,
  }));
};

// Generate chain distribution based on ITF type
const generateChainDistributionData = (itf: ITFData) => {
  const chainData = [
    { chain: 'Ethereum', percentage: 0, color: '#FF6B6B', icon: '/tornado.png' },
    { chain: 'Flow', percentage: 0, color: '#4ECDC4', icon: '/jellyfish.png' },
    { chain: 'Base', percentage: 0, color: '#45B7D1', icon: '/sandwave.png' },
    { chain: 'Avalanche', percentage: 0, color: '#96CEB4', icon: '/musicrainfdbow.png' },
    { chain: 'Solana', percentage: 0, color: '#FFEAA7', icon: '/flower.png' },
  ];
  
  // Distribute based on ITF characteristics
  if (itf.name.includes('Blue Chip') || itf.name.includes('Digital Assets')) {
    chainData[0].percentage = 60; // Ethereum heavy
    chainData[2].percentage = 25; // Base
    chainData[4].percentage = 15; // Solana
  } else if (itf.name.includes('DeFi')) {
    chainData[0].percentage = 45; // Ethereum
    chainData[1].percentage = 30; // Flow
    chainData[2].percentage = 25; // Base
  } else if (itf.name.includes('Layer 2')) {
    chainData[0].percentage = 40; // Ethereum
    chainData[2].percentage = 40; // Base
    chainData[1].percentage = 20; // Flow
  } else if (itf.name.includes('AI') || itf.name.includes('Web3')) {
    chainData[1].percentage = 50; // Flow heavy
    chainData[0].percentage = 30; // Ethereum
    chainData[3].percentage = 20; // Avalanche
  } else {
    // Default distribution
    chainData[0].percentage = 35;
    chainData[1].percentage = 25;
    chainData[2].percentage = 20;
    chainData[3].percentage = 15;
    chainData[4].percentage = 5;
  }
  
  return chainData
    .filter(chain => chain.percentage > 0)
    .map(chain => ({
      ...chain,
      category: chain.chain, // Add category field for consistency
    }));
};

// Generate network flow data
const generateNetworkFlowData = (chainDistribution: any[]) => {
  const nodes = chainDistribution.map((chain, index) => ({
    id: chain.chain.toLowerCase(),
    label: chain.chain,
    icon: chain.icon,
    color: chain.color,
    position: [
      Math.cos((index / chainDistribution.length) * Math.PI * 2) * 2,
      0,
      Math.sin((index / chainDistribution.length) * Math.PI * 2) * 2
    ] as [number, number, number]
  }));
  
  const flows = [];
  for (let i = 0; i < nodes.length; i++) {
    const nextIndex = (i + 1) % nodes.length;
    flows.push({
      from: nodes[i].id,
      to: nodes[nextIndex].id,
      color: nodes[i].color
    });
  }
  
  return { nodes, flows };
};

export interface AnalyticsChartProps {
  selectedTab?: string;
  timeframe?: string;
  itfData?: ITFData; // New prop for ITF data
}

export function AnalyticsChart({ selectedTab = 'performance', timeframe = '1w', itfData }: AnalyticsChartProps) {
  const [chartType, setChartType] = useState(selectedTab);
  const [period, setPeriod] = useState(timeframe);
  
  // Generate chart data based on ITF data
  const chartData = useMemo(() => {
    if (!itfData) {
      // Fallback to mock data if no ITF data provided
      return {
        daily: [
          { date: '2023-04-01', value: 100 },
          { date: '2023-04-02', value: 102 },
          { date: '2023-04-03', value: 99 },
          { date: '2023-04-04', value: 101 },
          { date: '2023-04-05', value: 104 },
          { date: '2023-04-06', value: 103 },
          { date: '2023-04-07', value: 105 },
          { date: '2023-04-08', value: 108 },
          { date: '2023-04-09', value: 107 },
          { date: '2023-04-10', value: 110 },
          { date: '2023-04-11', value: 112 },
          { date: '2023-04-12', value: 115 },
        ],
        assetAllocation: [
          { category: 'DeFi', percentage: 35, icon: '/1byone20.jpg', color: '#FF6B9D', index: 0 },
          { category: 'Layer 1', percentage: 25, icon: '/tornado.png', color: '#4ECDC4', index: 1 },
          { category: 'NFT & Gaming', percentage: 15, icon: '/cactus.png', color: '#FFE66D', index: 2 },
          { category: 'Infrastructure', percentage: 15, icon: '/jellowchurch.png', color: '#FF6B6B', index: 3 },
          { category: 'Stablecoins', percentage: 10, icon: '/donut.png', color: '#A8E6CF', index: 4 }
        ],
        chainDistribution: [
          { category: 'Ethereum', chain: 'Ethereum', percentage: 45, color: '#FF6B6B', icon: '/tornado.png' },
          { category: 'Flow', chain: 'Flow', percentage: 25, color: '#4ECDC4', icon: '/jellyfish.png' },
          { category: 'Base', chain: 'Base', percentage: 15, color: '#45B7D1', icon: '/sandwave.png' },
          { category: 'Avalanche', chain: 'Avalanche', percentage: 10, color: '#96CEB4', icon: '/musicrainfdbow.png' },
          { category: 'Solana', chain: 'Solana', percentage: 5, color: '#FFEAA7', icon: '/flower.png' },
        ],
        networkNodes: [
          { id: 'eth', label: 'Ethereum', icon: '/tornado.png', color: '#FF6B6B', position: [-2, 0, -2] as [number, number, number] },
          { id: 'flow', label: 'Flow', icon: '/jellyfish.png', color: '#4ECDC4', position: [2, 0, -2] as [number, number, number] },
          { id: 'base', label: 'Base', icon: '/sandwave.png', color: '#45B7D1', position: [-2, 0, 2] as [number, number, number] },
          { id: 'sol', label: 'Solana', icon: '/flower.png', color: '#FFE66D', position: [2, 0, 2] as [number, number, number] },
        ],
        networkFlows: [
          { from: 'eth', to: 'flow', color: '#FF6B6B' },
          { from: 'flow', to: 'base', color: '#4ECDC4' },
          { from: 'base', to: 'sol', color: '#45B7D1' },
          { from: 'sol', to: 'eth', color: '#FFE66D' },
        ]
      };
    }
    
    const daily = generatePerformanceData(itfData);
    const assetAllocation = generateAssetAllocationData(itfData);
    const chainDistribution = generateChainDistributionData(itfData);
    const { nodes: networkNodes, flows: networkFlows } = generateNetworkFlowData(chainDistribution);
    
    return {
      daily,
      assetAllocation,
      chainDistribution,
      networkNodes,
      networkFlows
    };
  }, [itfData]);
  
  // Render different charts based on chartType
  const renderChart = () => {
    switch (chartType) {
      case 'performance':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full flex flex-col items-center justify-center p-2" role="img" aria-label={`Performance chart for ${itfData?.name || 'Portfolio'} over ${period} timeframe`}>
              <div className="w-full max-w-2xl">
                <div className="mb-4 bg-muted/30 p-4 rounded-lg">
                  <p className="font-medium mb-2 text-center text-sm">
                    {itfData ? `${itfData.name} Performance` : 'Portfolio Performance'}
                  </p>
                  <div className="w-full h-64">
                    <ThreeBarChart data={chartData.daily} />
                  </div>
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'allocation':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full p-2" role="region" aria-label="Asset Allocation">
              <div className="w-full h-[400px] rounded-lg">
                <SimplePieChart data={chartData.assetAllocation} />
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'chains':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full p-2" role="region" aria-label="Chain Distribution">
              <div className="w-full h-[400px] rounded-lg">
                <SimpleDistributionChart data={chartData.chainDistribution} />
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'history':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full flex flex-col items-center justify-center p-2" role="region" aria-label="Cross-Chain Activity">
              <div className="w-full max-w-2xl">
                <div className="w-full h-64">
                  <ThreeNetworkGraph
                    nodes={chartData.networkNodes}
                    flows={chartData.networkFlows}
                    height={256}
                  />
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-[300px] flex items-center justify-center">
      {renderChart()}
    </div>
  );
} 