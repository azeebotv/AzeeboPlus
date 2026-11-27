import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { walletApi, type WalletBalance, type Transaction } from '../api';
import { generateIdempotencyKey } from '../api/client';

interface WalletSummary {
  balance: number;
  currency: string;
  pendingBalance: number;
  totalFunded: number;
  totalSpent: number;
  totalWithdrawn: number;
}

interface TransactionsResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const walletKeys = {
  all: ['wallet'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  transactions: () => [...walletKeys.all, 'transactions'] as const,
  summary: () => [...walletKeys.all, 'summary'] as const,
};

export function useWalletBalance() {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: async () => {
      const response = await walletApi.getBalance();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch wallet balance');
      }
      return response.data as WalletBalance;
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useWalletTransactions(page = 1, limit = 50) {
  return useQuery({
    queryKey: [...walletKeys.transactions(), { page, limit }],
    queryFn: async () => {
      const response = await walletApi.getTransactions(page, limit);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
      return response.data as TransactionsResponse;
    },
    staleTime: 30_000,
    retry: 2,
  });
}

export function useWalletSummary() {
  return useQuery({
    queryKey: walletKeys.summary(),
    queryFn: async () => {
      const response = await walletApi.getSummary();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch wallet summary');
      }
      return response.data as WalletSummary;
    },
    staleTime: 30_000,
  });
}

export function useFundWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      amount: number;
      provider: 'paystack' | 'flutterwave';
      email: string;
    }) => {
      const response = await walletApi.fundWallet(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to initiate payment');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  // Stable per-intent key: reused across retries of the same withdrawal until
  // it succeeds, then rotated so the next distinct action gets a fresh key
  // (AUD-03).
  const keyRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: async (data: { amount: number; bankCode: string; accountNumber: string }) => {
      const response = await walletApi.withdraw({
        ...data,
        idempotencyKey: (keyRef.current ??= generateIdempotencyKey()),
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to withdraw funds');
      }
      return response.data;
    },
    onSuccess: () => {
      keyRef.current = null;
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}

export function useTransfer() {
  const queryClient = useQueryClient();
  // Same per-intent key contract as useWithdraw (AUD-03).
  const keyRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: async (data: { recipientId: string; amount: number; description?: string }) => {
      const response = await walletApi.transfer({
        ...data,
        idempotencyKey: (keyRef.current ??= generateIdempotencyKey()),
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to transfer funds');
      }
      return response.data;
    },
    onSuccess: () => {
      keyRef.current = null;
      queryClient.invalidateQueries({ queryKey: walletKeys.all });
    },
  });
}
