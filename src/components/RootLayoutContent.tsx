'use client';

import React, { useState, useEffect } from 'react';
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
  const [pathname, setPathname] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);
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