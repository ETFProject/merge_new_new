'use client';

import React from 'react';

export function HydrationFix(): React.JSX.Element {
  return (
    <script
      id="hydration-fix"
      dangerouslySetInnerHTML={{
        __html: `
          // Remove attributes added by browser extensions before hydration
          if (document.body.hasAttribute('cz-shortcut-listen')) {
            document.body.removeAttribute('cz-shortcut-listen');
          }
          if (document.body.hasAttribute('wotdisconnected')) {
            document.body.removeAttribute('wotdisconnected');
          }
          
          // Watch for attribute changes and remove them
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (
                mutation.type === 'attributes' &&
                (mutation.attributeName === 'cz-shortcut-listen' || 
                 mutation.attributeName === 'wotdisconnected')
              ) {
                document.body.removeAttribute(mutation.attributeName);
              }
            });
          });
          
          observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['cz-shortcut-listen', 'wotdisconnected']
          });
        `,
      }}
    />
  );
} 