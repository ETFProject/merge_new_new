'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

// Types for Blockscout SDK based on the documentation
export interface TransactionToastOptions {
  chainId: string;
  hash: string;
}

export interface TransactionPopupOptions {
  chainId: string;
  address?: string;
}

export interface NotificationContextType {
  openTxToast: (chainId: string, hash: string) => Promise<void>;
}

export interface TransactionPopupContextType {
  openPopup: (options: TransactionPopupOptions) => void;
}

// Mock implementation of Blockscout SDK since it's in beta
// Based on the documentation provided by the user

// Notification Context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Transaction Popup Context  
const TransactionPopupContext = createContext<TransactionPopupContextType | null>(null);

// Notification Provider Component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    chainId: string;
    hash: string;
    status: 'pending' | 'success' | 'error';
    timestamp: number;
  }>>([]);

  const openTxToast = async (chainId: string, hash: string): Promise<void> => {
    const notificationId = `${chainId}-${hash}-${Date.now()}`;
    
    // Add pending notification
    const newNotification = {
      id: notificationId,
      chainId,
      hash,
      status: 'pending' as const,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Transaction Submitted', {
        body: `Transaction ${hash.slice(0, 10)}... submitted on chain ${chainId}`,
        icon: '/favicon.ico'
      });
    }
    
    // Simulate transaction status polling
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'success' }
            : notif
        )
      );
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Transaction Confirmed', {
          body: `Transaction ${hash.slice(0, 10)}... confirmed on chain ${chainId}`,
          icon: '/favicon.ico'
        });
      }
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={{ openTxToast }}>
      {children}
      {/* Render toast notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`max-w-sm p-4 rounded-lg shadow-lg ${
              notification.status === 'pending' 
                ? 'bg-yellow-100 border-yellow-500' 
                : notification.status === 'success'
                ? 'bg-green-100 border-green-500'
                : 'bg-red-100 border-red-500'
            } border-l-4`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.status === 'pending' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                )}
                {notification.status === 'success' && (
                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.status === 'error' && (
                  <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  Transaction {notification.status === 'pending' ? 'Pending' : notification.status === 'success' ? 'Confirmed' : 'Failed'}
                </p>
                <p className="text-xs text-gray-500">
                  {notification.hash.slice(0, 10)}... on chain {notification.chainId}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// Transaction Popup Provider Component
export function TransactionPopupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupOptions, setPopupOptions] = useState<TransactionPopupOptions | null>(null);

  const openPopup = (options: TransactionPopupOptions) => {
    setPopupOptions(options);
    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
    setPopupOptions(null);
  };

  return (
    <TransactionPopupContext.Provider value={{ openPopup }}>
      {children}
      {/* Transaction History Popup Modal */}
      {isOpen && popupOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Transaction History - Chain {popupOptions.chainId}
              </h2>
              <button
                onClick={closePopup}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {popupOptions.address && (
              <p className="text-sm text-gray-600 mb-4">
                Address: {popupOptions.address}
              </p>
            )}
            
            <div className="space-y-3">
              {/* Mock transaction data */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Transaction #{i}</p>
                      <p className="text-sm text-gray-600">
                        Hash: 0x{Math.random().toString(16).slice(2, 12)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(Date.now() - i * 3600000).toLocaleString()}
                      </p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Success
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <a
                href={`https://blockscout.com/${popupOptions.chainId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View on Blockscout Explorer →
              </a>
            </div>
          </div>
        </div>
      )}
    </TransactionPopupContext.Provider>
  );
}

// Custom hooks to use the contexts
export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function useTransactionPopup(): TransactionPopupContextType {
  const context = useContext(TransactionPopupContext);
  if (!context) {
    throw new Error('useTransactionPopup must be used within a TransactionPopupProvider');
  }
  return context;
}

// Utility function to request notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Chain ID mapping for supported chains
export const SUPPORTED_CHAINS = {
  '1': 'Ethereum Mainnet',
  '137': 'Polygon Mainnet',
  '42161': 'Arbitrum One',
  '10': 'Optimism',
  '8453': 'Base',
  '747': 'Flow EVM Mainnet',
  '545': 'Flow EVM Testnet'
} as const;

export type SupportedChainId = keyof typeof SUPPORTED_CHAINS;

// Utility to check if chain is supported
export function isSupportedChain(chainId: string): chainId is SupportedChainId {
  return chainId in SUPPORTED_CHAINS;
}

// Get chain name from ID
export function getChainName(chainId: string): string {
  return SUPPORTED_CHAINS[chainId as SupportedChainId] || `Chain ${chainId}`;
}
