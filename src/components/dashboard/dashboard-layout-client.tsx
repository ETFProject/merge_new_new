'use client';

import { useState, useEffect } from 'react';
import { ImprovedSidebarNav } from '@/components/dashboard/improved-sidebar-nav';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSidebar } from '@/components/RootLayoutContent';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  // Theme toggle logic (sync with RootLayoutContent)
  const [theme, setTheme] = useState<'light' | 'dark' | 'color-blind'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark' | 'color-blind') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark', 'color-blind');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'color-blind' : 'light';
  const themeIcon = theme === 'light' ? '🌞' : theme === 'dark' ? '🌚' : '👁️';
  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Color Blind';

  return (
    <div className="flex w-full">
      {/* Sidebar */}
      <aside className={`fixed z-40 h-full bg-background border-r w-64 top-16 left-0 transition-all duration-300 ease-in-out md:relative md:top-0 md:z-auto md:h-[calc(100vh-4rem)] md:overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="py-4 h-full flex flex-col">
          {/* Toggle button */}
          <div className="px-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="w-full justify-start"
            >
              {isSidebarOpen ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  <span>Close Menu</span>
                </>
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1">
            <ImprovedSidebarNav isCollapsed={false} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-0' : ''}`}>
        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
          <PageTransition className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
} 