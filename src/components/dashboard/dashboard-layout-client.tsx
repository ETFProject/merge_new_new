'use client';

import { useState, useEffect } from 'react';
import { ImprovedSidebarNav } from '@/components/dashboard/improved-sidebar-nav';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Sidebar */}
      {isSidebarOpen && (
        <aside className="fixed z-30 h-full bg-background border-r w-64 top-14 left-0 transition-all duration-300 ease-in-out md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:overflow-y-auto">
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
              <ImprovedSidebarNav isCollapsed={!isSidebarOpen} />
            </div>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex flex-col w-full items-center">
        {/* Centered main content with max width */}
        <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
          <PageTransition className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </PageTransition>
        </div>
      </main>
    </>
  );
} 