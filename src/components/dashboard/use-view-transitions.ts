'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useRef } from 'react';

/**
 * A hook that provides view transition navigation functionality
 * @returns Functions to navigate with view transitions
 */
export function useViewTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const supportsViewTransitions = useRef<boolean | null>(null);
  
  // Check if View Transitions API is supported
  if (typeof document !== 'undefined' && supportsViewTransitions.current === null) {
    supportsViewTransitions.current = 'startViewTransition' in document;
  }
  
  /**
   * Navigate with view transitions if supported
   */
  const navigateWithTransition = useCallback((url: string, transitionType?: string) => {
    // Only attempt view transitions if the API is supported
    if (supportsViewTransitions.current) {
      try {
        document.startViewTransition(() => {
          // Set transition type as a data attribute for CSS targeting
          if (transitionType) {
            document.documentElement.setAttribute('data-transition-type', transitionType);
          }
          
          // Push the new route
          router.push(url);
          
          // Give time for the transition to start before cleaning up
          return new Promise((resolve) => {
            setTimeout(() => {
              if (transitionType) {
                document.documentElement.removeAttribute('data-transition-type');
              }
              resolve(undefined);
            }, 300);
          });
        });
      } catch (e) {
        // Fallback to regular navigation if view transitions fail
        console.error('View transition failed:', e);
        router.push(url);
      }
    } else {
      // Fallback to regular navigation if view transitions aren't supported
      router.push(url);
    }
  }, [router]);
  
  /**
   * Back navigation with view transitions
   */
  const goBackWithTransition = useCallback(() => {
    if (supportsViewTransitions.current) {
      try {
        document.startViewTransition(() => {
          document.documentElement.setAttribute('data-transition-type', 'back');
          router.back();
          
          return new Promise((resolve) => {
            setTimeout(() => {
              document.documentElement.removeAttribute('data-transition-type');
              resolve(undefined);
            }, 300);
          });
        });
      } catch (e) {
        console.error('View transition failed:', e);
        router.back();
      }
    } else {
      router.back();
    }
  }, [router]);
  
  return {
    navigateWithTransition,
    goBackWithTransition,
    supportsViewTransitions: !!supportsViewTransitions.current,
    currentPath: pathname
  };
} 