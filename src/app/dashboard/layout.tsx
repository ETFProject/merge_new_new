import { Metadata } from 'next';
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';

export const metadata: Metadata = {
  title: 'BAEVII Dashboard',
  description: 'Manage your crypto ETFs with AI-powered insights',
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header can go here if needed */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar + Main content handled in DashboardLayoutClient */}
        <DashboardLayoutClient>
          {children}
        </DashboardLayoutClient>
      </div>
    </div>
  );
} 