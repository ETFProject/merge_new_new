'use client';

import { useEffect, useState } from 'react';

export function HydrationFix() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated once component mounts on client
    setHydrated(true);
    
    // Fix for hydration mismatches in Dialog components by handling aria-controls
    const fixDialogAttributes = () => {
      try {
        // First pass: collect all current aria-controls values
        const allButtons = document.querySelectorAll('button[aria-controls]');
        const currentAttributes = new Map();
        const idRegex = /radix-«([^»]+)»/;
        
        allButtons.forEach(button => {
          const ariaControls = button.getAttribute('aria-controls');
          if (ariaControls && idRegex.test(ariaControls)) {
            // Store the original element for later reference
            currentAttributes.set(button, ariaControls);
          }
        });
        
        // If we found attributes with the radix pattern, remove them to prevent hydration issues
        if (currentAttributes.size > 0) {
          currentAttributes.forEach((value, button) => {
            button.removeAttribute('aria-controls');
          });
          
          // After React has reconciled the tree, restore functional aria attributes
          // with client-generated values (but don't restore the exact same values
          // which caused the hydration mismatch)
          setTimeout(() => {
            currentAttributes.forEach((_, button) => {
              if (!button.getAttribute('aria-controls') && button.getAttribute('data-state')) {
                // Let Radix UI regenerate the aria attributes naturally
                // by triggering a small UI update
                const currentState = button.getAttribute('data-state');
                button.setAttribute('data-state', currentState === 'open' ? 'closed' : 'open');
                setTimeout(() => {
                  button.setAttribute('data-state', currentState);
                }, 0);
              }
            });
          }, 50);
        }
      } catch (e) {
        console.warn('Hydration fix for aria-controls failed:', e);
      }
    };
    
    // Run the fix after initial render and again after any dynamic content loads
    setTimeout(fixDialogAttributes, 100);
    setTimeout(fixDialogAttributes, 500);
  }, []);

  // Add a class to the document if we're hydrated
  if (hydrated && typeof document !== 'undefined') {
    document.documentElement.classList.add('hydrated');
  }

  // This component doesn't render anything visually
  return null;
} 