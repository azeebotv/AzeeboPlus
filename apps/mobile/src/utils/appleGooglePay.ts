import { Platform } from 'react-native';
import { logger } from '@azeebo/react-data/utils/logger';
import { apiClient } from '@azeebo/react-data/api/client';

type ApiResponse<T> = { success: boolean; data?: T; message?: string };

export type PaymentMethodType = 'apple_pay' | 'google_pay';

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export interface PaymentConfig {
  publishableKey: string;
  merchantIdentifier: string;
  countryCode: string;
  currencyCode: string;
}

export class AppleGooglePayService {
  private static instance: AppleGooglePayService;
  private config: PaymentConfig | null = null;

  static getInstance(): AppleGooglePayService {
    if (!AppleGooglePayService.instance) {
      AppleGooglePayService.instance = new AppleGooglePayService();
    }
    return AppleGooglePayService.instance;
  }

  initialize(config: PaymentConfig): void {
    this.config = config;
  }

  isAvailable(): boolean {
    // The Stripe native confirmation flow is NOT wired up yet (see
    // `confirmPayment`), so advertising wallet payments would dead-end at
    // checkout. Return false until a real payment sheet is integrated.
    return false;
  }

  getPaymentMethodType(): PaymentMethodType {
    if (Platform.OS === 'ios') {
      return 'apple_pay';
    }
    return 'google_pay';
  }

  getPaymentMethodLabel(): string {
    const type = this.getPaymentMethodType();
    if (type === 'apple_pay') {
      return 'Apple Pay';
    }
    return 'Google Pay';
  }

  async processPayment(
    amount: number,
    currency: string = 'NGN',
    description: string = 'Wallet funding'
  ): Promise<PaymentResult> {
    try {
      if (!this.config) {
        return {
          success: false,
          error: 'Payment service not initialized',
        };
      }

      if (!this.isAvailable()) {
        return {
          success: false,
          error: `${this.getPaymentMethodLabel()} is not available on this device`,
        };
      }

      const amountInCents = Math.round(amount * 100);

      const paymentIntent = await this.createPaymentIntent(amountInCents, currency, description);

      if (!paymentIntent) {
        return {
          success: false,
          error: 'Failed to create payment intent',
        };
      }

      const result = await this.confirmPayment(paymentIntent);

      return result;
    } catch (error) {
      logger.error('Payment processing failed', error);
      return {
        success: false,
        error: error instanceof Error ? (error as Error).message : 'Payment failed',
      };
    }
  }

  private async createPaymentIntent(
    amount: number,
    currency: string,
    description: string
  ): Promise<string | null> {
    try {
      // Route through the shared API client so the base URL, /api/v1 prefix
      // and auth headers stay consistent with the rest of the app.
      const response = await apiClient.post<ApiResponse<{ clientSecret?: string }>>(
        '/v1/payments/intent',
        {
          amount,
          currency,
          description,
          paymentMethod: this.getPaymentMethodType(),
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create payment intent');
      }

      return response.data.clientSecret || null;
    } catch (error) {
      logger.error('Failed to create payment intent', error);
      return null;
    }
  }

  private async confirmPayment(_clientSecret: string): Promise<PaymentResult> {
    try {
      // TODO: useStripe() must be called from a React component, not a class
      // method. Integrating requires the @stripe/stripe-react-native package
      // plus a hook-based wrapper (see useAppleGooglePay). Until then the
      // wallet option is disabled via isAvailable() === false.
      return {
        success: false,
        error: 'Wallet payments are not yet available. Please use a card or bank transfer.',
      };
    } catch (error) {
      logger.error('Payment confirmation failed', error);
      return {
        success: false,
        error: error instanceof Error ? (error as Error).message : 'Payment confirmation failed',
      };
    }
  }
}

export const appleGooglePayService = AppleGooglePayService.getInstance();
