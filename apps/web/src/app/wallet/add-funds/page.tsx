'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { useToast } from '@/components/ToastProvider';
import { CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';

function PaymentMethodIcon({ id, name }: { id: string; name: string }) {
  const lower = (id + ' ' + name).toLowerCase();
  if (lower.includes('card') || lower.includes('debit') || lower.includes('credit')) {
    return <CreditCard size={24} />;
  }
  if (
    lower.includes('mobile') ||
    lower.includes('ussd') ||
    lower.includes('airtime') ||
    lower.includes('telco')
  ) {
    return <Smartphone size={24} />;
  }
  if (lower.includes('bank') || lower.includes('transfer')) {
    return <Building2 size={24} />;
  }
  return <Wallet size={24} />;
}

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
              style={{
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--brand-orange)',
              }}
            />
            <p className="mt-4 text-white/60">Loading payment methods...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader logoVariant="light" />
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
            <label htmlFor="amount" className="block text-sm font-medium text-white/70 mb-2">
              Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">
                ₦
              </span>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={pricing?.minAmount || 100}
                max={pricing?.maxAmount || 500000}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#E8420A] text-lg font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 transition-colors"
                >
                  ₦{quickAmount.toLocaleString()}
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
                    className={`w-full az-glass p-4 flex items-center gap-4 transition-all ${selectedMethod === method.id ? 'ring-2 ring-[var(--brand-orange)]' : ''}`}
                    style={
                      selectedMethod === method.id
                        ? { boxShadow: '0 0 20px rgba(232,66,10,0.2)' }
                        : undefined
                    }
                  >
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-[var(--brand-orange)] flex items-center justify-center border border-orange-500/20 flex-shrink-0">
                      <PaymentMethodIcon id={method.id} name={method.name} />
                    </div>
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
                        backgroundColor:
                          selectedMethod === method.id ? 'var(--brand-orange)' : 'transparent',
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
      <AppFooter logoVariant="light" />
    </div>
  );
}
