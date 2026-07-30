'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { useToast } from '@/components/ToastProvider';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  processingFee: string;
  isActive: boolean;
}

interface Pricing {
  minAmount: number;
  maxAmount: number;
  processingFee: string;
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

export const metadata = {
  title: 'Add Funds | Azeebo',
  description: 'Top up your wallet to enjoy premium features and content.',
  openGraph: {
    title: 'Add Funds | Azeebo',
    description: 'Top up your wallet to enjoy premium features and content.',
  },
};

export default function AddFundsPage(): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [walletPricing, setWalletPricing] = useState<WalletPricing | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const quickAmounts = walletPricing?.presetAmounts || [500, 1000, 2000, 5000];

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const [pricingResult, methodsResult, walletPricingResult] = await Promise.all([
          apiFetch<Pricing>('/v1/wallet/pricing'),
          apiFetch<PaymentMethod[]>('/v1/wallet/payment-methods'),
          apiFetch<WalletPricing>('/v1/pricing/wallet'),
        ]);
        if (pricingResult.success && pricingResult.data) setPricing(pricingResult.data);
        if (methodsResult.success && methodsResult.data) {
          setPaymentMethods(Array.isArray(methodsResult.data) ? methodsResult.data : []);
        }
        if (walletPricingResult.success && walletPricingResult.data)
          setWalletPricing(walletPricingResult.data);
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
    if (isNaN(numAmount) || numAmount < (pricing?.minAmount || 100)) return;
    if (!selectedMethod) return;
    setIsProcessing(true);
    try {
      const result = await apiFetch('/v1/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount: numAmount, paymentMethodId: selectedMethod }),
      });
      if (!result.success) throw new Error(result.message || 'Failed to process deposit');
      toast.showToast('Deposit initiated successfully!', 'success');
      router.push('/wallet/transactions');
    } catch (error: unknown) {
      toast.showToast(
        error instanceof Error ? error.message : 'Failed to process deposit',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--brand-orange)' }}
            />
            <p className="mt-4 text-white/60">Loading payment methods...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
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
          <h1 className="text-3xl font-bold text-white mb-2">Add Funds</h1>
          <p className="text-white/50">Top up your wallet to enjoy premium features</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="az-glass p-6">
            <label className="az-label block mb-3">Enter Amount</label>
            <div className="az-input flex items-center gap-3">
              <span className="text-xl font-bold" style={{ color: 'var(--brand-orange)' }}>
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
                          color: 'var(--brand-white)',
                        }
                      : undefined
                  }
                >
                  ₦{quick.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="az-glass p-6">
            <h3 className="font-semibold text-white mb-4">Select Payment Method</h3>
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
              {paymentMethods
                .filter((m) => m.isActive)
                .map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    role="radio"
                    aria-checked={selectedMethod === method.id}
                    className={`w-full az-glass p-4 flex items-center gap-4 transition-all ${selectedMethod === method.id ? 'ring-2' : ''}`}
                    style={
                      selectedMethod === method.id
                        ? { boxShadow: '0 0 20px rgba(232,66,10,0.2)' }
                        : undefined
                    }
                  >
                    <span className="text-3xl">{method.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-white">{method.name}</p>
                      <p className="text-sm text-white/50">{method.description}</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center`}
                      style={{
                        border:
                          selectedMethod === method.id
                            ? '2px solid #E8420A'
                            : '2px solid rgba(255,255,255,0.2)',
                        backgroundColor: selectedMethod === method.id ? 'var(--brand-orange)' : 'transparent',
                      }}
                    >
                      {selectedMethod === method.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
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
                <span className="font-semibold text-white">Total</span>
                <span className="font-bold" style={{ color: 'var(--brand-orange)' }}>
                  ₦{(parseFloat(amount) + parseFloat(pricing.processingFee)).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing || !amount || !selectedMethod}
            className="w-full py-4 rounded-full font-semibold text-lg transition-all az-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Add ₦${amount || '0'} to Wallet`}
          </button>
        </form>
      </div>
      <AppFooter />
    </div>
  );
}
