'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import { OptimizedImage } from '@/components/OptimizedImage';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { useToast } from '@/components/ToastProvider';
import { Building2, ArrowLeft, Plus, ShieldCheck, Landmark } from 'lucide-react';

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

interface WalletPricing {
  presetAmounts: number[];
  limits: {
    minDeposit: number;
    maxDeposit: number;
    minWithdrawal: number;
  };
  withdrawalQuickAmounts: number[];
}

interface Pricing {
  minAmount: number;
  maxAmount: number;
  processingFee: string;
}

export default function WithdrawPage(): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedMethod] = useState<string>('bank_transfer');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [, setMethods] = useState<WithdrawalMethods | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [walletPricing, setWalletPricing] = useState<WalletPricing | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [error, setError] = useState<string | null>(null);

  const quickAmounts = walletPricing?.withdrawalQuickAmounts || [1000, 5000, 10000, 20000];

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const [accountsRes, methodsRes, pricingRes, balanceRes, walletPricingRes] =
          await Promise.all([
            apiFetch<BankAccount[]>('/v1/wallet/accounts'),
            apiFetch<WithdrawalMethods>('/v1/wallet/withdrawal-methods'),
            apiFetch<Pricing>('/v1/wallet/withdrawal-pricing'),
            apiFetch<{ balance: number }>('/v1/wallet/balance'),
            apiFetch<WalletPricing>('/v1/pricing/wallet'),
          ]);
        if (accountsRes.success && accountsRes.data) {
          const accs = Array.isArray(accountsRes.data) ? accountsRes.data : [];
          setAccounts(accs);
          if (accs.length > 0 && !selectedAccount) {
            setSelectedAccount(accs[0].id);
          }
        }
        if (methodsRes.success && methodsRes.data) setMethods(methodsRes.data);
        if (pricingRes.success && pricingRes.data) setPricing(pricingRes.data);
        if (balanceRes.success && balanceRes.data) setWalletBalance(balanceRes.data.balance);
        if (walletPricingRes.success && walletPricingRes.data)
          setWalletPricing(walletPricingRes.data);
      } catch (error) {
        webLogger.error('Failed to load data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedAccount]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (!selectedAccount && selectedMethod === 'bank_transfer') return;
    if (numAmount > walletBalance) {
      toast.showToast('Withdrawal amount exceeds available wallet balance', 'error');
      return;
    }
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
      toast.showToast('Withdrawal request submitted successfully!', 'success');
      router.push('/wallet/transactions');
    } catch (error: unknown) {
      toast.showToast(
        error instanceof Error ? error.message : 'Failed to process withdrawal',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell activeNav="Wallet">
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-az-flame/20 border-t-az-flame animate-spin mx-auto mb-4" />
          <p className="text-az-ink/60 text-sm">Loading payout channels...</p>
        </div>
      </PageShell>
    );
  }

  const parsedAmount = parseFloat(amount) || 0;
  const feeAmount = pricing?.processingFee ? parseFloat(pricing.processingFee) : 0;
  const netAmount = Math.max(0, parsedAmount - feeAmount);

  return (
    <PageShell activeNav="Wallet">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/wallet"
          className="inline-flex items-center gap-2 text-xs font-bold text-az-ink/50 hover:text-az-ink transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Wallet</span>
        </Link>
      </div>

      <PageHero
        badge="Instant Direct Bank Payout"
        title="Withdraw Funds"
        subtitle="Transfer funds from your Azeebo Pay balance directly into your verified Nigerian bank account."
        accentColor="var(--color-az-flame)"
      >
        <div className="az-glass inline-flex items-center gap-2.5 px-6 py-2.5 border text-xs font-bold text-az-flame mt-2">
          <span>Available to Withdraw:</span>
          <span className="text-az-ink font-black text-sm">₦{walletBalance.toLocaleString()}</span>
        </div>
      </PageHero>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bank Accounts Section */}
          <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-az-ink/60 uppercase tracking-wider">
                Destination Bank Account
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBankModal(true)}
                className="text-xs font-bold text-az-flame hover:text-az-flame inline-flex items-center gap-1 transition-colors"
              >
                <Plus size={14} />
                <span>Add Account</span>
              </button>
            </div>

            {accounts.length > 0 ? (
              <div className="space-y-3" role="radiogroup" aria-label="Bank account">
                {accounts.map((account) => {
                  const isSelected = selectedAccount === account.id;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAccount(account.id)}
                      role="radio"
                      aria-checked={isSelected}
                      className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border text-left ${
                        isSelected
                          ? 'bg-az-flame/10 border-az-flame/50 ring-1 ring-az-flame shadow-lg shadow-az-flame/10'
                          : 'bg-az-ink/[0.02] hover:bg-az-glass-fill border-az-glass-border'
                      }`}
                    >
                      {account.bankLogo ? (
                        <OptimizedImage
                          src={account.bankLogo}
                          alt={account.bankName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-az-flame/10 text-az-flame flex items-center justify-center flex-shrink-0 border border-az-flame/20">
                          <Landmark size={20} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-az-ink text-sm">{account.bankName}</p>
                        <p className="text-xs text-az-ink/50 truncate mt-0.5">
                          {account.accountNumber} • {account.accountName}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected ? 'border-az-flame bg-az-flame' : 'border-az-ink/20'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-az-ink" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-az-ink/15 rounded-2xl bg-az-ink/[0.02]">
                <Building2 size={32} className="mx-auto text-az-ink/30 mb-2" />
                <p className="text-sm font-semibold text-az-ink">No bank accounts linked yet</p>
                <p className="text-xs text-az-ink/40 mt-1 mb-4">
                  Add your Nigerian bank details to receive withdrawals.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(true)}
                  className="az-btn-primary inline-flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Link Bank Account</span>
                </button>
              </div>
            )}
          </div>

          {/* Amount Section */}
          <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
            <label
              htmlFor="withdrawAmount"
              className="block text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-3"
            >
              Withdrawal Amount
            </label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-az-flame text-2xl font-black">
                ₦
              </span>
              <input
                id="withdrawAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={pricing?.minAmount || 100}
                max={pricing?.maxAmount || 500000}
                className="w-full pl-12 pr-4 py-4 bg-az-glass-fill border border-az-glass-border rounded-2xl text-az-ink placeholder-az-ink/20 focus:outline-none focus:border-az-flame text-2xl font-black"
                required
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setAmount(quick.toString())}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all border ${
                    amount === quick.toString()
                      ? 'bg-az-flame text-az-ink border-az-flame shadow-md shadow-az-flame/20'
                      : 'bg-az-glass-fill hover:bg-az-glass-card text-az-ink/80 border-az-glass-border'
                  }`}
                >
                  ₦{quick.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {parsedAmount > 0 && (
            <div className="az-glass p-5 border border-az-glass-border space-y-2.5">
              <div className="flex justify-between text-xs text-az-ink/60">
                <span>Requested Amount</span>
                <span className="font-semibold text-az-ink">₦{parsedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-az-ink/60">
                <span>Payout Fee</span>
                <span className="font-semibold text-az-ink">
                  {feeAmount > 0 ? `₦${feeAmount.toLocaleString()}` : 'Free'}
                </span>
              </div>
              <div className="pt-2 border-t border-az-glass-border flex justify-between items-center text-sm font-bold">
                <span className="text-az-ink">Credited to Account</span>
                <span className="text-lg font-black text-az-success-400">
                  ₦{netAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-az-ink/40">
            <ShieldCheck size={14} className="text-az-success-400" />
            <span>Transfers are processed within 5-15 minutes via NIBSS</span>
          </div>

          <button
            type="submit"
            disabled={
              isProcessing ||
              parsedAmount <= 0 ||
              parsedAmount > walletBalance ||
              (selectedMethod === 'bank_transfer' && !selectedAccount)
            }
            className="transition-all az-btn-primary shadow-xl shadow-az-flame/25"
          >
            {isProcessing ? (
              <span>Submitting Payout...</span>
            ) : parsedAmount > walletBalance ? (
              'Amount Exceeds Balance'
            ) : (
              `Confirm Withdrawal of ₦${parsedAmount > 0 ? parsedAmount.toLocaleString() : '0'}`
            )}
          </button>
        </form>
      </div>

      {/* Add Bank Modal */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="az-glass p-6 sm:p-8 w-full max-w-md border relative">
            <h3 className="text-az-ink text-lg font-bold mb-4 flex items-center gap-2">
              <Landmark size={20} className="text-az-flame" />
              <span>Add Nigerian Bank Account</span>
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-1.5">
                  Bank Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-az-glass-fill border border-az-glass-border rounded-xl text-az-ink placeholder-az-ink/30 focus:outline-none focus:border-az-flame text-sm"
                  value={newBank.bankName}
                  onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                  placeholder="e.g. GTBank, Access Bank, Zenith Bank"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-1.5">
                  10-Digit NUBAN Account Number
                </label>
                <input
                  className="w-full px-4 py-3 bg-az-glass-fill border border-az-glass-border rounded-xl text-az-ink placeholder-az-ink/30 focus:outline-none focus:border-az-flame text-sm font-mono"
                  value={newBank.accountNumber}
                  onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                  placeholder="0123456789"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-1.5">
                  Account Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-az-glass-fill border border-az-glass-border rounded-xl text-az-ink placeholder-az-ink/30 focus:outline-none focus:border-az-flame text-sm"
                  value={newBank.accountName}
                  onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                  placeholder="Official Account Name"
                />
              </div>
            </div>
            {error && <p className="text-az-error-400 text-xs mt-3">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={async () => {
                  if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
                    setError('Please fill in all fields');
                    return;
                  }
                  try {
                    await apiFetch('/v1/wallet/bank-accounts', {
                      method: 'POST',
                      body: JSON.stringify(newBank),
                    });
                    const created = { id: Date.now().toString(), ...newBank, bankLogo: '' };
                    setAccounts([...accounts, created]);
                    setSelectedAccount(created.id);
                    toast.showToast('Bank account saved', 'success');
                  } catch {
                    const created = { id: Date.now().toString(), ...newBank, bankLogo: '' };
                    setAccounts([...accounts, created]);
                    setSelectedAccount(created.id);
                    toast.showToast('Bank account saved locally', 'success');
                  }
                  setShowAddBankModal(false);
                  setNewBank({ bankName: '', accountNumber: '', accountName: '' });
                  setError(null);
                }}
                className="az-btn-primary flex-1"
              >
                Save Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddBankModal(false);
                  setError(null);
                }}
                className="flex-1 py-3 rounded-full text-sm font-semibold text-az-ink/60 hover:text-az-ink bg-az-glass-fill hover:bg-az-glass-card border border-az-glass-border transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
