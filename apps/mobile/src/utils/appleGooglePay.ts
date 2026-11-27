import { Platform } from 'react-native';

export type PaymentMethodType = 'apple_pay' | 'google_pay';

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export interface PaymentConfig {
  publishableKey?: string;
  merchantIdentifier?: string;
  countryCode?: string;
  currencyCode?: string;
}

/**
 * Apple & Google Pay Availability and Status Service.
 *
 * NOTE: Native wallet payments (Apple Pay / Google Pay) are currently disabled
 * pending native wallet SDK integration and merchant verification with app stores.
 * Users must use supported direct payment methods (Debit/Credit Card, Bank Transfer,
 * USSD) until mobile store billing / native pass is certified.
 */
export class AppleGooglePayService {
  private static instance: AppleGooglePayService;

  static getInstance(): AppleGooglePayService {
    if (!AppleGooglePayService.instance) {
      AppleGooglePayService.instance = new AppleGooglePayService();
    }
    return AppleGooglePayService.instance;
  }

  isAvailable(): boolean {
    return false;
  }

  getUnavailableReason(): string {
    const label = this.getPaymentMethodLabel();
    return `${label} is currently unavailable. Please use direct Card payment or Bank Transfer.`;
  }

  getPaymentMethodType(): PaymentMethodType {
    return Platform.OS === 'ios' ? 'apple_pay' : 'google_pay';
  }

  getPaymentMethodLabel(): string {
    return Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay';
  }

  async processPayment(
    _amount: number,
    _currency: string = 'NGN',
    _description: string = 'Wallet funding'
  ): Promise<PaymentResult> {
    return {
      success: false,
      error: this.getUnavailableReason(),
    };
  }
}

export const appleGooglePayService = AppleGooglePayService.getInstance();
