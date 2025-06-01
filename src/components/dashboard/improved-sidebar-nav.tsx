'use client';

import { useViewTransitions } from './use-view-transitions';
import { useOptimistic, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { TransitionWrapper } from '@/components/ui/transition-wrapper';
import Image from 'next/image';
import Link from 'next/link';

export interface ImprovedSidebarNavProps {
  items?: {
    title: string;
    href: string;
    icon: string;
    description?: string;
  }[];
  className?: string;
}

// Define default navigation items
const defaultItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: '/tornado.png'
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: '/1byone20.jpg'
  },
  {
    title: 'Flow ETF Manager',
    href: '/dashboard/flow-etf',
    icon: '/musicrainfdbow.png'
  },
  {
    title: 'Agent Monitoring',
    href: '/dashboard/agent',
    icon: '/snail.png'
  },
  {
    title: 'Cross-Chain Swap',
    href: '/dashboard/swap',
    icon: '/1byone13.jpg'
  },
  {
    title: 'Create ETF',
    href: '/dashboard/create',
    icon: '/flower.png'
  },
  {
    title: 'My ETFs',
    href: '/dashboard/etfs',
    icon: '/cactus.png'
  },
  {
    title: 'Cross-Chain Bridge',
    href: '/dashboard/bridge',
    icon: '/jellowchurch.png'
  },
  {
    title: 'Verify Account',
    href: '/verify',
    icon: '/sandwave.png'
  },
  {
    title: 'Transactions',
    href: '/dashboard/transactions',
    icon: '/1byone19.jpg'
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: '/sandwave.png'
  },
  {
    title: "Liquidity Flow",
    href: "/dashboard/flow",
    icon: "/1byone10.jpg",
    description: "Visualize the full liquidity and service flow"
  },
];

export function ImprovedSidebarNav({ items = defaultItems, className }: ImprovedSidebarNavProps) {
  const { navigateWithTransition, currentPath } = useViewTransitions();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();
  
  // Use optimistic UI to update the active item before the navigation completes
  const [optimisticPath, setOptimisticPath] = useOptimistic<string, string>(
    currentPath, 
    (_, newPath: string) => newPath
  );
  
  // Click handler for navigation items
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // Optimistically update the path using startTransition
    startTransition(() => {
      setOptimisticPath(href);
    });
    
    // Navigate with view transition
    navigateWithTransition(href, 'nav');
  };
  
  return (
    <div className={cn("px-3 py-2 w-full h-full", className)}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Dashboard</h2>
      </div>
      
      <nav className="flex flex-col space-y-1">
        {items.map((item) => {
          // Check if this item is active (either actually or optimistically)
          const isActive = optimisticPath === item.href || 
                          (item.href !== '/dashboard' && optimisticPath.startsWith(item.href));
          
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
                    : "hover:bg-accent/50 hover:text-accent-foreground/90"
                )}
                onClick={(e) => handleNavClick(e, item.href)}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex-shrink-0 w-5 h-5 rounded-md overflow-hidden" aria-hidden="true">
                  {item.icon && (
                    <Image 
                      src={item.icon} 
                      alt="" 
                      width={20} 
                      height={20} 
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  )}
                </div>
                <span>{item.title}</span>
              </Link>
            </TransitionWrapper>
          );
        })}
      </nav>
      
      <div className="mt-6 pt-6 border-t">
        <div className="py-2">
          <h3 className="text-xs font-medium text-muted-foreground mb-3">Cross-Chain Networks</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Ethereum</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Base</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Flow</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md text-xs">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Solana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 