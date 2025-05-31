/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { TransitionWrapper } from "@/components/ui/transition-wrapper";

// Mock data for the charts
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
    { chain: 'Ethereum', percentage: 45, color: '#627EEA', icon: '/tornado.png' },
    { chain: 'Flow', percentage: 25, color: '#8247E5', icon: '/jellyfish.png' },
    { chain: 'Base', percentage: 15, color: '#0052FF', icon: '/sandwave.png' },
    { chain: 'Avalanche', percentage: 10, color: '#E84142', icon: '/musicrainfdbow.png' },
    { chain: 'Solana', percentage: 5, color: '#00FFA3', icon: '/flower.png' },
  ],
  assetAllocation: [
    { category: 'DeFi', percentage: 35, icon: '/1byone20.jpg' },
    { category: 'Layer 1', percentage: 25, icon: '/tornado.png' },
    { category: 'NFT & Gaming', percentage: 15, icon: '/cactus.png' },
    { category: 'Infrastructure', percentage: 15, icon: '/jellowchurch.png' },
    { category: 'Stablecoins', percentage: 10, icon: '/donut.png' },
  ],
  crossChainFlows: [
    { 
      from: { chain: 'Ethereum', value: 0.5, icon: '/tornado.png' },
      to: { chain: 'Base', value: 0.5, icon: '/sandwave.png' },
      timestamp: '2023-04-10T14:23:15Z',
      txHash: '0x1a2b3c4d5e...'
    },
    { 
      from: { chain: 'Flow', value: 1.2, icon: '/jellyfish.png' },
      to: { chain: 'Ethereum', value: 1.2, icon: '/tornado.png' },
      timestamp: '2023-04-09T09:45:32Z',
      txHash: '0x6f7e8d9c0b...'
    },
    { 
      from: { chain: 'Ethereum', value: 0.8, icon: '/tornado.png' },
      to: { chain: 'Solana', value: 0.8, icon: '/flower.png' },
      timestamp: '2023-04-08T11:17:44Z',
      txHash: '0x2c3d4e5f6g...'
    }
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
            <div className="w-full h-full flex items-center justify-center" role="img" aria-label={`Performance chart for ${period} timeframe`}>
              <div className="text-center w-full">
                <div className="mb-4 bg-muted/30 p-6 rounded-lg">
                  <p className="font-medium mb-2">Portfolio Performance</p>
                  <div className="h-[200px] relative flex items-end justify-between gap-1">
                    {mockPerformanceData.daily.map((day, i) => {
                      const height = (day.value / 115) * 100;
                      return (
                        <div key={day.date} className="relative flex-1 group">
                          <div 
                            className="bg-primary/70 hover:bg-primary rounded-t transition-all" 
                            style={{ height: `${height}%` }}
                            role="presentation"
                          ></div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 bg-card p-1 rounded text-xs whitespace-nowrap transition-all pointer-events-none">
                            {day.date}: {day.value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{mockPerformanceData.daily[0].date}</span>
                    <span>{mockPerformanceData.daily[mockPerformanceData.daily.length - 1].date}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hover over bars for detailed values
                </p>
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'allocation':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full h-full" role="region" aria-label="Asset Allocation">
              <div className="text-center">
                <div className="mb-4 bg-muted/30 p-6 rounded-lg">
                  <h3 className="font-medium mb-4">Asset Allocation</h3>
                  <div className="h-40 relative flex items-center justify-center mb-4">
                    <div className="w-40 h-40 rounded-full overflow-hidden relative">
                      {mockPerformanceData.assetAllocation.map((asset, index, array) => {
                        let rotation = 0;
                        for (let i = 0; i < index; i++) {
                          rotation += (array[i].percentage / 100) * 360;
                        }
                        
                        const percentage = asset.percentage / 100;
                        const hue = index * (360 / array.length);
                        
                        return (
                          <div
                            key={asset.category}
                            className="absolute inset-0 origin-center"
                            style={{
                              clipPath: `conic-gradient(from ${rotation}deg, #000 0%, #000 ${percentage * 360}deg, transparent ${percentage * 360}deg)`,
                              background: `hsl(${hue}, 70%, 60%)`,
                            }}
                            aria-hidden="true"
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    {mockPerformanceData.assetAllocation.map((asset, index) => {
                      const hue = index * (360 / mockPerformanceData.assetAllocation.length);
                      
                      return (
                        <div key={asset.category} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={asset.icon}
                              alt={asset.category}
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{asset.category}</p>
                            <p className="text-sm text-muted-foreground">{asset.percentage}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'chains':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full h-full" role="region" aria-label="Chain Distribution">
              <div className="text-center">
                <div className="mb-4 bg-muted/30 p-6 rounded-lg">
                  <h3 className="font-medium mb-4">Chain Distribution</h3>
                  
                  {/* Chain distribution visualization */}
                  <div className="relative h-56 mb-6">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-card flex items-center justify-center border-2 border-primary/20 z-10">
                        <div className="text-center">
                          <Image src="/1byone20.jpg" alt="BAEVII" width={40} height={40} className="mx-auto" />
                          <p className="text-xs font-medium mt-1">BAEVII</p>
                        </div>
                      </div>
                      
                      {mockPerformanceData.chainDistribution.map((chain, index) => {
                        // Calculate position in a circle around the center
                        const angle = (index / mockPerformanceData.chainDistribution.length) * 2 * Math.PI;
                        const radius = 120; // Distance from center
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        
                        return (
                          <div 
                            key={chain.chain}
                            className="absolute w-16 h-16 rounded-full flex items-center justify-center border border-muted z-20 transition-transform hover:scale-110"
                            style={{ 
                              transform: `translate(${x}px, ${y}px)`,
                              backgroundColor: chain.color + '33', // Add transparency
                            }}
                          >
                            <div className="text-center">
                              <div className="w-8 h-8 mx-auto rounded-full overflow-hidden">
                                <Image src={chain.icon} alt={chain.chain} width={32} height={32} />
                              </div>
                              <p className="text-xs font-medium mt-1">{chain.percentage}%</p>
                            </div>
                            
                            {/* Line connecting to center */}
                            <svg className="absolute top-0 left-0 w-full h-full" style={{ overflow: 'visible' }}>
                              <line 
                                x1="8" 
                                y1="8" 
                                x2="-x" 
                                y2="-y"
                                stroke={chain.color}
                                strokeWidth="1.5"
                                strokeDasharray="4 2"
                                style={{ transform: `translate(${x > 0 ? -x : Math.abs(x)}px, ${y > 0 ? -y : Math.abs(y)}px)` }}
                              />
                            </svg>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Chain list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {mockPerformanceData.chainDistribution.map((chain) => (
                      <div
                        key={chain.chain}
                        className="bg-card/50 rounded-lg p-3 flex items-center gap-3 border hover:border-primary/30 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: chain.color + '20' }}>
                          <Image src={chain.icon} alt={chain.chain} width={24} height={24} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{chain.chain}</p>
                          <p className="text-xs text-muted-foreground">{chain.percentage}% of assets</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'history':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full h-full" role="img" aria-label={`Cross-chain flows for ${period} timeframe`}>
              <div className="text-center bg-muted/30 p-6 rounded-lg w-full">
                <h3 className="font-medium mb-4">Cross-Chain Activity</h3>
                
                {/* Cross-chain flow visualization */}
                <div className="mb-8">
                  <div className="relative h-64 mx-auto">
                    {/* Center lines for visual structure */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-muted/50"></div>
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-muted/50 -translate-x-1/2"></div>
                    
                    {/* Animating dots to represent flow */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute left-1/4 top-1/4 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                      <div className="absolute left-3/4 top-1/4 w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute left-1/4 top-3/4 w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute left-3/4 top-3/4 w-2 h-2 rounded-full bg-orange-500 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                      
                      {/* Moving dots along paths */}
                      <div className="absolute w-3 h-3 rounded-full bg-primary animate-movingDot1"></div>
                      <div className="absolute w-3 h-3 rounded-full bg-primary animate-movingDot2" style={{ animationDelay: '2s' }}></div>
                    </div>
                    
                    {/* Chain nodes */}
                    <div className="absolute left-1/4 top-1/4 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <Image src="/tornado.png" alt="Ethereum" width={40} height={40} />
                    </div>
                    <div className="absolute left-3/4 top-1/4 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                      <Image src="/jellyfish.png" alt="Flow" width={40} height={40} />
                    </div>
                    <div className="absolute left-1/4 top-3/4 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Image src="/sandwave.png" alt="Base" width={40} height={40} />
                    </div>
                    <div className="absolute left-3/4 top-3/4 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                      <Image src="/flower.png" alt="Solana" width={40} height={40} />
                    </div>
                    
                    {/* Connection lines */}
                    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <line x1="25%" y1="25%" x2="75%" y2="25%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="text-muted-foreground" />
                      <line x1="25%" y1="25%" x2="25%" y2="75%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="text-muted-foreground" />
                      <line x1="25%" y1="25%" x2="75%" y2="75%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="text-muted-foreground" />
                      <line x1="75%" y1="25%" x2="25%" y2="75%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="text-muted-foreground" />
                      <line x1="75%" y1="25%" x2="75%" y2="75%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="text-muted-foreground" />
                      <line x1="25%" y1="75%" x2="75%" y2="75%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5" className="text-muted-foreground" />
                    </svg>
                    
                    {/* Center node */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center z-10">
                      <Image src="/1byone20.jpg" alt="ETF Hub" width={40} height={40} />
                    </div>
                  </div>
                </div>
                
                {/* Recent cross-chain transactions */}
                <div className="bg-card/50 rounded-lg p-4 border">
                  <h4 className="font-medium text-sm mb-3">Recent Cross-Chain Transactions</h4>
                  <div className="space-y-3">
                    {mockPerformanceData.crossChainFlows.map((flow, index) => (
                      <div key={index} className="flex items-center p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <Image src={flow.from.icon} alt={flow.from.chain} width={32} height={32} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            {flow.from.value} moved from <span className="font-medium">{flow.from.chain}</span> to <span className="font-medium">{flow.to.chain}</span>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(flow.timestamp).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{flow.txHash}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <Image src={flow.to.icon} alt={flow.to.chain} width={32} height={32} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      default:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Select a chart type to view analytics</p>
              <div className="flex gap-2 mt-4 justify-center">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setChartType('performance')}
                >
                  Performance
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setChartType('allocation')}
                >
                  Asset Allocation
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-2 justify-end">
        <div className="flex p-1 bg-muted/30 rounded-lg" role="radiogroup" aria-label="Chart type selection">
          {[
            { id: 'performance', label: 'Performance', icon: '/1byone7.jpg' },
            { id: 'allocation', label: 'Asset Allocation', icon: '/donut.png' },
            { id: 'chains', label: 'Chain Distribution', icon: '/tornado.png' },
            { id: 'history', label: 'Cross-Chain Activity', icon: '/jellyfish.png' }
          ].map(item => {
            // Use separate buttons for each state to avoid expressions in aria attributes
            if (chartType === item.id) {
              return (
                <button
                  key={item.id}
                  onClick={() => setChartType(item.id)}
                  className="px-3 py-1 text-sm rounded-md transition-colors bg-background shadow-sm text-foreground flex items-center gap-2"
                  role="radio"
                  aria-checked="true"
                  aria-label={item.label}
                >
                  <div className="w-4 h-4 relative overflow-hidden rounded-full">
                    <Image src={item.icon} alt="" width={16} height={16} className="object-cover" />
                  </div>
                  {item.label}
                </button>
              );
            } else {
              return (
                <button
                  key={item.id}
                  onClick={() => setChartType(item.id)}
                  className="px-3 py-1 text-sm rounded-md transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2"
                  role="radio"
                  aria-checked="false"
                  aria-label={item.label}
                >
                  <div className="w-4 h-4 relative overflow-hidden rounded-full">
                    <Image src={item.icon} alt="" width={16} height={16} className="object-cover" />
                  </div>
                  {item.label}
                </button>
              );
            }
          })}
        </div>
        
        {(chartType === 'performance' || chartType === 'history') && (
          <div className="flex p-1 bg-muted/30 rounded-lg" role="radiogroup" aria-label="Time period selection">
            {[
              { id: '1d', label: '1D' },
              { id: '1w', label: '1W' },
              { id: '1m', label: '1M' },
              { id: '3m', label: '3M' },
              { id: '1y', label: '1Y' }
            ].map(item => {
              // Use separate buttons for each state to avoid expressions in aria attributes
              if (period === item.id) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setPeriod(item.id)}
                    className="px-2 py-1 text-sm rounded-md transition-colors bg-background shadow-sm text-foreground"
                    role="radio"
                    aria-checked="true"
                    aria-label={item.label}
                  >
                    {item.label}
                  </button>
                );
              } else {
                return (
                  <button
                    key={item.id}
                    onClick={() => setPeriod(item.id)}
                    className="px-2 py-1 text-sm rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    role="radio"
                    aria-checked="false"
                    aria-label={item.label}
                  >
                    {item.label}
                  </button>
                );
              }
            })}
          </div>
        )}
      </div>
      
      <div className="h-[400px]">
        {renderChart()}
      </div>
      
      {/* Quick insight for chain distribution */}
      {chartType === 'chains' && (
        <TransitionWrapper transitionType="slide-up">
          <div className="bg-muted/30 p-4 rounded-lg border">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  <Image src="/1byone20.jpg" alt="AI Insight" width={24} height={24} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Cross-Chain Distribution Insight</p>
                <p className="text-sm text-muted-foreground">
                  Your portfolio is well-diversified across multiple chains, with a balanced allocation that reduces blockchain-specific risks. 
                  Consider increasing your Base allocation slightly to take advantage of lower gas fees and higher yields currently available there.
                </p>
              </div>
            </div>
          </div>
        </TransitionWrapper>
      )}
    </div>
  );
} 