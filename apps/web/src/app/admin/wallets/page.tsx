'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { webLogger } from '@/lib/logger';

interface Wallet {
  id: string;
  userId: string;
  userName: string;
  email: string;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  status: 'active' | 'frozen' | 'suspended';
  createdAt: string;
}

export default function WalletManagementPage(): JSX.Element {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'active' | 'frozen' | 'suspended'>('all');

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async (): Promise<void> => {
    try {
      const response = await api.admin.getWallets();
      if (response.success && response.data) {
        setWallets(response.data.items || []);
      }
    } catch (error) {
      webLogger.error('Failed to load wallets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (walletId: string, newStatus: string): Promise<void> => {
    try {
      const response = await api.admin.updateWalletStatus(walletId, newStatus);
      if (response.success) {
        loadWallets();
        alert(`Wallet status updated to ${newStatus}`);
      } else {
        alert(response.message || 'Failed to update wallet status');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update wallet status';
      alert(message);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'frozen':
        return 'text-yellow-500';
      case 'suspended':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const filteredWallets = filter === 'all'
    ? wallets
    : wallets.filter((w) => w.status === filter);

  const searchedWallets = searchQuery
    ? filteredWallets.filter(
        (w) =>
          w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredWallets;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading wallets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Wallet Management</h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search wallets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex gap-2">
            {(['all', 'active', 'frozen', 'suspended'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-foreground hover:bg-accent'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Balance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Deposits</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Withdrawals</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {searchedWallets.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-accent/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{wallet.userName}</p>
                      <p className="text-sm text-muted-foreground">{wallet.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-foreground">{formatCurrency(wallet.balance)}</td>
                  <td className="px-6 py-4 text-green-500">{formatCurrency(wallet.totalDeposits)}</td>
                  <td className="px-6 py-4 text-red-500">{formatCurrency(wallet.totalWithdrawals)}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${getStatusColor(wallet.status)}`}>
                      {wallet.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {wallet.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(wallet.id, 'frozen')}
                          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                        >
                          Freeze
                        </button>
                      )}
                      {wallet.status === 'frozen' && (
                        <button
                          onClick={() => handleStatusChange(wallet.id, 'active')}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          Unfreeze
                        </button>
                      )}
                      {wallet.status !== 'suspended' && (
                        <button
                          onClick={() => handleStatusChange(wallet.id, 'suspended')}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
