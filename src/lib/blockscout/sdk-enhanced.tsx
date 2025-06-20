/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { Bell, ExternalLink, Copy, Check, TrendingUp, AlertTriangle, Info, X, BarChart3 } from 'lucide-react';

// Enhanced types for Blockscout SDK
export interface TransactionToastOptions {
  chainId: string;
  hash: string;
  userAddress?: string;
  customMessage?: string;
  priority?: 'low' | 'medium' | 'high';
  autoHide?: boolean;
  hideAfter?: number;
}

export interface TransactionPopupOptions {
  chainId: string;
  address?: string;
  limit?: number;
  offset?: number;
  filter?: 'all' | 'sent' | 'received' | 'contracts';
  timeRange?: 'hour' | 'day' | 'week' | 'month' | 'all';
}

export interface TransactionDetails {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  method?: string;
  interpretation?: string;
  txType?: 'transfer' | 'contract' | 'defi' | 'nft' | 'bridge';
  usdValue?: number;
  fee?: string;
  confirmations?: number;
}

export interface NotificationData {
  id: string;
  chainId: string;
  hash: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  userAddress?: string;
  interpretation?: string;
  gasUsed?: string;
  confirmations?: number;
  blockNumber?: number;
  priority: 'low' | 'medium' | 'high';
  autoHide: boolean;
  hideAfter: number;
  txType?: string;
  usdValue?: number;
}

export interface BlockscoutApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface NotificationContextType {
  openTxToast: (chainId: string, hash: string, options?: Partial<TransactionToastOptions>) => Promise<void>;
  notifications: NotificationData[];
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  pauseNotifications: () => void;
  resumeNotifications: () => void;
  isPaused: boolean;
  unreadCount: number;
}

export interface TransactionPopupContextType {
  openPopup: (options: TransactionPopupOptions) => void;
  closePopup: () => void;
  isOpen: boolean;
  transactions: TransactionDetails[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  hasMore: boolean;
  loadMore: () => void;
}

export interface ChainStats {
  chainId: string;
  name: string;
  latestBlock: number;
  avgBlockTime: number;
  totalTransactions: number;
  activeAddresses: number;
  gasPrice: string;
  networkHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

// Enhanced Blockscout API client with advanced features
class EnhancedBlockscoutApiClient {
  private baseUrls: Record<string, string> = {
    '1': 'https://eth.blockscout.com',
    '137': 'https://polygon.blockscout.com',
    '8453': 'https://base.blockscout.com',
    '10': 'https://optimism.blockscout.com',
    '42161': 'https://arbitrum.blockscout.com',
    '747': 'https://evm.flowscan.io',
    '545': 'https://evm-testnet.flowscan.io'
  };

  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private retryDelays = [1000, 2000, 4000];

  private getBaseUrl(chainId: string): string {
    return this.baseUrls[chainId] || `https://blockscout.com/chain/${chainId}`;
  }

