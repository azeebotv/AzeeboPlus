import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletApi, apiClient, type WalletBalance, type Transaction } from '../api';
import { useAuth } from './AuthContext';

interface WalletContextType {
  wallet: WalletBalance | null;
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  getWallet: () => Promise<void>;
  getTransactions: () => Promise<void>;
  fundWallet: (
    amount: number,
    provider: 'paystack' | 'flutterwave',
    email: string
  ) => Promise<{ success: boolean; authorizationUrl?: string; message?: string }>;
  withdraw: (
    amount: number,
    bankCode: string,
    accountNumber: string
  ) => Promise<{ success: boolean; message?: string }>;
  transfer: (
    amount: number,
    recipientId: string,
    description: string
  ) => Promise<{ success: boolean; message?: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      getWallet();
      getTransactions();
    }
  }, [isAuthenticated]);

  const getWallet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await walletApi.getBalance();
      if (response.success && response.data) {
        setWallet(response.data);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to get wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await walletApi.getTransactions(1, 50);
      if (response.success && response.data) {
        setTransactions(response.data.items);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to get transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const fundWallet = async (
    amount: number,
    provider: 'paystack' | 'flutterwave',
    email: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await walletApi.fundWallet({ amount, provider, email });
      if (response.success && response.data) {
        return { success: true, authorizationUrl: response.data.authorizationUrl };
      }
      return { success: false, message: response.message || 'Failed to initiate payment' };
    } catch (error: any) {
      setError(error.message || 'Failed to fund wallet');
      return { success: false, message: error.message || 'Failed to fund wallet' };
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async (amount: number, bankCode: string, accountNumber: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await walletApi.withdraw({ amount, bankCode, accountNumber });
      if (response.success) {
        await getWallet();
        await getTransactions();
        return { success: true };
      }
      return { success: false, message: response.message || 'Failed to withdraw funds' };
    } catch (error: any) {
      setError(error.message || 'Failed to withdraw funds');
      return { success: false, message: error.message || 'Failed to withdraw funds' };
    } finally {
      setIsLoading(false);
    }
  };

  const transfer = async (amount: number, recipientId: string, description: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/wallet/transfer', {
        amount,
        recipientId,
        description,
      });
      if (response && typeof response === 'object' && 'success' in response) {
        await getWallet();
        await getTransactions();
        return { success: true };
      }
      return { success: false, message: 'Failed to transfer funds' };
    } catch (error: any) {
      setError(error.message || 'Failed to transfer funds');
      return { success: false, message: error.message || 'Failed to transfer funds' };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        transactions,
        isLoading,
        error,
        getWallet,
        getTransactions,
        fundWallet,
        withdraw,
        transfer,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
