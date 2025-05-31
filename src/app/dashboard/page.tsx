'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { AIAgentChat } from "@/components/dashboard/ai-agent-chat";
import { TransactionsTable } from "@/components/dashboard/transactions";

// Mock data for the dashboard
const mockUserData = {
  name: "John Doe",
  avatar: "JD",
  totalValue: "$145,328.42",
  performance: {
    daily: 2.4,
    weekly: -1.3,
    monthly: 8.7,
    allTime: 32.1
  },
  etfs: [
    { id: "etf123", name: "Growth ETF", value: "$78,452.18", change: 3.2 },
    { id: "etf456", name: "Tech Basket", value: "$45,129.33", change: -0.8 },
    { id: "etf789", name: "DeFi Portfolio", value: "$21,746.91", change: 5.7 }
  ]
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'ai'>('overview');

  // Helper to determine if the tab is active
  const isActiveTab = (tab: 'overview' | 'analytics' | 'ai') => activeTab === tab;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {mockUserData.name}. Here&apos;s an overview of your ETF portfolio.
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button className="w-full md:w-auto" aria-label="Create a new ETF">
            Create New ETF
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Portfolio statistics">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUserData.totalValue}</div>
            <p className="text-xs text-muted-foreground">
              +{mockUserData.performance.allTime}% all time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Daily Change
            </CardTitle>
            <span className={`text-sm ${mockUserData.performance.daily > 0 ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true">
              {mockUserData.performance.daily > 0 ? '▲' : '▼'}
            </span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${mockUserData.performance.daily > 0 ? 'text-green-600' : 'text-red-600'}`} aria-live="polite">
              {mockUserData.performance.daily > 0 ? '+' : ''}{mockUserData.performance.daily}%
              <span className="sr-only">{mockUserData.performance.daily > 0 ? 'increase' : 'decrease'}</span>
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Change
            </CardTitle>
            <span className={`text-sm ${mockUserData.performance.weekly > 0 ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true">
              {mockUserData.performance.weekly > 0 ? '▲' : '▼'}
            </span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${mockUserData.performance.weekly > 0 ? 'text-green-600' : 'text-red-600'}`} aria-live="polite">
              {mockUserData.performance.weekly > 0 ? '+' : ''}{mockUserData.performance.weekly}%
              <span className="sr-only">{mockUserData.performance.weekly > 0 ? 'increase' : 'decrease'}</span>
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Change
            </CardTitle>
            <span className={`text-sm ${mockUserData.performance.monthly > 0 ? 'text-green-600' : 'text-red-600'}`} aria-hidden="true">
              {mockUserData.performance.monthly > 0 ? '▲' : '▼'}
            </span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${mockUserData.performance.monthly > 0 ? 'text-green-600' : 'text-red-600'}`} aria-live="polite">
              {mockUserData.performance.monthly > 0 ? '+' : ''}{mockUserData.performance.monthly}%
              <span className="sr-only">{mockUserData.performance.monthly > 0 ? 'increase' : 'decrease'}</span>
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* ETF Portfolio and Transactions */}
      <div className="grid gap-4 md:grid-cols-7">
        <div className="md:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Your ETF Portfolio</CardTitle>
              <CardDescription>
                Overview of your current ETF holdings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" role="list" aria-label="ETF holdings">
                {mockUserData.etfs.map((etf) => (
                  <div key={etf.id} className="flex items-center justify-between border-b pb-4 last:border-0" role="listitem">
                    <div>
                      <p className="font-medium">{etf.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {etf.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{etf.value}</p>
                      <p className={`text-sm ${etf.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {etf.change > 0 ? '+' : ''}{etf.change}%
                        <span className="sr-only">{etf.change > 0 ? 'increase' : 'decrease'}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full" aria-label="View all your ETFs">
                View All ETFs
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="md:col-span-3">
          <TransactionsTable />
        </div>
      </div>

      {/* Tab Interface */}
      <div className="space-y-4">
        <div className="flex border-b" role="tablist" aria-label="Dashboard sections">
          {/* Overview Tab - Using conditionals to set fixed strings for aria-selected */}
          {isActiveTab('overview') ? (
            <button
              role="tab"
              id="tab-overview"
              aria-selected="true"
              aria-controls="tabpanel-overview"
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary"
            >
              Overview
            </button>
          ) : (
            <button
              role="tab"
              id="tab-overview"
              aria-selected="false"
              aria-controls="tabpanel-overview"
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              Overview
            </button>
          )}

          {/* Analytics Tab */}
          {isActiveTab('analytics') ? (
            <button
              role="tab"
              id="tab-analytics"
              aria-selected="true"
              aria-controls="tabpanel-analytics"
              onClick={() => setActiveTab('analytics')}
              className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary"
            >
              Analytics
            </button>
          ) : (
            <button
              role="tab"
              id="tab-analytics"
              aria-selected="false"
              aria-controls="tabpanel-analytics"
              onClick={() => setActiveTab('analytics')}
              className="px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              Analytics
            </button>
          )}

          {/* AI Assistant Tab */}
          {isActiveTab('ai') ? (
            <button
              role="tab"
              id="tab-ai"
              aria-selected="true"
              aria-controls="tabpanel-ai"
              onClick={() => setActiveTab('ai')}
              className="px-4 py-2 text-sm font-medium border-b-2 border-primary text-primary"
            >
              AI Assistant
            </button>
          ) : (
            <button
              role="tab"
              id="tab-ai"
              aria-selected="false"
              aria-controls="tabpanel-ai"
              onClick={() => setActiveTab('ai')}
              className="px-4 py-2 text-sm font-medium text-muted-foreground"
            >
              AI Assistant
            </button>
          )}
        </div>

        {activeTab === 'overview' && (
          <div 
            role="tabpanel" 
            id="tabpanel-overview"
            aria-labelledby="tab-overview" 
            className="space-y-4"
          >
            <h3 className="text-lg font-medium">Portfolio Overview</h3>
            <p className="text-muted-foreground">
              Your ETF portfolio is performing well with a total value of {mockUserData.totalValue}.
              You currently have {mockUserData.etfs.length} active ETFs in your portfolio.
            </p>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="list-disc pl-5 space-y-1" aria-label="Portfolio recommendations">
                <li>Consider rebalancing your Tech Basket ETF to optimize returns</li>
                <li>Your DeFi Portfolio is performing well, consider increasing your position</li>
                <li>Growth ETF has seen steady growth, maintain current allocation</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div 
            role="tabpanel" 
            id="tabpanel-analytics"
            aria-labelledby="tab-analytics"
          >
            <AnalyticsChart />
          </div>
        )}

        {activeTab === 'ai' && (
          <div 
            role="tabpanel" 
            id="tabpanel-ai"
            aria-labelledby="tab-ai"
          >
            <AIAgentChat />
          </div>
        )}
      </div>
    </div>
  );
} 