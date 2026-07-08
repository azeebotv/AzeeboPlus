'use client';

import {
  api,
  PaymentInitResponse,
  PaymentVerifyResponse,
  ApiResponse,
  Transaction,
} from '../lib/api';

export type PaymentProvider = 'paystack' | 'flutterwave';

interface PaystackPaymentData {
  reference: string;
  authorizationUrl: string;
  accessCode?: string;
  amount: number;
  currency: string;
  email: string;
  metadata?: Record<string, string>;
}

interface FlutterwavePaymentData {
  reference: string;
  authorizationUrl: string;
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  metadata?: Record<string, string>;
}

export interface PaymentCallbacks {
  onSuccess?: (response: PaymentVerifyResponse) => void;
  onFailure?: (error: string) => void;
  onClose?: () => void;
}

class PaymentService {
  private provider: PaymentProvider = 'paystack';
  private activePayments: Map<string, PaymentCallbacks> = new Map();

  setProvider(provider: PaymentProvider): void {
    this.provider = provider;
  }

  setCallbacks(callbacks: PaymentCallbacks): void {
    if (this.activePayments.size > 0) {
      throw new Error('Cannot change callbacks while a payment is in progress');
    }
    // Store in activePayments for the next payment
    this.activePayments.set('__default__', callbacks);
  }

  private getCallbacks(reference: string): PaymentCallbacks {
    return this.activePayments.get(reference) || this.activePayments.get('__default__') || {};
  }

  private storeCallbacks(reference: string, callbacks: PaymentCallbacks): void {
    this.activePayments.set(reference, callbacks);
  }

  private removeCallbacks(reference: string): void {
    this.activePayments.delete(reference);
  }

  async initializePayment(
    amount: number,
    email: string,
    metadata?: Record<string, string>,
    currency: string = 'NGN'
  ): Promise<PaymentInitResponse | null> {
    try {
      const response = await api.payment.initialize({
        amount,
        currency,
        email,
        metadata,
      });

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      const ref = metadata?.reference || '__pending__';
      this.getCallbacks(ref).onFailure?.('Failed to initialize payment');
      return null;
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResponse | null> {
    const callbacks = this.getCallbacks(reference);
    try {
      const response = await api.payment.verify(reference);

      if (response.success && response.data) {
        if (response.data.status === 'success') {
          callbacks.onSuccess?.(response.data);
        } else if (response.data.status === 'failed') {
          callbacks.onFailure?.('Payment failed');
        }
        return response.data;
      }
      return null;
    } catch (error) {
      callbacks.onFailure?.('Failed to verify payment');
      return null;
    }
  }

  async initiatePaystackPayment(
    paymentData: PaystackPaymentData,
    callbacks?: PaymentCallbacks
  ): Promise<() => void> {
    const reference = paymentData.reference;
    if (callbacks) {
      this.storeCallbacks(reference, callbacks);
    }

    const popup = window.open(
      paymentData.authorizationUrl,
      'paystack_popup',
      'width=600,height=700,scrollbars=no,resizable=no,toolbar=no,menubar=no'
    );

    if (!popup) {
      this.getCallbacks(reference).onFailure?.('Popup blocked. Please allow popups for this site.');
      return () => {};
    }

    let popupClosed = false;

    const poll = setInterval(async () => {
      try {
        if (popup.closed && !popupClosed) {
          popupClosed = true;
          clearInterval(poll);
          this.getCallbacks(reference).onClose?.();
          this.removeCallbacks(reference);
          return;
        }

        if (popupClosed) return;

        const response = await this.verifyPayment(paymentData.reference);
        if (response && response.status === 'success') {
          popupClosed = true;
          clearInterval(poll);
          popup.close();
          this.removeCallbacks(reference);
        }
      } catch (error) {
        // Polling error is intentionally minimal
      }
    }, 3000);

    const timeoutId = setTimeout(
      () => {
        clearInterval(poll);
        if (!popup.closed) {
          popup.close();
        }
      },
      10 * 60 * 1000
    );

    return () => {
      clearInterval(poll);
      clearTimeout(timeoutId);
      if (!popup.closed) {
        popup.close();
      }
    };
  }

  async initiateFlutterwavePayment(
    paymentData: FlutterwavePaymentData,
    callbacks?: PaymentCallbacks
  ): Promise<() => void> {
    const reference = paymentData.reference;
    if (callbacks) {
      this.storeCallbacks(reference, callbacks);
    }

    const popup = window.open(
      paymentData.authorizationUrl,
      'flutterwave_popup',
      'width=600,height=700,scrollbars=no,resizable=no,toolbar=no,menubar=no'
    );

    if (!popup) {
      this.getCallbacks(reference).onFailure?.('Popup blocked. Please allow popups for this site.');
      return () => {};
    }

    let popupClosed = false;

    const poll = setInterval(async () => {
      try {
        if (popup.closed && !popupClosed) {
          popupClosed = true;
          clearInterval(poll);
          this.getCallbacks(reference).onClose?.();
          this.removeCallbacks(reference);
          return;
        }

        if (popupClosed) return;

        const response = await this.verifyPayment(paymentData.reference);
        if (response && response.status === 'success') {
          popupClosed = true;
          clearInterval(poll);
          popup.close();
          this.removeCallbacks(reference);
        }
      } catch (error) {
        // Polling error is intentionally minimal
      }
    }, 3000);

    const timeoutId = setTimeout(
      () => {
        clearInterval(poll);
        if (!popup.closed) {
          popup.close();
        }
      },
      10 * 60 * 1000
    );

    return () => {
      clearInterval(poll);
      clearTimeout(timeoutId);
      if (!popup.closed) {
        popup.close();
      }
    };
  }

  async processPayment(
    amount: number,
    email: string,
    metadata?: Record<string, string>,
    currency: string = 'NGN'
  ): Promise<(() => void) | false> {
    const paymentData = await this.initializePayment(amount, email, metadata, currency);

    if (!paymentData) {
      const callbacks = this.activePayments.get('__default__') || {};
      callbacks.onFailure?.('Failed to initialize payment');
      return false;
    }

    const reference = paymentData.reference;

    if (this.provider === 'paystack') {
      return this.initiatePaystackPayment({
        reference,
        authorizationUrl: paymentData.authorizationUrl || '',
        accessCode: paymentData.accessCode,
        amount,
        currency,
        email,
        metadata,
      });
    } else {
      return this.initiateFlutterwavePayment({
        reference,
        authorizationUrl: paymentData.authorizationUrl || '',
        txRef: paymentData.reference,
        amount,
        currency,
        email,
        metadata,
      });
    }
  }

  async getPaymentProviders(): Promise<{ provider: string; name: string }[]> {
    try {
      const response = await api.payment.getProviders();
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async getPaymentHistory(
    page = 1,
    limit = 20
  ): Promise<ApiResponse<{ items: Transaction[]; total: number; page: number; limit: number }>> {
    try {
      return await api.payment.getTransactions(page, limit);
    } catch (error) {
      return { success: false, message: 'Failed to fetch payment history' };
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;
