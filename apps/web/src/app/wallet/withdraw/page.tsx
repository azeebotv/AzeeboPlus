'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function WithdrawFundsPage(): JSX.Element {
  const router = useRouter();

  const [amount, setAmount] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const validateForm = (): boolean => {
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount)) {
      setError('Please enter a valid amount');
      return false;
    }

    if (numAmount < 500) {
      setError('Minimum withdrawal is ₦500');
      return false;
    }

    if (!bankName.trim()) {
      setError('Bank name is required');
      return false;
    }

    if (!accountNumber.trim()) {
      setError('Account number is required');
      return false;
    }

    if (accountNumber.length !== 10) {
      setError('Account number must be 10 digits');
      return false;
    }

    if (!accountName.trim()) {
      setError('Please verify account first');
      return false;
    }

    return true;
  };

  const handleVerifyAccount = async (): Promise<void> => {
    if (accountNumber.length !== 10) {
      setError('Account number must be 10 digits');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await apiFetch<{ accountName?: string }>(
        `/v1/banks/verify?accountNumber=${accountNumber}&bankCode=${bankName}`
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to verify account');
      }

      setAccountName(result.data?.accountName || 'Verified Account');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to verify account');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmWithdraw = async (): Promise<void> => {
    setShowConfirm(false);
    setIsLoading(true);

    try {
      const result = await apiFetch('/v1/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(amount),
          bankCode: bankName,
          accountNumber,
        }),
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to withdraw funds');
      }

      setSuccess('Withdrawal request submitted successfully!');
      setTimeout(() => {
        router.push('/wallet');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while withdrawing funds');
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
          <h1 className="text-3xl font-bold text-foreground">Withdraw Funds</h1>
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
                min="500"
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
            <label htmlFor="bankName" className="block text-sm font-medium text-foreground mb-1">
              Bank Name
            </label>
            <select
              id="bankName"
              name="bankName"
              value={bankName}
              onChange={(e) => {
                setBankName(e.target.value);
                if (error) setError(null);
              }}
              className="appearance-none block w-full px-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="">Select your bank</option>
              <option value="044">Access Bank</option>
              <option value="023">Citibank</option>
              <option value="050">Ecobank</option>
              <option value="070">Fidelity Bank</option>
              <option value="011">First Bank</option>
              <option value="214">First City Monument Bank</option>
              <option value="058">Guaranty Trust Bank</option>
              <option value="030">Heritage Bank</option>
              <option value="082">Kuda Bank</option>
              <option value="014">MainStreet Bank</option>
              <option value="076">Polaris Bank</option>
              <option value="100">Providus Bank</option>
              <option value="221">Stanbic IBTC</option>
              <option value="068">Standard Chartered</option>
              <option value="032">Sterling Bank</option>
              <option value="102">Titan Trust Bank</option>
              <option value="033">Union Bank</option>
              <option value="039">United Bank for Africa</option>
              <option value="215">Unity Bank</option>
              <option value="035">Wema Bank</option>
              <option value="057">Zenith Bank</option>
            </select>
          </div>

          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-foreground mb-1">
              Account Number
            </label>
            <div className="flex gap-2">
              <input
                id="accountNumber"
                name="accountNumber"
                type="text"
                value={accountNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setAccountNumber(cleaned);
                  if (error) setError(null);
                  if (accountName) setAccountName('');
                }}
                className="appearance-none block flex-1 px-3 py-2 border border-border placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="0123456789"
                maxLength={10}
              />
              <button
                type="button"
                onClick={handleVerifyAccount}
                disabled={accountNumber.length !== 10 || isVerifying}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="accountName" className="block text-sm font-medium text-foreground mb-1">
              Account Name
            </label>
            <input
              id="accountName"
              name="accountName"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-border bg-muted text-foreground rounded-md sm:text-sm"
              placeholder="Account name will appear after verification"
              readOnly
            />
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
              `Withdraw ₦${parseFloat(amount || '0').toLocaleString()}`
            )}
          </button>

          <div className="bg-accent p-4 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">ℹ️ Information</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Minimum withdrawal: ₦500</li>
              <li>• Processing time: 1-3 business days</li>
              <li>• Withdrawal fees may apply</li>
              <li>• Ensure account details are correct</li>
            </ul>
          </div>
        </form>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-foreground mb-2">Confirm Withdrawal</h3>
            <p className="text-muted-foreground mb-4">
              You are about to withdraw <span className="font-semibold text-foreground">₦{parseFloat(amount).toLocaleString()}</span> to:
            </p>
            <div className="bg-accent p-4 rounded-lg mb-6">
              <p className="text-sm text-foreground font-medium">{accountName}</p>
              <p className="text-sm text-muted-foreground">{bankName} • {accountNumber}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 px-4 border border-border text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmWithdraw}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
