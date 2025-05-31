'use client';

import { ImprovedSidebarNav } from '@/components/dashboard/improved-sidebar-nav';
import { PageTransition } from '@/components/ui/page-transition';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  return (
    <>
      <aside className="hidden md:block md:sticky top-14 h-[calc(100vh-3.5rem)] w-full border-r overflow-y-auto">
        <div className="py-4">
          <ImprovedSidebarNav />
        </div>
      </aside>
      <main className="flex w-full flex-col">
        <PageTransition className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </PageTransition>
      </main>
    </>
  );
} 