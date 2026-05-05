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
  private callbacks: PaymentCallbacks = {};

  setProvider(provider: PaymentProvider): void {
    this.provider = provider;
  }

  setCallbacks(callbacks: PaymentCallbacks): void {
    this.callbacks = callbacks;
  }

  async initializePayment(
    amount: number,
    email: string,
    metadata?: Record<string, string>
  ): Promise<PaymentInitResponse | null> {
    try {
      const response = await api.payment.initialize({
        amount,
        currency: 'USD',
        email,
        metadata,
      });

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      this.callbacks.onFailure?.('Failed to initialize payment');
      return null;
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResponse | null> {
    try {
      const response = await api.payment.verify(reference);

      if (response.success && response.data) {
        if (response.data.status === 'success') {
          this.callbacks.onSuccess?.(response.data);
        } else if (response.data.status === 'failed') {
          this.callbacks.onFailure?.('Payment failed');
        }
        return response.data;
      }
      return null;
    } catch (error) {
      this.callbacks.onFailure?.('Failed to verify payment');
      return null;
    }
  }

  async initiatePaystackPayment(paymentData: PaystackPaymentData): Promise<void> {
    const popup = window.open(
      paymentData.authorizationUrl,
      'paystack_popup',
      'width=600,height=700,scrollbars=no,resizable=no,toolbar=no,menubar=no'
    );

    if (!popup) {
      this.callbacks.onFailure?.('Popup blocked. Please allow popups for this site.');
      return;
    }

    const poll = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(poll);
          this.callbacks.onClose?.();
          return;
        }

        const response = await this.verifyPayment(paymentData.reference);
        if (response && response.status === 'success') {
          clearInterval(poll);
          popup.close();
        }
      } catch (error) {
        // Polling error is intentionally minimal
      }
    }, 3000);

    setTimeout(
      () => {
        clearInterval(poll);
        if (!popup.closed) {
          popup.close();
        }
      },
      10 * 60 * 1000
    );
  }

  async initiateFlutterwavePayment(paymentData: FlutterwavePaymentData): Promise<void> {
    const popup = window.open(
      paymentData.authorizationUrl,
      'flutterwave_popup',
      'width=600,height=700,scrollbars=no,resizable=no,toolbar=no,menubar=no'
    );

    if (!popup) {
      this.callbacks.onFailure?.('Popup blocked. Please allow popups for this site.');
      return;
    }

    const poll = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(poll);
          this.callbacks.onClose?.();
          return;
        }

        const response = await this.verifyPayment(paymentData.reference);
        if (response && response.status === 'success') {
          clearInterval(poll);
          popup.close();
        }
      } catch (error) {
        // Polling error is intentionally minimal
      }
    }, 3000);

    setTimeout(
      () => {
        clearInterval(poll);
        if (!popup.closed) {
          popup.close();
        }
      },
      10 * 60 * 1000
    );
  }

  async processPayment(
    amount: number,
    email: string,
    metadata?: Record<string, string>
  ): Promise<boolean> {
    const paymentData = await this.initializePayment(amount, email, metadata);

    if (!paymentData) {
      this.callbacks.onFailure?.('Failed to initialize payment');
      return false;
    }

    if (this.provider === 'paystack') {
      await this.initiatePaystackPayment({
        reference: paymentData.reference,
        authorizationUrl: paymentData.authorizationUrl || '',
        accessCode: paymentData.accessCode,
        amount,
        currency: 'USD',
        email,
        metadata,
      });
    } else {
      await this.initiateFlutterwavePayment({
        reference: paymentData.reference,
        authorizationUrl: paymentData.authorizationUrl || '',
        txRef: paymentData.reference,
        amount,
        currency: 'USD',
        email,
        metadata,
      });
    }

    return true;
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
