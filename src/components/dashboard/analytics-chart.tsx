'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { ThreePieChart } from '@/components/3d/ThreePieChart';
import { ThreeOrbitalView } from '@/components/3d/ThreeOrbitalView';
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
    icon: `/baevii-logo.png` // Default icon, could be enhanced with token-specific icons
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
  
  return chainData.filter(chain => chain.percentage > 0);
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
          { category: 'DeFi', percentage: 35, icon: '/1byone20.jpg', color: '#FF6B9D' },
          { category: 'Layer 1', percentage: 25, icon: '/tornado.png', color: '#4ECDC4' },
          { category: 'NFT & Gaming', percentage: 15, icon: '/cactus.png', color: '#FFE66D' },
          { category: 'Infrastructure', percentage: 15, icon: '/jellowchurch.png', color: '#FF6B6B' },
          { category: 'Stablecoins', percentage: 10, icon: '/donut.png', color: '#A8E6CF' }
        ],
        chainDistribution: [
          { chain: 'Ethereum', percentage: 45, color: '#FF6B6B', icon: '/tornado.png' },
          { chain: 'Flow', percentage: 25, color: '#4ECDC4', icon: '/jellyfish.png' },
          { chain: 'Base', percentage: 15, color: '#45B7D1', icon: '/sandwave.png' },
          { chain: 'Avalanche', percentage: 10, color: '#96CEB4', icon: '/musicrainfdbow.png' },
          { chain: 'Solana', percentage: 5, color: '#FFEAA7', icon: '/flower.png' },
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
                    <ThreeBarChart data={chartData.daily} height={256} />
                  </div>
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'allocation':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full flex flex-col items-center justify-center p-2" role="region" aria-label="Asset Allocation">
              <div className="w-full max-w-4xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 3D Pie Chart */}
                  <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                      <h4 className="text-lg font-semibold mb-4 text-center text-slate-200">
                        {itfData ? `${itfData.name} Asset Allocation` : 'Portfolio Asset Allocation'}
                      </h4>
                      <div className="w-full h-80">
                        <ThreePieChart data={chartData.assetAllocation} height={320} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Legend & Stats */}
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-4 rounded-xl border border-blue-700/30">
                      <h5 className="text-sm font-semibold text-blue-200 mb-3">Portfolio Summary</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-300">Total Assets</span>
                          <span className="text-sm font-semibold text-white">
                            {itfData ? itfData.aum : '$2.4M'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-300">Holdings</span>
                          <span className="text-sm font-semibold text-white">
                            {chartData.assetAllocation.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-300">Top Asset</span>
                          <span className="text-sm font-semibold text-green-400">
                            {chartData.assetAllocation[0]?.category || 'DeFi'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Legend */}
                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                      <h5 className="text-sm font-semibold text-slate-200 mb-3">Asset Breakdown</h5>
                      <div className="space-y-3">
                        {chartData.assetAllocation.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-all duration-200 cursor-pointer group"
                          >
                            <div className="relative">
                              {item.icon ? (
                                <img 
                                  src={item.icon} 
                                  alt={item.category}
                                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-600 group-hover:ring-slate-400 transition-all"
                                />
                              ) : (
                                <div 
                                  className="w-8 h-8 rounded-full ring-2 ring-slate-600 group-hover:ring-slate-400 transition-all flex items-center justify-center text-xs font-bold text-white"
                                  style={{ backgroundColor: item.color }}
                                >
                                  {item.category.slice(0, 2)}
                                </div>
                              )}
                              <div 
                                className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800"
                                style={{ backgroundColor: item.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-200 truncate">
                                  {item.category}
                                </span>
                                <span className="text-sm font-bold text-slate-100">
                                  {item.percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                                <div 
                                  className="h-1.5 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${item.percentage}%`,
                                    backgroundColor: item.color 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TransitionWrapper>
        );
      case 'chains':
        return (
          <TransitionWrapper transitionType="card-appear">
            <div className="w-full flex flex-col items-center justify-center p-2" role="region" aria-label="Chain Distribution">
              <div className="w-full max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 3D Orbital View */}
                  <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                      <h4 className="text-lg font-semibold mb-4 text-center text-slate-200">
                        {itfData ? `${itfData.name} Cross-Chain Distribution` : 'Cross-Chain Portfolio Distribution'}
                      </h4>
                      <div className="w-full h-80">
                        <ThreeOrbitalView
                          data={chartData.chainDistribution}
                          centerIcon={itfData?.icon || "/baevii-logo.png"}
                          height={320}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Chain Stats & Insights */}
                  <div className="space-y-6">
                    {/* Chain Performance */}
                    <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 p-4 rounded-xl border border-emerald-700/30">
                      <h5 className="text-sm font-semibold text-emerald-200 mb-3">Chain Performance</h5>
                      <div className="space-y-3">
                        {chartData.chainDistribution.slice(0, 3).map((chain, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
                            <div className="flex items-center gap-2">
                              <img 
                                src={chain.icon} 
                                alt={chain.chain}
                                className="w-6 h-6 rounded-full"
                              />
                              <span className="text-sm font-medium text-slate-200">
                                {chain.chain}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-white">{chain.percentage}%</div>
                              <div className="text-xs text-slate-400">
                                {index === 0 ? 'Primary' : index === 1 ? 'Secondary' : 'Tertiary'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Cross-Chain Insights */}
                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                      <h5 className="text-sm font-semibold text-slate-200 mb-3">Cross-Chain Insights</h5>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-2 rounded-lg bg-blue-900/20 border border-blue-700/30">
                          <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                          <div>
                            <div className="text-sm font-medium text-blue-200">Diversified Risk</div>
                            <div className="text-xs text-slate-400 mt-1">
                              Spread across {chartData.chainDistribution.length} chains reduces single-chain exposure
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-2 rounded-lg bg-green-900/20 border border-green-700/30">
                          <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0"></div>
                          <div>
                            <div className="text-sm font-medium text-green-200">Yield Optimization</div>
                            <div className="text-xs text-slate-400 mt-1">
                              Strategic allocation maximizes yield opportunities across ecosystems
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-2 rounded-lg bg-purple-900/20 border border-purple-700/30">
                          <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                          <div>
                            <div className="text-sm font-medium text-purple-200">Gas Efficiency</div>
                            <div className="text-xs text-slate-400 mt-1">
                              Lower transaction costs through optimized chain selection
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chain Distribution Chart */}
                    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                      <h5 className="text-sm font-semibold text-slate-200 mb-3">Distribution Overview</h5>
                      <div className="space-y-2">
                        {chartData.chainDistribution.map((chain, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <img 
                              src={chain.icon} 
                              alt={chain.chain}
                              className="w-5 h-5 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-slate-300">{chain.chain}</span>
                                <span className="text-xs font-semibold text-slate-200">{chain.percentage}%</span>
                              </div>
                              <div className="w-full bg-slate-700 rounded-full h-1">
                                <div 
                                  className="h-1 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${chain.percentage}%`,
                                    backgroundColor: chain.color 
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cross-Chain Distribution Insight */}
                <div className="mt-6 bg-gradient-to-r from-slate-900/50 via-blue-900/20 to-purple-900/20 p-4 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={itfData?.icon || "/baevii-logo.png"} alt="BAEVII" className="w-6 h-6 rounded-full" />
                    <span className="font-semibold text-slate-200">
                      {itfData ? `${itfData.name} Cross-Chain Strategy` : 'Cross-Chain Distribution Strategy'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {itfData 
                      ? `This ${itfData.name} ITF employs a sophisticated cross-chain strategy that optimizes for yield, risk diversification, and gas efficiency. The allocation across ${chartData.chainDistribution.length} blockchains ensures resilience against single-chain risks while maximizing opportunities in the most promising ecosystems.`
                      : 'Your portfolio demonstrates a well-balanced cross-chain approach, strategically distributed across multiple blockchains to minimize network-specific risks while capitalizing on the unique advantages of each ecosystem. The current allocation favors established chains for stability while maintaining exposure to emerging platforms for growth potential.'
                    }
                  </p>
                </div>
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