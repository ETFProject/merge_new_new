'use client';

import * as React from 'react';
import { createContext, useContext } from 'react';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    // Simple implementation that falls back to alert if Toast provider is not available
    return {
      toast: ({ title, description, variant }: ToastProps) => {
        console.log(`[Toast] ${variant === 'destructive' ? '❌' : '✅'} ${title}${description ? `: ${description}` : ''}`);
        // Use alert as a fallback when the toast provider is not available
        if (title && description) {
          alert(`${title}\n${description}`);
        } else if (title) {
          alert(title);
        } else if (description) {
          alert(description);
        }
      }
    };
  }
  
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([]);
  
  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...props, id }]);
    
    // Auto dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, props.duration || 3000);
  }, []);
  
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-md shadow-lg p-4 transition-all transform translate-x-0 animate-in slide-in-from-right-5 ${
              t.variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-background border'
            }`}
            style={{ maxWidth: '420px' }}
          >
            {t.title && <h3 className="font-semibold">{t.title}</h3>}
            {t.description && <p className="text-sm opacity-90">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export { ToastContext }; 