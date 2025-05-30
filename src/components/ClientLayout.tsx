'use client';

import { HydrationFix } from './HydrationFix';
import { NavigationIndicator } from './ui/navigation-indicator';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HydrationFix />
      <NavigationIndicator />
      {children}
    </>
  );
} 