  private getCacheKey(url: string, params?: Record<string, any>): string {
    return `${url}${params ? `?${new URLSearchParams(params).toString()}` : ''}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number = 30000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private async fetchWithRetry(url: string, options?: RequestInit, retryCount = 0): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok && retryCount < this.retryDelays.length) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelays[retryCount]));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < this.retryDelays.length) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelays[retryCount]));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  async getTransaction(chainId: string, hash: string): Promise<TransactionDetails | null> {
    const cacheKey = this.getCacheKey(`tx-${chainId}-${hash}`);
    const cached = this.getFromCache<TransactionDetails>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl = this.getBaseUrl(chainId);
      const response = await this.fetchWithRetry(`${baseUrl}/api/v2/transactions/${hash}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const transaction: TransactionDetails = {
        hash: data.hash,
        blockNumber: parseInt(data.block_number || '0'),
        from: data.from?.hash || '',
        to: data.to?.hash || '',
        value: data.value || '0',
        gasUsed: data.gas_used || '0',
        gasPrice: data.gas_price || '0',
        status: data.status === 'ok' ? 'success' : data.status === 'error' ? 'failed' : 'pending',
        timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
        method: data.method || 'transfer',
        interpretation: data.decoded_input?.method_call || 'Transaction',
        txType: this.classifyTransactionType(data),
        usdValue: data.exchange_rate ? parseFloat(data.value || '0') * data.exchange_rate : undefined,
        fee: data.fee || '0',
        confirmations: data.confirmations || 0
      };

      this.setCache(cacheKey, transaction, 60000); // Cache for 1 minute
      return transaction;
    } catch (error) {
      console.error(`Error fetching transaction ${hash} on chain ${chainId}:`, error);
      
      // Return mock data for development with realistic values
      const mockTransaction: TransactionDetails = {
        hash,
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        from: '0x' + Math.random().toString(16).slice(2, 42),
        to: '0x' + Math.random().toString(16).slice(2, 42),
        value: (Math.random() * 10).toFixed(6),
        gasUsed: Math.floor(Math.random() * 100000 + 21000).toString(),
        gasPrice: (Math.random() * 50 + 10).toFixed(9),
        status: Math.random() > 0.1 ? 'success' : 'failed',
        timestamp: Date.now(),
        method: 'transfer',
        interpretation: 'Mock transaction for development',
        txType: ['transfer', 'contract', 'defi', 'bridge'][Math.floor(Math.random() * 4)] as any,
        usdValue: Math.random() * 1000,
        fee: (Math.random() * 0.01).toFixed(6),
        confirmations: Math.floor(Math.random() * 100)
      };
      
      return mockTransaction;
    }
  }

  async getAddressTransactions(
    chainId: string, 
    address: string, 
    limit: number = 20,
    offset: number = 0,
    filter?: string
  ): Promise<{ transactions: TransactionDetails[]; total: number }> {
    const cacheKey = this.getCacheKey(`addr-txs-${chainId}-${address}`, { limit, offset, filter });
    const cached = this.getFromCache<{ transactions: TransactionDetails[]; total: number }>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl = this.getBaseUrl(chainId);
      const filterParam = filter && filter !== 'all' ? `&filter=${filter}` : '';
      const response = await this.fetchWithRetry(
        `${baseUrl}/api/v2/addresses/${address}/transactions?limit=${limit}&offset=${offset}${filterParam}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const transactions = (data.items || []).map((tx: any) => ({
        hash: tx.hash,
        blockNumber: parseInt(tx.block_number || '0'),
        from: tx.from?.hash || '',
        to: tx.to?.hash || '',
        value: tx.value || '0',
        gasUsed: tx.gas_used || '0',
        gasPrice: tx.gas_price || '0',
        status: tx.status === 'ok' ? 'success' : tx.status === 'error' ? 'failed' : 'pending',
        timestamp: tx.timestamp ? new Date(tx.timestamp).getTime() : Date.now(),
        method: tx.method || 'transfer',
        interpretation: tx.decoded_input?.method_call || 'Transaction',
        txType: this.classifyTransactionType(tx),
        usdValue: tx.exchange_rate ? parseFloat(tx.value || '0') * tx.exchange_rate : undefined,
        fee: tx.fee || '0',
        confirmations: tx.confirmations || 0
      }));

      const result = { transactions, total: data.total_count || transactions.length };
      this.setCache(cacheKey, result, 30000); // Cache for 30 seconds
      return result;
    } catch (error) {
      console.error(`Error fetching transactions for ${address} on chain ${chainId}:`, error);
      
      // Return mock data with pagination info
      const mockTransactions = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
        hash: '0x' + Math.random().toString(16).slice(2, 66),
        blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
        from: Math.random() > 0.5 ? address : '0x' + Math.random().toString(16).slice(2, 42),
        to: Math.random() > 0.5 ? address : '0x' + Math.random().toString(16).slice(2, 42),
        value: (Math.random() * 10).toFixed(6),
        gasUsed: Math.floor(Math.random() * 100000 + 21000).toString(),
        gasPrice: (Math.random() * 50 + 10).toFixed(9),
        status: Math.random() > 0.1 ? 'success' : 'failed',
        timestamp: Date.now() - (i * 3600000), // 1 hour apart
        method: ['transfer', 'approve', 'deposit', 'withdraw', 'swap'][Math.floor(Math.random() * 5)],
        interpretation: `Mock transaction ${offset + i + 1}`,
        txType: ['transfer', 'contract', 'defi', 'nft', 'bridge'][Math.floor(Math.random() * 5)] as any,
        usdValue: Math.random() * 1000,
        fee: (Math.random() * 0.01).toFixed(6),
        confirmations: Math.floor(Math.random() * 100)
      }));
      
      return { transactions: mockTransactions, total: 1000 }; // Mock total count
    }
  }

  async getChainStats(chainId: string): Promise<ChainStats> {
    const cacheKey = `chain-stats-${chainId}`;
    const cached = this.getFromCache<ChainStats>(cacheKey);
    if (cached) return cached;

    try {
      const baseUrl = this.getBaseUrl(chainId);
      const response = await this.fetchWithRetry(`${baseUrl}/api/v2/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const stats: ChainStats = {
        chainId,
        name: getChainName(chainId),
        latestBlock: parseInt(data.latest_block || '0'),
        avgBlockTime: parseFloat(data.average_block_time || '12'),
        totalTransactions: parseInt(data.total_transactions || '0'),
        activeAddresses: parseInt(data.active_addresses || '0'),
        gasPrice: data.gas_price || '0',
        networkHealth: this.calculateNetworkHealth(data)
      };

      this.setCache(cacheKey, stats, 120000); // Cache for 2 minutes
      return stats;
    } catch (error) {
      console.error(`Error fetching chain stats for ${chainId}:`, error);
      
      // Mock data
      return {
        chainId,
        name: getChainName(chainId),
        latestBlock: Math.floor(Math.random() * 1000000) + 18000000,
        avgBlockTime: 12 + Math.random() * 8,
        totalTransactions: Math.floor(Math.random() * 100000000),
        activeAddresses: Math.floor(Math.random() * 1000000),
        gasPrice: (Math.random() * 50 + 10).toFixed(9),
        networkHealth: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)] as any
      };
    }
  }

  private classifyTransactionType(tx: any): TransactionDetails['txType'] {
    const method = tx.method?.toLowerCase() || '';
    const to = tx.to?.hash?.toLowerCase() || '';
    
    if (method.includes('bridge') || to.includes('bridge')) return 'bridge';
    if (method.includes('swap') || method.includes('trade')) return 'defi';
    if (method.includes('mint') || method.includes('nft')) return 'nft';
    if (tx.to?.is_contract) return 'contract';
    return 'transfer';
  }

  private calculateNetworkHealth(stats: any): ChainStats['networkHealth'] {
    // Simple health calculation based on block time and activity
    const blockTime = parseFloat(stats.average_block_time || '12');
    const score = blockTime < 15 ? 100 : blockTime < 30 ? 75 : blockTime < 60 ? 50 : 25;
    
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }
}

