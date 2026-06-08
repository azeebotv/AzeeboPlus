'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

const PAYMENT_METHODS = [
  { id: 'card', name: 'Debit Card', icon: '💳', description: 'Visa, Mastercard' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer' },
  { id: 'ussd', name: 'USSD', icon: '📱', description: 'Dial code to pay' },
  { id: 'mobile', name: 'Mobile Money', icon: '💰', description: 'MTN, Airtel, etc.' },
];

export default function AddFundsPage(): JSX.Element {
  const router = useRouter();

  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount < 100) {
      setError('Minimum amount is ₦100');
      return false;
    }

    if (numAmount > 1000000) {
      setError('Maximum amount is ₦1,000,000');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiFetch<{ authorizationUrl?: string }>('/v1/wallet/fund', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod: selectedMethod,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to add funds');
      }

      if (result.data?.authorizationUrl) {
        window.location.href = result.data.authorizationUrl;
      } else {
        setSuccess('Wallet funded successfully!');
        setTimeout(() => {
          router.push('/wallet');
        }, 2000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while adding funds';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetAmount = (preset: number): void => {
    setAmount(preset.toString());
    if (error) setError(null);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Add Funds</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border border-border">
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-500">{success}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
              Amount (NGN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
              <input
                id="amount"
                name="amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                className="appearance-none block w-full pl-8 pr-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="0.00"
                min="100"
                max="1000000"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quick Select
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetAmount(preset)}
                  className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    amount === preset.toString()
                      ? 'bg-primary text-white'
                      : 'bg-card border border-border text-foreground hover:bg-accent'
                  }`}
                >
                  ₦{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:bg-accent'
                  }`}
                >
                  <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center">
                    <span className="text-xl">{method.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-foreground">{method.name}</h3>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod === method.id
                        ? 'border-primary'
                        : 'border-border'
                    }`}
                  >
                    {selectedMethod === method.id && (
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              `Add ₦${parseFloat(amount || '0').toLocaleString()}`
            )}
          </button>

          <div className="bg-accent p-4 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">ℹ️ Information</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Minimum deposit: ₦100</li>
              <li>• Maximum deposit: ₦1,000,000</li>
              <li>• Funds are added instantly</li>
              <li>• Transaction fees may apply</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
