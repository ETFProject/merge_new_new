'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ThreePieChart } from '@/components/3d/ThreePieChart';
import { ThreeOrbitalView } from '@/components/3d/ThreeOrbitalView';
import { ThreeBarChart } from '@/components/3d/ThreeBarChart';
import { ThreeNetworkGraph } from '@/components/3d/ThreeNetworkGraph';
import { TransitionWrapper } from "@/components/ui/transition-wrapper";

// Mock data for the charts with vibrant colors
const mockPerformanceData = {
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
  chainDistribution: [
    { chain: 'Ethereum', percentage: 45, color: '#FF6B6B', icon: '/tornado.png' },
    { chain: 'Flow', percentage: 25, color: '#4ECDC4', icon: '/jellyfish.png' },
    { chain: 'Base', percentage: 15, color: '#45B7D1', icon: '/sandwave.png' },
    { chain: 'Avalanche', percentage: 10, color: '#96CEB4', icon: '/musicrainfdbow.png' },
    { chain: 'Solana', percentage: 5, color: '#FFEAA7', icon: '/flower.png' },
  ],
  assetAllocation: [
    { category: 'DeFi', percentage: 35, icon: '/1byone20.jpg', color: '#FF6B9D' },
    { category: 'Layer 1', percentage: 25, icon: '/tornado.png', color: '#4ECDC4' },
    { category: 'NFT & Gaming', percentage: 15, icon: '/cactus.png', color: '#FFE66D' },
    { category: 'Infrastructure', percentage: 15, icon: '/jellowchurch.png', color: '#FF6B6B' },
    { category: 'Stablecoins', percentage: 10, icon: '/donut.png', color: '#A8E6CF' }
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

export interface AnalyticsChartProps {
  selectedTab?: string;
  timeframe?: string;
}

export function AnalyticsChart({ selectedTab = 'performance', timeframe = '1w' }: AnalyticsChartProps) {
  const [chartType, setChartType] = useState(selectedTab);
  const [period, setPeriod] = useState(timeframe);
  
  // Render different charts based on chartType
  const renderChart = () => {
    switch (chartType) {
      case 'performance':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full flex flex-col items-center justify-center p-4" role="img" aria-label={`Performance chart for ${period} timeframe`}>
              <div className="w-full max-w-3xl">
                <div className="mb-4 bg-muted/30 p-6 rounded-lg">
                  <p className="font-medium mb-2 text-center">Portfolio Performance</p>
                  <ThreeBarChart data={mockPerformanceData.daily} />
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'allocation':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full flex flex-col items-center justify-center p-4" role="region" aria-label="Asset Allocation">
              <div className="w-full max-w-4xl">
                <div className="flex justify-center">
                  <ThreePieChart data={mockPerformanceData.assetAllocation} />
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'chains':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full flex flex-col items-center justify-center p-4" role="region" aria-label="Chain Distribution">
              <div className="w-full max-w-4xl">
                <ThreeOrbitalView
                  data={mockPerformanceData.chainDistribution}
                  centerIcon="/baevii-logo.png"
                />

                {/* Cross-Chain Distribution Insight */}
                <div className="mt-8 bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Image src="/baevii-logo.png" alt="BAEVII" width={20} height={20} />
                    <span className="font-medium">Cross-Chain Distribution Insight</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your portfolio is well-diversified across multiple chains, with a balanced allocation that reduces blockchain-specific risks. Consider increasing your Base allocation to take advantage of lower gas fees and higher yields currently available there.
                  </p>
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'history':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full flex flex-col items-center justify-center p-4" role="region" aria-label="Cross-Chain Activity">
              <div className="w-full max-w-4xl">
                <ThreeNetworkGraph
                  nodes={mockPerformanceData.networkNodes}
                  flows={mockPerformanceData.networkFlows}
                />
              </div>
            </div>
          </TransitionWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-[500px] flex items-center justify-center">
      {renderChart()}
    </div>
  );
} 