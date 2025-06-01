import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';
import { ClientButton } from '@/components/ui/client-button';
import { WalletConnectButton } from '@/components/WalletConnectButton';

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
      
      <div className="container mx-auto px-4 py-6 flex flex-1">
        <div className="w-full flex-1 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <DashboardLayoutClient>
            {children}
          </DashboardLayoutClient>
        </div>
      </div>
    </div>
  );
} 