'use client';

import { useViewTransitions } from './use-view-transitions';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TransitionWrapper } from '@/components/ui/transition-wrapper';
import { Button } from '@/components/ui/button';
import { ChevronDown, LogOut, Wallet } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface ImprovedSidebarNavProps {
  items?: {
    title: string;
    href: string;
    icon: string;
    description?: string;
  }[];
  className?: string;
  isCollapsed?: boolean;
}

// Define default navigation items with proper mock icons
const defaultItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: '📊'
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: '📈'
  },
  {
    title: 'Flow ITF Manager',
    href: '/dashboard/flow-etf',
    icon: '🌊',
    description: 'Manage Flow blockchain ITF operations'
  },
  {
    title: 'Agent Monitoring',
    href: '/dashboard/agent',
    icon: '🤖'
  },
  {
    title: 'Cross-Chain Swap',
    href: '/dashboard/swap',
    icon: '🔄'
  },
  {
    title: 'Create ITF',
    href: '/dashboard/create',
    icon: '➕',
    description: 'Create a new ITF portfolio'
  },
  {
    title: 'My ITFs',
    href: '/dashboard/etfs',
    icon: '💼',
    description: 'View your ITF portfolios'
  },
  {
    title: 'Cross-Chain Bridge',
    href: '/dashboard/bridge',
    icon: '🌉'
  },
  {
    title: 'Verify Account',
    href: '/verify',
    icon: '✅'
  },
  {
    title: 'Transactions',
    href: '/dashboard/transactions',
    icon: '📋'
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: '⚙️'
  },
  {
    title: "Liquidity Flow",
    href: "/dashboard/flow",
    icon: "💧",
    description: "Visualize the full liquidity and service flow"
  },
];

// Chain configuration
const chains = [
  { id: 'flow', name: 'Flow', color: 'bg-blue-500', icon: '🌊' },
  { id: 'base', name: 'Base', color: 'bg-blue-600', icon: '🔵' },
  { id: 'rootstock', name: 'Rootstock', color: 'bg-orange-500', icon: '🟠' },
  { id: 'bob', name: 'Bob', color: 'bg-purple-500', icon: '🟣' },
];

export function ImprovedSidebarNav({ items = defaultItems, className, isCollapsed = false }: ImprovedSidebarNavProps) {
  const pathname = usePathname();
  
  const handleDisconnect = (chainId: string) => {
    console.log(`Disconnecting from ${chainId}`);
    // Add actual disconnect logic here
  };
  
  return (
    <div className={cn("px-3 py-2 w-full h-full", className)}>
      {!isCollapsed && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
      )}
      
      <nav className="flex flex-col space-y-1">
        {items.map((item) => {
          // Check if this item is active
          const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <TransitionWrapper
              key={item.href}
              className="w-full"
              transitionType={isActive ? 'slide-up' : undefined}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full",
                  isActive 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50 hover:text-accent-foreground/90",
                  isCollapsed && "justify-center"
                )}
                aria-current={isActive ? 'page' : undefined}
                title={isCollapsed ? item.title : undefined}
              >
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-lg" aria-hidden="true">
                  {item.icon}
                </div>
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            </TransitionWrapper>
          );
        })}
      </nav>
      
      {!isCollapsed && (
        <div className="mt-6 pt-6 border-t space-y-4">
          {/* Connected Chains */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Connected Networks</h3>
            <div className="space-y-2">
              {chains.map((chain) => (
                <div key={chain.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", chain.color)}></div>
                    <span className="text-sm">{chain.name}</span>
                    <Wallet className="h-3 w-3 text-green-500" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDisconnect(chain.id)}
                  >
                    <LogOut className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 