// Singleton API client
const enhancedBlockscoutApi = new EnhancedBlockscoutApiClient();

// Enhanced Notification Context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Enhanced Transaction Popup Context  
const TransactionPopupContext = createContext<TransactionPopupContextType | null>(null);

// Enhanced Notification Provider Component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.volume = 0.3;
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'pending').length;

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [soundEnabled]);

  const openTxToast = useCallback(async (
    chainId: string, 
    hash: string, 
    options?: Partial<TransactionToastOptions>
  ): Promise<void> => {
    if (isPaused) return;

    const notificationId = `${chainId}-${hash}-${Date.now()}`;
    
    // Add pending notification immediately
    const pendingNotification: NotificationData = {
      id: notificationId,
      chainId,
      hash,
      status: 'pending',
      timestamp: Date.now(),
      userAddress: options?.userAddress,
      interpretation: options?.customMessage || 'Transaction submitted',
      priority: options?.priority || 'medium',
      autoHide: options?.autoHide ?? true,
      hideAfter: options?.hideAfter || 10000,
      confirmations: 0
    };
    
    setNotifications(prev => [pendingNotification, ...prev.slice(0, 19)]); // Keep last 20
    playNotificationSound();
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Transaction Submitted', {
        body: `Transaction ${hash.slice(0, 10)}... submitted on ${getChainName(chainId)}`,
        icon: '/favicon.ico',
        tag: notificationId
      });
    }
    
    // Fetch transaction details and poll for status
    try {
      const txDetails = await enhancedBlockscoutApi.getTransaction(chainId, hash);
      
      if (txDetails) {
        // Enhanced polling with exponential backoff
        let attempts = 0;
        const maxAttempts = 30;
        const pollInterval = setInterval(async () => {
          attempts++;
          
          const updatedTx = await enhancedBlockscoutApi.getTransaction(chainId, hash);
          
          if (updatedTx && (updatedTx.status !== 'pending' || attempts >= maxAttempts)) {
            clearInterval(pollInterval);
            
            const finalStatus = updatedTx.status === 'pending' ? 'failed' : updatedTx.status;
            
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === notificationId 
                  ? { 
                      ...notif, 
                      status: finalStatus,
                      confirmations: updatedTx.confirmations || 0,
                      blockNumber: updatedTx.blockNumber,
                      gasUsed: updatedTx.gasUsed,
                      interpretation: updatedTx.interpretation || 'Transaction confirmed',
                      txType: updatedTx.txType,
                      usdValue: updatedTx.usdValue
                    }
                  : notif
              )
            );
            
            // Play different sound for success/failure
            if (finalStatus === 'success') {
              playNotificationSound();
            }
            
            // Show final notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(
                finalStatus === 'success' ? 'Transaction Confirmed ✅' : 'Transaction Failed ❌',
                {
                  body: `Transaction ${hash.slice(0, 10)}... ${finalStatus} on ${getChainName(chainId)}`,
                  icon: '/favicon.ico',
                  tag: `${notificationId}-final`
                }
              );
            }
          } else if (updatedTx) {
            // Update confirmations
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === notificationId 
                  ? { ...notif, confirmations: updatedTx.confirmations || 0 }
                  : notif
              )
            );
          }
        }, Math.min(2000 * Math.pow(1.2, attempts), 10000)); // Exponential backoff
      }
    } catch (error) {
      console.error('Error polling transaction status:', error);
      
      // Mark as failed after timeout
      setTimeout(() => {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'failed', interpretation: 'Transaction monitoring failed' }
              : notif
          )
        );
      }, 60000); // 1 minute timeout
    }
  }, [isPaused, playNotificationSound]);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const pauseNotifications = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeNotifications = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Auto-clear old notifications
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setNotifications(prev => 
        prev.filter(notif => {
          if (notif.status === 'pending') return true; // Keep pending
          if (!notif.autoHide) return true; // Keep if auto-hide disabled
          return now - notif.timestamp < notif.hideAfter; // Remove if expired
        })
      );
    }, 5000); // Check every 5 seconds

    return () => clearInterval(cleanup);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      openTxToast, 
      notifications, 
      clearNotification, 
      clearAllNotifications,
      pauseNotifications,
      resumeNotifications,
      isPaused,
      unreadCount
    }}>
      {children}
      {/* Enhanced Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-3 z-50 max-w-sm">
        {/* Notification Controls */}
        {notifications.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-2 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium">
              {unreadCount} pending • {notifications.length} total
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={isPaused ? resumeNotifications : pauseNotifications}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
              >
                {isPaused ? '🔔' : '🔕'}
              </button>
              <button
                onClick={clearAllNotifications}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
        
        {/* Notifications */}
        {notifications.map(notification => (
          <EnhancedTransactionToast
            key={notification.id}
            notification={notification}
            onClose={() => clearNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// Enhanced Transaction Toast Component
function EnhancedTransactionToast({ 
  notification, 
  onClose 
}: { 
  notification: NotificationData; 
  onClose: () => void; 
}) {
  const [copied, setCopied] = useState(false);

  const getStatusConfig = () => {
    switch (notification.status) {
      case 'pending':
        return {
          icon: '⏳',
          bgClass: 'bg-yellow-50 border-yellow-400 shadow-yellow-100',
          textClass: 'text-yellow-800',
          titleClass: 'text-yellow-900',
          pulseClass: 'animate-pulse'
        };
      case 'success':
        return {
          icon: '✅',
          bgClass: 'bg-green-50 border-green-400 shadow-green-100',
          textClass: 'text-green-700',
          titleClass: 'text-green-900',
          pulseClass: ''
        };
      case 'failed':
        return {
          icon: '❌',
          bgClass: 'bg-red-50 border-red-400 shadow-red-100',
          textClass: 'text-red-700',
          titleClass: 'text-red-900',
          pulseClass: ''
        };
    }
  };

  const { icon, bgClass, textClass, titleClass, pulseClass } = getStatusConfig();

  const getPriorityIndicator = () => {
    switch (notification.priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(notification.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openInExplorer = () => {
    const baseUrl = enhancedBlockscoutApi['getBaseUrl'](notification.chainId);
    window.open(`${baseUrl}/tx/${notification.hash}`, '_blank');
  };

  return (
    <div className={`max-w-sm rounded-xl shadow-lg border-l-4 ${bgClass} ${pulseClass} relative group backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-xs">{getPriorityIndicator()}</span>
          <h4 className={`font-semibold text-sm ${titleClass}`}>
            Transaction {notification.status === 'pending' ? 'Pending' : 
                      notification.status === 'success' ? 'Confirmed' : 'Failed'}
          </h4>
        </div>
        
        <button
          onClick={onClose}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 p-1 rounded"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Transaction Hash */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono break-all ${textClass}`}>
            {notification.hash.slice(0, 12)}...{notification.hash.slice(-8)}
          </span>
          <div className="flex gap-1">
            <button
              onClick={copyToClipboard}
              className={`p-1 rounded hover:bg-white/50 transition-colors ${textClass}`}
              title="Copy hash"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            <button
              onClick={openInExplorer}
              className={`p-1 rounded hover:bg-white/50 transition-colors ${textClass}`}
              title="View in explorer"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className={`${textClass} opacity-75`}>Chain:</span>
            <p className={`font-medium ${textClass}`}>{getChainName(notification.chainId)}</p>
          </div>
          
          {notification.confirmations !== undefined && (
            <div>
              <span className={`${textClass} opacity-75`}>Confirmations:</span>
              <p className={`font-medium ${textClass}`}>{notification.confirmations}</p>
            </div>
          )}
          
          {notification.usdValue && (
            <div>
              <span className={`${textClass} opacity-75`}>Value:</span>
              <p className={`font-medium ${textClass}`}>${notification.usdValue.toFixed(2)}</p>
            </div>
          )}
          
          {notification.gasUsed && (
            <div>
              <span className={`${textClass} opacity-75`}>Gas:</span>
              <p className={`font-medium ${textClass}`}>{parseInt(notification.gasUsed).toLocaleString()}</p>
            </div>
          )}
        </div>
        
        {/* Interpretation */}
        {notification.interpretation && (
          <p className={`text-xs ${textClass} opacity-90 bg-white/30 rounded p-2`}>
            {notification.interpretation}
          </p>
        )}
        
        {/* Transaction Type Badge */}
        {notification.txType && (
          <div className="flex justify-end">
            <span className={`text-xs px-2 py-1 rounded-full bg-white/40 ${textClass} font-medium`}>
              {notification.txType}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Transaction Popup Provider Component
export function TransactionPopupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [popupOptions, setPopupOptions] = useState<TransactionPopupOptions | null>(null);
  const [transactions, setTransactions] = useState<TransactionDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const openPopup = useCallback(async (options: TransactionPopupOptions) => {
    setPopupOptions(options);
    setIsOpen(true);
    setLoading(true);
    setCurrentPage(0);
    setTransactions([]);
    
    try {
      let result: { transactions: TransactionDetails[]; total: number };
      
      if (options.address) {
        result = await enhancedBlockscoutApi.getAddressTransactions(
          options.chainId,
          options.address,
          options.limit || 20,
          0,
          options.filter
        );
      } else {
        // For chain-wide transactions, we'd use a different endpoint
        result = { transactions: [], total: 0 };
      }
      
      setTransactions(result.transactions);
      setTotalCount(result.total);
      setHasMore(result.transactions.length < result.total);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
      setTotalCount(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!popupOptions || loading || !hasMore) return;
    
    setLoading(true);
    const nextPage = currentPage + 1;
    const offset = nextPage * (popupOptions.limit || 20);
    
    try {
      let result: { transactions: TransactionDetails[]; total: number };
      
      if (popupOptions.address) {
        result = await enhancedBlockscoutApi.getAddressTransactions(
          popupOptions.chainId,
          popupOptions.address,
          popupOptions.limit || 20,
          offset,
          popupOptions.filter
        );
      } else {
        result = { transactions: [], total: 0 };
      }
      
      setTransactions(prev => [...prev, ...result.transactions]);
      setCurrentPage(nextPage);
      setHasMore(transactions.length + result.transactions.length < result.total);
    } catch (error) {
      console.error('Error loading more transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [popupOptions, loading, hasMore, currentPage, transactions.length]);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    setPopupOptions(null);
    setTransactions([]);
    setCurrentPage(0);
    setTotalCount(0);
    setHasMore(false);
  }, []);

  return (
    <TransactionPopupContext.Provider value={{ 
      openPopup, 
      closePopup, 
      isOpen, 
      transactions, 
      loading,
      totalCount,
      currentPage,
      hasMore,
      loadMore
    }}>
      {children}
      {/* Enhanced Transaction History Modal */}
      {isOpen && popupOptions && (
        <EnhancedTransactionHistoryModal
          options={popupOptions}
          transactions={transactions}
          loading={loading}
          totalCount={totalCount}
          hasMore={hasMore}
          onClose={closePopup}
          onLoadMore={loadMore}
        />
      )}
    </TransactionPopupContext.Provider>
  );
}

// Enhanced Transaction History Modal Component
function EnhancedTransactionHistoryModal({
  options,
  transactions,
  loading,
  totalCount,
  hasMore,
  onClose,
  onLoadMore
}: {
  options: TransactionPopupOptions;
  transactions: TransactionDetails[];
  loading: boolean;
  totalCount: number;
  hasMore: boolean;
  onClose: () => void;
  onLoadMore: () => void;
}) {
  const [filter, setFilter] = useState(options.filter || 'all');
  const [sortBy, setSortBy] = useState<'time' | 'value' | 'gas'>('time');

  const filteredTransactions = transactions
    .filter(tx => {
      if (filter === 'all') return true;
      if (filter === 'sent' && options.address) return tx.from.toLowerCase() === options.address.toLowerCase();
      if (filter === 'received' && options.address) return tx.to.toLowerCase() === options.address.toLowerCase();
      if (filter === 'contracts') return tx.txType === 'contract' || tx.txType === 'defi';
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'time': return b.timestamp - a.timestamp;
        case 'value': return parseFloat(b.value) - parseFloat(a.value);
        case 'gas': return parseInt(b.gasUsed) - parseInt(a.gasUsed);
        default: return 0;
      }
    });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Enhanced Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Transaction History
              </h2>
              <p className="text-slate-600">
                {getChainName(options.chainId)} • {totalCount.toLocaleString()} total transactions
              </p>
              {options.address && (
                <p className="text-sm text-slate-500 font-mono">
                  {options.address.slice(0, 8)}...{options.address.slice(-6)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Enhanced Filters and Controls */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              {['all', 'sent', 'received', 'contracts'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="time">Time</option>
                <option value="value">Value</option>
                <option value="gas">Gas Used</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Enhanced Content */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading && transactions.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-slate-600">Loading transaction history...</span>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Info className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredTransactions.map((tx) => (
                <EnhancedTransactionRow 
                  key={tx.hash} 
                  transaction={tx} 
                  chainId={options.chainId}
                  userAddress={options.address}
                />
              ))}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-6">
                  <button
                    onClick={onLoadMore}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Loading...' : `Load More (${totalCount - transactions.length} remaining)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Enhanced Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 text-center">
          <a
            href={`${enhancedBlockscoutApi['getBaseUrl'](options.chainId)}${options.address ? `/address/${options.address}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Full History on Blockscout
          </a>
        </div>
      </div>
    </div>
  );
}

// Enhanced Transaction Row Component
function EnhancedTransactionRow({ 
  transaction, 
  chainId,
  userAddress 
}: { 
  transaction: TransactionDetails; 
  chainId: string;
  userAddress?: string;
}) {
  const [copied, setCopied] = useState(false);
  
  const getStatusConfig = () => {
    switch (transaction.status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getTxTypeConfig = () => {
    switch (transaction.txType) {
      case 'transfer': return { icon: '💸', color: 'bg-blue-100 text-blue-800' };
      case 'contract': return { icon: '📄', color: 'bg-purple-100 text-purple-800' };
      case 'defi': return { icon: '🏦', color: 'bg-green-100 text-green-800' };
      case 'nft': return { icon: '🖼️', color: 'bg-pink-100 text-pink-800' };
      case 'bridge': return { icon: '🌉', color: 'bg-orange-100 text-orange-800' };
      default: return { icon: '⚡', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getDirectionInfo = () => {
    if (!userAddress) return null;
    
    const isIncoming = transaction.to.toLowerCase() === userAddress.toLowerCase();
    const isOutgoing = transaction.from.toLowerCase() === userAddress.toLowerCase();
    
    if (isIncoming && !isOutgoing) return { direction: 'in', icon: '📥', color: 'text-green-600' };
    if (isOutgoing && !isIncoming) return { direction: 'out', icon: '📤', color: 'text-red-600' };
    return { direction: 'self', icon: '🔄', color: 'text-blue-600' };
  };

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(transaction.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openInExplorer = () => {
    const baseUrl = enhancedBlockscoutApi['getBaseUrl'](chainId);
    window.open(`${baseUrl}/tx/${transaction.hash}`, '_blank');
  };

  const typeConfig = getTxTypeConfig();
  const directionInfo = getDirectionInfo();

  return (
    <div className="border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all bg-white">
      <div className="flex items-start justify-between">
        {/* Left Section */}
        <div className="flex items-start gap-4 flex-1">
          {/* Type & Direction Icons */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">{typeConfig.icon}</span>
            {directionInfo && (
              <span className={`text-lg ${directionInfo.color}`}>{directionInfo.icon}</span>
            )}
          </div>
          
          {/* Transaction Details */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-slate-900">
                {transaction.interpretation || transaction.method || 'Transaction'}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusConfig()}`}>
                {transaction.status}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.color}`}>
                {transaction.txType}
              </span>
            </div>
            
            {/* Hash & Actions */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-slate-600 break-all">
                {transaction.hash}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={copyHash}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                  title="Copy hash"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={openInExplorer}
                  className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                  title="View in explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Address Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">From:</span>
                <p className="font-mono text-slate-700 break-all">
                  {transaction.from.slice(0, 12)}...{transaction.from.slice(-8)}
                </p>
              </div>
              <div>
                <span className="text-slate-500">To:</span>
                <p className="font-mono text-slate-700 break-all">
                  {transaction.to.slice(0, 12)}...{transaction.to.slice(-8)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Section - Values */}
        <div className="text-right space-y-2 min-w-0 ml-4">
          {/* Value */}
          <div>
            <p className="text-lg font-bold text-slate-900">
              {parseFloat(transaction.value).toFixed(6)} ETH
            </p>
            {transaction.usdValue && (
              <p className="text-sm text-slate-600">
                ${transaction.usdValue.toFixed(2)}
              </p>
            )}
          </div>
          
          {/* Stats */}
          <div className="space-y-1 text-xs text-slate-500">
            <div className="flex justify-between gap-4">
              <span>Block:</span>
              <span className="font-mono">#{transaction.blockNumber.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Gas:</span>
              <span>{parseInt(transaction.gasUsed).toLocaleString()}</span>
            </div>
            {transaction.confirmations !== undefined && (
              <div className="flex justify-between gap-4">
                <span>Conf:</span>
                <span>{transaction.confirmations}</span>
              </div>
            )}
          </div>
          
          {/* Timestamp */}
          <p className="text-xs text-slate-500 mt-2">
            {new Date(transaction.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// Custom hooks
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

// Utility functions
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

// Enhanced chain mapping
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

export function isSupportedChain(chainId: string): chainId is SupportedChainId {
  return chainId in SUPPORTED_CHAINS;
}

export function getChainName(chainId: string): string {
  return SUPPORTED_CHAINS[chainId as SupportedChainId] || `Chain ${chainId}`;
}

// Export enhanced API client for direct use
export { enhancedBlockscoutApi as BlockscoutApiClient };
