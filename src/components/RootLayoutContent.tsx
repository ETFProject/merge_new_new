'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import ClientLayout from '@/components/ClientLayout';
import { ToastProvider } from '@/components/ui/use-toast';
import { PrivyWalletProvider } from '@/components/PrivyWalletProvider';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { Menu } from 'lucide-react';

interface RootLayoutContentProps {
  children: React.ReactNode;
}

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  // Always show nav bar on all pages
  // Theme toggle logic
  const [theme, setTheme] = useState<'light' | 'dark' | 'color-blind' | null>(null);
  
  useEffect(() => {
    // Check system preference first
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'color-blind';
    const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.classList.remove('light', 'dark', 'color-blind');
    document.documentElement.classList.add(initialTheme);
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.classList.remove('light', 'dark', 'color-blind');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'color-blind' : 'light';
  const themeIcon = theme === 'light' ? '🌞' : theme === 'dark' ? '🌚' : theme === 'color-blind' ? '👁️' : null;
  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : theme === 'color-blind' ? 'Color Blind' : '';

  return (
    <ClientLayout>
      <PrivyWalletProvider>
        <ToastProvider>
        {/* Always show header on all pages */}
        <header className="fixed w-full bg-background/80 backdrop-blur-sm z-50 border-b text-foreground">
          <div className="container mx-auto flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open sidebar"
                className="md:hidden"
                // onClick should be handled by parent or context if needed
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link href="/">
                <Image 
                  src="/baevii-logo.png" 
                  alt="BAEVII Logo" 
                  width={32} 
                  height={32} 
                  className="h-8 w-auto cursor-pointer"
                />
              </Link>
              <span className="font-semibold text-lg text-foreground">BAEVII</span>
            </div>

            <div className="flex items-center gap-4">
              {theme !== null && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle theme"
                  onClick={() => {
                    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'color-blind' : 'light';
                    setTheme(newTheme);
                  }}
                  className="text-xl text-foreground"
                >
                  {themeIcon}
                  <span className="sr-only">Switch to {nextTheme} mode</span>
                </Button>
              )}
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
        
        <div className="pt-16">
          {children}
        </div>
        
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
                <span className="font-semibold text-foreground">BAEVII</span>
              </div>
              <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} BAEVII Labs. All rights reserved.</p>
            </div>
          </div>
        </footer>
        </ToastProvider>
      </PrivyWalletProvider>
    </ClientLayout>
  );
} 