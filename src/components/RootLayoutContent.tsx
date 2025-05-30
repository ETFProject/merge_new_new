'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import ClientLayout from '@/components/ClientLayout';
import { ToastProvider } from '@/components/ui/use-toast';
import { PrivyWalletProvider } from '@/components/PrivyWalletProvider';
import { WalletConnectButton } from '@/components/WalletConnectButton';

interface RootLayoutContentProps {
  children: React.ReactNode;
}

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  const pathname = usePathname();
  const isDashboardPage = pathname.startsWith('/dashboard');
  
  return (
    <ClientLayout>
      <PrivyWalletProvider>
        <ToastProvider>
        {/* Only show header on non-dashboard pages */}
        {!isDashboardPage && (
          <header className="fixed w-full bg-background/80 backdrop-blur-sm z-50 border-b">
            <div className="container mx-auto flex h-16 items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                  <Image 
                    src="/baevii-logo.png" 
                    alt="BAEVII Logo" 
                    width={32} 
                    height={32} 
                    className="h-8 w-auto"
                  />
                  <span className="font-semibold text-lg">BAEVII</span>
                </Link>
              </div>
              {/* <nav className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-sm font-medium hover:text-primary transition-colors duration-200">Home</Link>
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors duration-200">Dashboard</Link>
                <Link href="/dashboard/analytics" className="text-sm font-medium hover:text-primary transition-colors duration-200">Analytics</Link>
                <Link href="/dashboard/create" className="text-sm font-medium hover:text-primary transition-colors duration-200">Create ETF</Link>
                <Link href="/etf-test" className="text-sm font-medium hover:text-primary transition-colors duration-200">Demo</Link>
              </nav> */}
              <div className="flex items-center gap-4">
                <WalletConnectButton />
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <Link href="/dashboard/create">
                  <Button size="sm">Create ETF</Button>
                </Link>
              </div>
            </div>
          </header>
        )}
        
        <div className={isDashboardPage ? '' : 'pt-16'}>
          {children}
        </div>
        
        {/* Footer - only show on non-dashboard pages */}
        {!isDashboardPage && (
          <footer className="py-8 border-t mt-auto">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center gap-2 mb-4 md:mb-0">
                  <Image 
                    src="/baevii-logo.png" 
                    alt="BAEVII Logo" 
                    width={32} 
                    height={32} 
                    className="h-8 w-auto"
                  />
                  <span className="font-semibold">BAEVII</span>
                </div>
                <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} BAEVII. All rights reserved.</p>
              </div>
            </div>
          </footer>
        )}
        </ToastProvider>
      </PrivyWalletProvider>
    </ClientLayout>
  );
} 