'use client';

import { useLinkStatus } from 'next/link';
import React from 'react';
import { cn } from '@/lib/utils';

interface NavigationIndicatorProps {
  /** Optional class name for styling */
  className?: string;
  /** Add a small delay before showing loading UI to avoid flicker on fast loads */
  delayMs?: number;
}

export function NavigationIndicator({
  className,
  delayMs = 100,
}: NavigationIndicatorProps) {
  const { pending } = useLinkStatus();
  const [shouldRender, setShouldRender] = React.useState(false);
  
  React.useEffect(() => {
    if (pending) {
      // Only show indicator after a small delay to avoid flicker on fast loads
      const timer = setTimeout(() => {
        setShouldRender(true);
      }, delayMs);
      
      return () => clearTimeout(timer);
    } else {
      setShouldRender(false);
    }
  }, [pending, delayMs]);
  
  if (!shouldRender) {
    return null;
  }
  
  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-1 bg-primary z-50 animate-pulse',
        className
      )}
      role="progressbar"
      aria-label="Page loading"
      aria-busy="true"
    />
  );
} 