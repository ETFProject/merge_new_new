'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import ClientLayout from '@/components/ClientLayout';
import { ToastProvider } from '@/components/ui/use-toast';
import { PrivyWalletProvider } from '@/components/PrivyWalletProvider';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { Menu, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarProvider, useSidebar } from './SidebarProvider';

// Chain configuration
const chains = [
  { id: 'flow', name: 'Flow', color: 'bg-blue-500', icon: '🌊' },
  { id: 'base', name: 'Base', color: 'bg-blue-600', icon: '🔵' },
  { id: 'rootstock', name: 'Rootstock', color: 'bg-orange-500', icon: '🟠' },
  { id: 'bob', name: 'Bob', color: 'bg-purple-500', icon: '🟣' },
];

interface RootLayoutContentProps {
  children: React.ReactNode;
}

function RootLayoutInner({ children }: RootLayoutContentProps) {
  const { theme, setTheme, toggleSidebar } = useSidebar();
  const [selectedChain, setSelectedChain] = useState('flow');
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsChainDropdownOpen(false);
      }
    };

    if (isChainDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isChainDropdownOpen]);
  
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'color-blind' : 'light';
  const themeIcon = theme === 'light' ? '🌞' : theme === 'dark' ? '🌚' : theme === 'color-blind' ? '👁️' : null;

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
                  onClick={toggleSidebar}
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
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
                <Link href="/dashboard/create">
                  <Button size="sm">Create ITF</Button>
                </Link>
                
                {/* Chain Switcher */}
                <div className="relative" ref={dropdownRef}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                  >
                    <span className="text-lg">{chains.find(c => c.id === selectedChain)?.icon}</span>
                    <span className="hidden sm:inline">{chains.find(c => c.id === selectedChain)?.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  
                  {isChainDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-background border rounded-md shadow-lg z-50 min-w-[120px]">
                      {chains.map((chain) => (
                        <button
                          key={chain.id}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors",
                            selectedChain === chain.id && "bg-accent"
                          )}
                          onClick={() => {
                            setSelectedChain(chain.id);
                            setIsChainDropdownOpen(false);
                          }}
                        >
                          <span className="text-lg">{chain.icon}</span>
                          <span>{chain.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <WalletConnectButton />
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

export function RootLayoutContent({ children }: RootLayoutContentProps) {
  return (
    <SidebarProvider>
      <RootLayoutInner>{children}</RootLayoutInner>
    </SidebarProvider>
  );
} 