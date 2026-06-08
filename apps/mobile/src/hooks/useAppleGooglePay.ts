import { useState, useCallback } from 'react';
import { appleGooglePayService, PaymentResult } from '../utils/appleGooglePay';

interface UseAppleGooglePayState {
  isAvailable: boolean;
  paymentMethodType: 'apple_pay' | 'google_pay';
  paymentMethodLabel: string;
  isLoading: boolean;
  error: string | null;
}

export function useAppleGooglePay() {
  const [state, setState] = useState<UseAppleGooglePayState>({
    isAvailable: appleGooglePayService.isAvailable(),
    paymentMethodType: appleGooglePayService.getPaymentMethodType(),
    paymentMethodLabel: appleGooglePayService.getPaymentMethodLabel(),
    isLoading: false,
    error: null,
  });

  const processPayment = useCallback(
    async (
      amount: number,
      currency: string = 'NGN',
      description: string = 'Wallet funding'
    ): Promise<PaymentResult> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await appleGooglePayService.processPayment(
        amount,
        currency,
        description
      );

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.success ? null : result.error || null,
      }));

      return result;
    },
    []
  );

  return {
    ...state,
    processPayment,
  };
}
