'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { api, WalletBalance, Transaction } from '../lib/api';
import { useAuth } from './AuthContext';

interface WalletContextType {
  balance: WalletBalance | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  fundWallet: (
    amount: number,
    paymentMethod: string
  ) => Promise<{ success: boolean; message?: string; data?: unknown }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isRefreshingBalance = useRef<boolean>(false);
  const isRefreshingTransactions = useRef<boolean>(false);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || isRefreshingBalance.current) return;

    try {
      isRefreshingBalance.current = true;
      setIsLoading(true);
      setError(null);
      const response = await api.wallet.getBalance();
      if (response.success && response.data) {
        setBalance(response.data);
      } else {
        setError(response.message || 'Failed to fetch wallet balance');
      }
    } catch (err) {
      setError('Failed to fetch wallet balance');
    } finally {
      isRefreshingBalance.current = false;
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshTransactions = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || isRefreshingTransactions.current) return;

    try {
      isRefreshingTransactions.current = true;
      setIsLoading(true);
      setError(null);
      const response = await api.wallet.getTransactions(1, 20);
      if (response.success && response.data) {
        const txData = response.data;
        setTransactions(Array.isArray(txData) ? txData : txData.items || []);
      } else {
        setError(response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Failed to fetch transactions');
    } finally {
      isRefreshingTransactions.current = false;
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fundWallet = async (
    amount: number,
    paymentMethod: string
  ): Promise<{ success: boolean; message?: string; data?: unknown }> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.wallet.fundWallet(amount, paymentMethod);
      if (response.success) {
        await refreshBalance();
        await refreshTransactions();
        return { success: true, data: response.data };
      } else {
        return { success: false, message: response.message || 'Failed to fund wallet' };
      }
    } catch (err) {
      return { success: false, message: 'Failed to fund wallet' };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBalance();
      refreshTransactions();
    } else {
      setBalance(null);
      setTransactions([]);
      setError(null);
    }
  }, [isAuthenticated, refreshBalance, refreshTransactions]);

  const value: WalletContextType = {
    balance,
    transactions,
    isLoading,
    error,
    refreshBalance,
    refreshTransactions,
    fundWallet,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
