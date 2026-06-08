import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { createHmac } from 'crypto';
import { CircuitBreaker, CircuitBreakerOpenError } from '@azeebo/shared-types';

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface PaystackRefundResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    amount: number;
    status: string;
  };
}

interface InitializeResult {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

interface VerifyResult {
  status: string;
  amount: number;
  currency: string;
  paidAt: Date;
  customerEmail: string;
  reference: string;
}

interface RefundResult {
  reference: string;
  amount: number;
  status: string;
}

interface CircuitBreakerStats {
  state: string;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
}

@Injectable()
export class PaystackProvider {
  private readonly logger = new Logger(PaystackProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.apiKey = process.env.PAYSTACK_SECRET_KEY!;
    if (!this.apiKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 3,
    });
    this.logger.log('PaystackProvider initialized with circuit breaker');
  }

  async initializePayment(
    amount: number,
    currency: string,
    userId: string
  ): Promise<InitializeResult> {
    try {
      const result = await this.circuitBreaker.execute(async () => {
        const response = await axios.post<PaystackInitializeResponse>(
          `${this.baseUrl}/transaction/initialize`,
          {
            email: `user-${userId}@azeebo.plus`,
            amount: amount * 100,
            currency: currency || 'NGN',
            metadata: {
              user_id: userId,
              app: 'azeebo-plus',
            },
            callback_url:
              process.env.PAYSTACK_CALLBACK_URL || 'https://api.azeebo.plus/payments/webhook',
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data.status) {
          throw new Error(response.data.message);
        }

        return {
          reference: response.data.data.reference,
          authorizationUrl: response.data.data.authorization_url,
          accessCode: response.data.data.access_code,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Paystack circuit breaker open: ${error.message}`);
        throw new Error('Payment service temporarily unavailable. Please try again later.');
      }
      this.logger.error(`Paystack initialization failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async verifyPayment(reference: string): Promise<VerifyResult> {
    try {
      const result = await this.circuitBreaker.execute(async () => {
        const response = await axios.get<PaystackVerifyResponse>(
          `${this.baseUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data.status) {
          throw new Error(response.data.message);
        }

        return {
          status: response.data.data.status,
          amount: response.data.data.amount / 100,
          currency: response.data.data.currency,
          paidAt: new Date(response.data.data.paid_at),
          customerEmail: response.data.data.customer.email,
          reference: response.data.data.reference,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Paystack circuit breaker open: ${error.message}`);
        throw new Error('Payment verification temporarily unavailable. Please try again later.');
      }
      this.logger.error(`Paystack verification failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async processRefund(transactionReference: string, reason: string): Promise<RefundResult> {
    try {
      const result = await this.circuitBreaker.execute(async () => {
        const response = await axios.post<PaystackRefundResponse>(
          `${this.baseUrl}/transaction/refund`,
          {
            transaction: transactionReference,
            amount: null,
            reason,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.data.status) {
          throw new Error(response.data.message);
        }

        return {
          reference: response.data.data.reference,
          amount: response.data.data.amount / 100,
          status: response.data.data.status,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Paystack circuit breaker open: ${error.message}`);
        throw new Error('Refund service temporarily unavailable. Please try again later.');
      }
      this.logger.error(`Paystack refund failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async verifyWebhookSignature(
    payload: Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    const hash: string = createHmac('sha512', this.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  getCircuitBreakerStats(): CircuitBreakerStats {
    const stats = this.circuitBreaker.getStats() as unknown as Record<string, unknown>;
    return {
      state: (stats.state as string) || 'closed',
      failureCount: (stats.failureCount as number) || 0,
      successCount: (stats.successCount as number) || 0,
      lastFailureTime: (stats.lastFailureTime as number | null) || null,
    };
  }
}
