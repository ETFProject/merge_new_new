'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";

// Tabs for the analytics page
const tabs = [
  { id: 'performance', label: 'Performance' },
  { id: 'allocation', label: 'Asset Allocation' },
  { id: 'chains', label: 'Chain Distribution' },
  { id: 'history', label: 'Historical Data' },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('performance');
  const [timeframe, setTimeframe] = useState('1w');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Detailed analysis and insights for your ETF portfolio
        </p>
      </div>

      {/* Timeframe selectors */}
      <div className="flex space-x-2">
        {['1d', '1w', '1m', '3m', '1y', 'all'].map((period) => (
          <Button
            key={period}
            variant={timeframe === period ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe(period)}
          >
            {period === '1d' && '1 Day'}
            {period === '1w' && '1 Week'}
            {period === '1m' && '1 Month'}
            {period === '3m' && '3 Months'}
            {period === '1y' && '1 Year'}
            {period === 'all' && 'All Time'}
          </Button>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Analytics content */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Portfolio {activeTab === 'performance' ? 'Performance' : 
                            activeTab === 'allocation' ? 'Asset Allocation' : 
                            activeTab === 'chains' ? 'Chain Distribution' : 
                            'Historical Data'}</CardTitle>
            <CardDescription>
              {timeframe === '1d' && 'Last 24 hours'}
              {timeframe === '1w' && 'Last 7 days'}
              {timeframe === '1m' && 'Last 30 days'}
              {timeframe === '3m' && 'Last 3 months'}
              {timeframe === '1y' && 'Last 12 months'}
              {timeframe === 'all' && 'All time'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <AnalyticsChart selectedTab={activeTab} timeframe={timeframe} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
            <CardDescription>
              Performance indicators for your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Return:</span>
                <span className="text-sm font-medium text-green-500">+32.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Volatility:</span>
                <span className="text-sm font-medium">23.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Sharpe Ratio:</span>
                <span className="text-sm font-medium">1.85</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Max Drawdown:</span>
                <span className="text-sm font-medium text-red-500">-15.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Beta:</span>
                <span className="text-sm font-medium">1.24</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Insights</CardTitle>
            <CardDescription>
              AI-generated insights based on your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2 text-green-500">▲</span>
                <span>Your DeFi ETF outperformed the market by 8.3% this month</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-yellow-500">⚠️</span>
                <span>High correlation between your ETFs suggests considering diversification</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-500">ℹ️</span>
                <span>Recent volatility has been lower than historical average</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-500">▲</span>
                <span>Your Ethereum allocation has been your best performer</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-red-500">▼</span>
                <span>Recent market trends suggest considering rebalancing</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 