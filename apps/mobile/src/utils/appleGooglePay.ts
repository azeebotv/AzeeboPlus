import { Platform } from 'react-native';
import { StripeProvider } from 'expo-payments-stripe';
import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

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
  private stripeInitialized = false;

  static getInstance(): AppleGooglePayService {
    if (!AppleGooglePayService.instance) {
      AppleGooglePayService.instance = new AppleGooglePayService();
    }
    return AppleGooglePayService.instance;
  }

  initialize(config: PaymentConfig): void {
    this.config = config;
    this.stripeInitialized = true;
  }

  isAvailable(): boolean {
    if (Platform.OS === 'ios') {
      return true;
    }
    if (Platform.OS === 'android') {
      return true;
    }
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
        error: error instanceof Error ? error.message : 'Payment failed',
      };
    }
  }

  private async createPaymentIntent(
    amount: number,
    currency: string,
    description: string
  ): Promise<string | null> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/v1/payments/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          paymentMethod: this.getPaymentMethodType(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data.data?.clientSecret || null;
    } catch (error) {
      logger.error('Failed to create payment intent', error);
      return null;
    }
  }

  private async confirmPayment(clientSecret: string): Promise<PaymentResult> {
    try {
      // Note: useStripe() must be called from a React component, not a class method.
      // This service should be refactored to use a React hook wrapper.
      // For now, we return an error directing to use the hook-based approach.
      return {
        success: false,
        error:
          'Payment confirmation requires the Stripe hook. Use confirmPaymentFromComponent() instead.',
      };
    } catch (error) {
      logger.error('Payment confirmation failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      };
    }
  }

  private async getAuthToken(): Promise<string> {
    try {
      // Use consistent key 'accessToken' matching AuthContext storage
      const token = await import('@react-native-async-storage/async-storage').then((storage) =>
        storage.default.getItem('accessToken')
      );
      return token || '';
    } catch (error) {
      logger.error('Failed to get auth token', error);
      return '';
    }
  }
}

export const appleGooglePayService = AppleGooglePayService.getInstance();
