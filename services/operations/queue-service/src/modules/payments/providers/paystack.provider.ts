import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
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

@Injectable()
export class PaystackProvider {
  private readonly logger = new Logger(PaystackProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.baseUrl = this.configService.get<string>('PAYSTACK_API_URL', 'https://api.paystack.co');
    if (!this.apiKey) {
      this.logger.warn(
        'PAYSTACK_SECRET_KEY is not configured — Paystack payments will be unavailable'
      );
    } else {
      this.logger.log('PaystackProvider initialized with circuit breaker');
    }
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 3,
    });
  }

  // PAY-003: In-memory idempotency store (production should use Redis/DB)
  private readonly idempotencyStore = new Map<
    string,
    { result: Record<string, unknown>; timestamp: number }
  >();
  private readonly IDEMPOTENCY_TTL = 3600_000; // 1 hour

  private checkIdempotency(key: string | undefined): Record<string, unknown> | null {
    if (!key) return null;
    const entry = this.idempotencyStore.get(key);
    if (entry && Date.now() - entry.timestamp < this.IDEMPOTENCY_TTL) {
      return entry.result;
    }
    if (entry) this.idempotencyStore.delete(key);
    return null;
  }

  private storeIdempotency(key: string | undefined, result: Record<string, unknown>): void {
    if (!key) return;
    if (this.idempotencyStore.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.idempotencyStore) {
        if (now - v.timestamp >= this.IDEMPOTENCY_TTL) this.idempotencyStore.delete(k);
      }
    }
    this.idempotencyStore.set(key, { result, timestamp: Date.now() });
  }

  async initializePayment(
    amount: number,
    currency: string,
    userId: string,
    idempotencyKey?: string
  ) {
    if (!this.apiKey) {
      throw new BadRequestException('Paystack payments are not configured');
    }
    // SEC-007/PAY-002: Validate payment amount
    if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
      throw new BadRequestException('Payment amount must be a positive number');
    }
    if (amount < 100) {
      throw new BadRequestException('Minimum payment amount is 100');
    }
    if (amount > 10_000_000) {
      throw new BadRequestException('Maximum payment amount is 10,000,000');
    }

    // PAY-003: Check idempotency key
    const cached = this.checkIdempotency(idempotencyKey);
    if (cached) return cached;

    try {
      const result = await this.circuitBreaker.execute(async () => {
        const response = await axios.post<PaystackInitializeResponse>(
          `${this.baseUrl}/transaction/initialize`,
          {
            email: `user-${userId}@azeebo.plus`,
            amount: amount * 100,
            currency: currency || 'NGN',
            metadata: {
              userId: userId,
              app: 'azeebo-plus',
            },
            callback_url:
              process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3003/webhooks/paystack',
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

      // PAY-003: Store result for idempotency
      this.storeIdempotency(idempotencyKey, result);

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

  async verifyPayment(reference: string) {
    if (!this.apiKey) {
      throw new BadRequestException('Paystack payments are not configured');
    }
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

  async processRefund(transactionReference: string, reason: string) {
    if (!this.apiKey) {
      throw new BadRequestException('Paystack payments are not configured');
    }
    try {
      const result = await this.circuitBreaker.execute(async () => {
        const response = await axios.post(
          `${this.baseUrl}/transaction/refund`,
          {
            transaction: transactionReference,
            amount: null,
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

  async processPayout(amount: number, recipient: string, reference: string) {
    this.logger.log(
      `Processing Paystack payout of ${amount} to ${recipient}, reference: ${reference}`
    );
    throw new Error(
      'Paystack payout is not implemented. Please use wallet-service direct transfer for payouts.'
    );
  }

  async verifyWebhookSignature(
    payload: Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    const hash: string = createHmac('sha512', this.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    if (hash.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  }

  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }
}
