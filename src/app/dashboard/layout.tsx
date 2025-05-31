import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';
import { ClientButton } from '@/components/ui/client-button';

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
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Image 
                src="/baevii-logo.png" 
                alt="BAEVII Logo" 
                width={32} 
                height={32} 
                className="h-8 w-auto"
              />
              <span className="font-bold sm:inline-block">
                BAEVII
              </span>
            </Link>
          </div>
          <div className="flex items-center">
            <Link href="/dashboard/create">
              <ClientButton size="sm">Create ETF</ClientButton>
            </Link>
          </div>
        </div>
      </header>
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