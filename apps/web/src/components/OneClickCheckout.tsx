'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { CreditCard, Wallet, Check, Loader2 } from 'lucide-react';

interface OneClickCheckoutProps {
  itemId: string;
  itemType: 'content' | 'subscription' | 'tip';
  itemName: string;
  price: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  last4?: string;
  brand?: string;
  isDefault: boolean;
}

export function OneClickCheckout({
  itemId,
  itemType,
  itemName,
  price,
  onSuccess,
  onCancel,
}: OneClickCheckoutProps) {
  useAuth();
  const { balance } = useWallet();
  const [selectedMethod, setSelectedMethod] = useState<string>('wallet');
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch saved payment methods
  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await apiFetch<SavedPaymentMethod[]>('/payment/methods');
      return res.success ? res.data || [] : [];
    },
  });

  // Process payment mutation
  const processPayment = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/payments/one-click', {
        method: 'POST',
        body: JSON.stringify({
          itemId,
          itemType,
          paymentMethodId: selectedMethod,
          amount: price,
        }),
      });
      return res;
    },
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    },
  });

  const balanceAmount = typeof balance === 'number' ? balance : 0;
  const hasEnoughBalance = balanceAmount >= price;

  if (showSuccess) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: 'center',
          borderRadius: 16,
          border: '1px solid #10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: 'var(--brand-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Check size={32} color="white" />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Payment Successful!</h3>
        <p style={{ color: 'var(--text-muted)' }}>Thank you for your purchase</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        borderRadius: 16,
        border: '1px solid var(--glass-border)',
        backgroundColor: 'var(--glass-bg)',
      }}
    >
      {/* Item Summary */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{itemName}</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{itemType}</p>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>₦{price.toLocaleString()}</div>
      </div>

      {/* Payment Methods */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Payment Method</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Wallet Option */}
          <button
            onClick={() => setSelectedMethod('wallet')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              borderRadius: 12,
              border: `2px solid ${selectedMethod === 'wallet' ? 'var(--brand-orange)' : 'var(--glass-border)'}`,
              backgroundColor:
                selectedMethod === 'wallet' ? 'rgba(232, 66, 10, 0.1)' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Wallet
              size={20}
              color={selectedMethod === 'wallet' ? 'var(--brand-orange)' : 'var(--text-muted)'}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>Wallet Balance</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                ₦{balanceAmount.toLocaleString()} available
              </div>
            </div>
            {selectedMethod === 'wallet' && (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={12} color="white" />
              </div>
            )}
          </button>

          {/* Saved Card Options */}
          {paymentMethods?.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 16,
                borderRadius: 12,
                border: `2px solid ${selectedMethod === method.id ? 'var(--brand-orange)' : 'var(--glass-border)'}`,
                backgroundColor:
                  selectedMethod === method.id ? 'rgba(232, 66, 10, 0.1)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <CreditCard
                size={20}
                color={selectedMethod === method.id ? 'var(--brand-orange)' : 'var(--text-muted)'}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>
                  {method.brand} •••• {method.last4}
                </div>
                {method.isDefault && (
                  <div style={{ fontSize: 12, color: 'var(--brand-orange)' }}>Default</div>
                )}
              </div>
              {selectedMethod === method.id && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-orange)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} color="white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Insufficient Balance Warning */}
      {selectedMethod === 'wallet' && !hasEnoughBalance && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--brand-red)',
          }}
        >
          Insufficient balance. Please add funds or choose another payment method.
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '14px 24px',
            borderRadius: 12,
            border: '1px solid var(--glass-border)',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontSize: 16,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => processPayment.mutate()}
          disabled={processPayment.isPending || (selectedMethod === 'wallet' && !hasEnoughBalance)}
          style={{
            flex: 2,
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            backgroundColor:
              processPayment.isPending || (selectedMethod === 'wallet' && !hasEnoughBalance)
                ? 'var(--border-default)'
                : 'var(--brand-orange)',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            cursor:
              processPayment.isPending || (selectedMethod === 'wallet' && !hasEnoughBalance)
                ? 'not-allowed'
                : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {processPayment.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay ₦{price.toLocaleString()}</>
          )}
        </button>
      </div>
    </div>
  );
}
