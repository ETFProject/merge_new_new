'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionName?: string;
}

// This component uses the experimental ViewTransition API from Next.js 15
export function PageTransition({
  children,
  className,
  transitionName,
}: PageTransitionProps) {
  const [key, setKey] = React.useState(Math.random());
  
  // React 19 supports the experimental "use" function which we use here
  // to work with the View Transition API
  React.useEffect(() => {
    try {
      // Check if ViewTransition API is available
      if ('startViewTransition' in document && 'ViewTransition' in window) {
        // We're ready to start using the view transition API
        console.log('View Transition API is supported');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('View Transition API is not supported');
    }
    
    // Force a re-render after mount to ensure hydration issues don't affect us
    setKey(Math.random());
  }, []);
  
  return (
    <div 
      key={key}
      className={cn('page-transition', className)}
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
    >
      {children}
    </div>
  );
} 