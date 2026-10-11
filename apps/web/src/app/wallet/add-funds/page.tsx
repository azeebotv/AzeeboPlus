'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { webLogger } from '@/lib/logger';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { useToast } from '@/components/ToastProvider';
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  ArrowLeft,
  ShieldCheck,
  Zap,
} from 'lucide-react';

function PaymentMethodIcon({ id, name }: { id: string; name: string }) {
  const lower = (id + ' ' + name).toLowerCase();
  if (lower.includes('card') || lower.includes('debit') || lower.includes('credit')) {
    return <CreditCard size={22} />;
  }
  if (
    lower.includes('mobile') ||
    lower.includes('ussd') ||
    lower.includes('airtime') ||
    lower.includes('telco')
  ) {
    return <Smartphone size={22} />;
  }
  if (lower.includes('bank') || lower.includes('transfer')) {
    return <Building2 size={22} />;
  }
  return <Wallet size={22} />;
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

  const quickAmounts = walletPricing?.presetAmounts || [500, 1000, 2500, 5000, 10000];

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
          const methods = Array.isArray(methodsResult.data) ? methodsResult.data : [];
          setPaymentMethods(methods);
          if (methods.length > 0 && !selectedMethod) {
            const firstActive = methods.find((m) => m.isActive) || methods[0];
            if (firstActive) setSelectedMethod(firstActive.id);
          }
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
  }, [selectedMethod]);

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
      <PageShell activeNav="Wallet">
        <div className="max-w-2xl mx-auto py-20 px-4 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-az-flame/20 border-t-az-flame animate-spin mx-auto mb-4" />
          <p className="text-az-ink/60 text-sm">Preparing secure payment checkout...</p>
        </div>
      </PageShell>
    );
  }

  const parsedAmount = parseFloat(amount) || 0;
  const feeAmount = pricing?.processingFee ? parseFloat(pricing.processingFee) : 0;
  const totalAmount = parsedAmount + feeAmount;

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
        badge="Instant Top-up"
        title="Add Funds to Wallet"
        subtitle="Top up your account securely with your preferred Nigerian payment channel."
        accentColor="var(--color-az-flame)"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Selection */}
          <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
            <label
              htmlFor="amount"
              className="block text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-3"
            >
              Enter Deposit Amount
            </label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-az-flame text-2xl font-black">
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
                className="w-full pl-12 pr-4 py-4 bg-az-glass-fill border border-az-glass-border rounded-2xl text-az-ink placeholder-az-ink/20 focus:outline-none focus:border-az-flame text-2xl font-black"
                required
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all border ${
                    amount === quickAmount.toString()
                      ? 'bg-az-flame text-az-ink border-az-flame shadow-md shadow-az-flame/20'
                      : 'bg-az-glass-fill hover:bg-az-glass-card text-az-ink/80 border-az-glass-border'
                  }`}
                >
                  ₦{quickAmount.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="az-glass p-6 sm:p-8 border border-az-glass-border">
            <h3 className="text-xs font-bold text-az-ink/60 uppercase tracking-wider mb-4">
              Select Payment Gateway
            </h3>
            <div className="space-y-3" role="radiogroup" aria-label="Payment method">
              {paymentMethods
                .filter((m) => m.isActive)
                .map((method) => {
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      role="radio"
                      aria-checked={isSelected}
                      className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border text-left ${
                        isSelected
                          ? 'bg-az-flame/10 border-az-flame/50 ring-1 ring-az-flame shadow-lg shadow-az-flame/10'
                          : 'bg-az-ink/[0.02] hover:bg-az-glass-fill border-az-glass-border'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          isSelected
                            ? 'bg-az-flame/20 text-az-flame border-az-flame/40'
                            : 'bg-az-glass-fill text-az-ink/60 border-az-glass-border'
                        }`}
                      >
                        <PaymentMethodIcon id={method.id} name={method.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-az-ink text-sm">{method.name}</p>
                        <p className="text-xs text-az-ink/50 truncate mt-0.5">
                          {method.description}
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
          </div>

          {/* Breakdown Summary */}
          {parsedAmount > 0 && (
            <div className="az-glass p-5 border border-az-glass-border space-y-2.5">
              <div className="flex justify-between text-xs text-az-ink/60">
                <span>Top-up Credit</span>
                <span className="font-semibold text-az-ink">₦{parsedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-az-ink/60">
                <span>Gateway Service Charge</span>
                <span className="font-semibold text-az-ink">
                  {feeAmount > 0 ? `₦${feeAmount.toLocaleString()}` : 'Free'}
                </span>
              </div>
              <div className="pt-2 border-t border-az-glass-border flex justify-between items-center text-sm font-bold">
                <span className="text-az-ink">Total Payable</span>
                <span className="text-lg font-black text-az-flame">
                  ₦{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-az-ink/40">
            <ShieldCheck size={14} className="text-az-success-400" />
            <span>Secured with Paystack, Flutterwave & CBN Compliant Rails</span>
          </div>

          <button
            type="submit"
            disabled={isProcessing || parsedAmount <= 0 || !selectedMethod}
            className="transition-all az-btn-primary shadow-xl shadow-az-flame/25 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <span>Initiating Gateway...</span>
            ) : (
              <>
                <Zap size={18} />
                <span>
                  {parsedAmount > 0
                    ? `Proceed to Pay ₦${totalAmount.toLocaleString()}`
                    : 'Enter Amount to Deposit'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
