'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankLogo: string;
}

interface WithdrawalMethods {
  bankTransfer: boolean;
  mobileMoney: boolean;
  cryptoWallet: boolean;
}

interface Pricing {
  minAmount: number;
  maxAmount: number;
  processingFee: string;
}

export default function WithdrawPage(): React.JSX.Element {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('bank_transfer');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [methods, setMethods] = useState<WithdrawalMethods | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const [accountsRes, methodsRes, pricingRes, balanceRes] = await Promise.all([
          apiFetch<BankAccount[]>('/v1/wallet/accounts'),
          apiFetch<WithdrawalMethods>('/v1/wallet/withdrawal-methods'),
          apiFetch<Pricing>('/v1/wallet/withdrawal-pricing'),
          apiFetch<{ balance: number }>('/v1/wallet/balance'),
        ]);
        if (accountsRes.success && accountsRes.data) setAccounts(accountsRes.data);
        if (methodsRes.success && methodsRes.data) setMethods(methodsRes.data);
        if (pricingRes.success && pricingRes.data) setPricing(pricingRes.data);
        if (balanceRes.success && balanceRes.data) setWalletBalance(balanceRes.data.balance);
      } catch (error) {
        webLogger.error('Failed to load data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!selectedAccount && selectedMethod === 'bank_transfer') return;
    if (numAmount > walletBalance) return;
    setIsProcessing(true);
    try {
      const result = await apiFetch('/v1/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: numAmount,
          bankAccountId: selectedMethod === 'bank_transfer' ? selectedAccount : undefined,
          method: selectedMethod,
        }),
      });
      if (!result.success) throw new Error(result.message || 'Failed to process withdrawal');
      alert('Withdrawal request submitted successfully!');
      router.push('/wallet/transactions');
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickAmounts = [1000, 5000, 10000, 20000];

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#E8420A' }}
            />
            <p className="mt-4 text-white/60">Loading withdrawal options...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A0A0A' }}>
      <AppHeader />
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-white/50 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>{' '}
            Back
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Withdraw Funds</h1>
          <p className="text-white/50">Transfer funds to your bank account</p>
          <p className="text-lg font-semibold mt-2" style={{ color: '#E8420A' }}>
            Balance: ₦{walletBalance.toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {selectedMethod === 'bank_transfer' && accounts.length > 0 && (
            <div className="az-glass p-6">
              <h3 className="font-semibold text-white mb-4">Select Bank Account</h3>
              <div className="space-y-3" role="radiogroup" aria-label="Bank account">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccount(account.id)}
                    role="radio"
                    aria-selected={selectedAccount === account.id}
                    className={`w-full az-glass p-4 flex items-center gap-4 transition-all ${selectedAccount === account.id ? 'ring-2' : ''}`}
                    style={
                      selectedAccount === account.id
                        ? { boxShadow: '0 0 20px rgba(232,66,10,0.2)' }
                        : undefined
                    }
                  >
                    <img
                      src={account.bankLogo}
                      alt={account.bankName}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">{account.bankName}</p>
                      <p className="text-sm text-white/50">
                        {account.accountNumber} • {account.accountName}
                      </p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        border:
                          selectedAccount === account.id
                            ? '2px solid #E8420A'
                            : '2px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      {selectedAccount === account.id && (
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: '#E8420A' }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="w-full mt-3 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  border: '1px dashed rgba(255,255,255,0.3)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                }}
              >
                + Add New Account
              </button>
            </div>
          )}

          <div className="az-glass p-6">
            <label className="az-label block mb-3">Withdrawal Amount</label>
            <div className="az-input flex items-center gap-3">
              <span className="text-xl font-bold" style={{ color: '#E8420A' }}>
                ₦
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent outline-none text-2xl font-bold text-white placeholder:text-white/30"
                min={pricing?.minAmount || 100}
                max={pricing?.maxAmount || 100000}
                step="0.01"
                required
              />
            </div>
            <div className="flex gap-2 mt-3" role="listbox" aria-label="Quick amount selection">
              {quickAmounts.map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setAmount(quick.toString())}
                  role="option"
                  aria-selected={amount === quick.toString()}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${amount === quick.toString() ? 'az-btn-primary' : ''}`}
                  style={
                    amount !== quick.toString()
                      ? {
                          border: '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                        }
                      : undefined
                  }
                >
                  ₦{quick.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {amount && parseFloat(amount) > 0 && pricing && (
            <div className="az-glass p-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Amount</span>
                <span className="text-white">₦{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-white/50">Processing Fee</span>
                <span className="text-white">₦{pricing.processingFee}</span>
              </div>
              <div
                className="flex justify-between text-sm mt-2 pt-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="font-semibold text-white">You&apos;ll Receive</span>
                <span className="font-bold" style={{ color: '#E8420A' }}>
                  ₦{(parseFloat(amount) - parseFloat(pricing.processingFee)).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={
              isProcessing || !amount || (selectedMethod === 'bank_transfer' && !selectedAccount)
            }
            className="w-full py-4 rounded-full font-semibold text-lg transition-all az-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Withdraw ₦${amount || '0'}`}
          </button>
        </form>
      </div>
      <AppFooter />
    </div>
  );
}
