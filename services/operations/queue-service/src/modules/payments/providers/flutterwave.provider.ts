import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import { CircuitBreaker, CircuitBreakerOpenError } from '@azeebo/shared-types';

interface FlutterwaveInitializeResponse {
  status: string;
  message: string;
  data: {
    link: string;
    reference: string;
  };
}

interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    status: string;
    amount: number;
    currency: string;
    created_at: string;
  };
}

@Injectable()
export class FlutterwaveProvider {
  private readonly logger = new Logger(FlutterwaveProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis
  ) {
    this.apiKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY') || '';
    this.baseUrl = this.configService.get<string>(
      'FLUTTERWAVE_API_URL',
      'https://api.flutterwave.com/v3'
    );
    if (!this.apiKey) {
      this.logger.warn(
        'FLUTTERWAVE_SECRET_KEY is not configured — Flutterwave payments will be unavailable'
      );
    } else {
      this.logger.log('FlutterwaveProvider initialized');
    }
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenRequests: 3,
    });
  }

  // PAY-003: Redis-backed idempotency store
  private readonly IDEMPOTENCY_PREFIX = 'idempotency:flutterwave:';
  private readonly IDEMPOTENCY_TTL_SECONDS = 3600; // 1 hour

  private async checkIdempotency(key: string | undefined): Promise<Record<string, unknown> | null> {
    if (!key) return null;
    try {
      const cached = await this.redis.get(`${this.IDEMPOTENCY_PREFIX}${key}`);
      if (cached) {
        return JSON.parse(cached) as Record<string, unknown>;
      }
    } catch (error) {
      this.logger.warn(`Redis idempotency check failed: ${error}`);
    }
    return null;
  }

  private async storeIdempotency(
    key: string | undefined,
    result: Record<string, unknown>
  ): Promise<void> {
    if (!key) return;
    try {
      await this.redis.set(
        `${this.IDEMPOTENCY_PREFIX}${key}`,
        JSON.stringify(result),
        'EX',
        this.IDEMPOTENCY_TTL_SECONDS
      );
    } catch (error) {
      this.logger.warn(`Redis idempotency store failed: ${error}`);
    }
  }

  async initializePayment(
    amount: number,
    currency: string,
    userId: string,
    idempotencyKey?: string
  ) {
    if (!this.apiKey) {
      throw new BadRequestException('Flutterwave payments are not configured');
    }
    // SEC-007/PAY-002: Validate payment amount
    if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
      throw new BadRequestException('Payment amount must be a positive number');
    }
    if (amount < 100) {
      throw new BadRequestException('Minimum payment amount is 100 (NGN)');
    }
    if (amount > 10_000_000) {
      throw new BadRequestException('Maximum payment amount is 10,000,000 (NGN)');
    }

    // PAY-003: Check idempotency key to prevent duplicate payments
    const cached = await this.checkIdempotency(idempotencyKey);
    if (cached) return cached;

    try {
      const response = await axios.post<FlutterwaveInitializeResponse>(
        `${this.baseUrl}/payments`,
        {
          tx_ref: `tx_${Date.now()}_${userId}`,
          amount,
          currency: currency || 'NGN',
          redirect_url:
            this.configService.get<string>('FLUTTERWAVE_CALLBACK_URL') ||
            'http://localhost:3003/webhooks/flutterwave',
          customer: {
            email: `user-${userId}@azeebo.plus`,
            name: `User ${userId}`,
          },
          meta: {
            userId: userId,
            app: 'azeebo-plus',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new BadRequestException(response.data.message);
      }

      const result = {
        reference: response.data.data.reference,
        authorizationUrl: response.data.data.link,
      };

      // PAY-003: Store result for idempotency
      await this.storeIdempotency(idempotencyKey, result);

      return result;
    } catch (error) {
      const message = error instanceof Error ? (error as Error).message : 'Unknown error';
      throw new BadRequestException(`Flutterwave initialization failed: ${message}`);
    }
  }

  async verifyPayment(reference: string) {
    if (!this.apiKey) {
      throw new BadRequestException('Flutterwave payments are not configured');
    }
    try {
      const response = await axios.get<FlutterwaveVerifyResponse>(
        `${this.baseUrl}/transactions/${reference}/verify`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new BadRequestException(response.data.message);
      }

      return {
        status: response.data.data.status,
        amount: response.data.data.amount,
        currency: response.data.data.currency,
        paidAt: new Date(response.data.data.created_at),
        reference: response.data.data.tx_ref,
      };
    } catch (error) {
      const message = error instanceof Error ? (error as Error).message : 'Unknown error';
      throw new BadRequestException(`Flutterwave verification failed: ${message}`);
    }
  }

  async processRefund(transactionReference: string, reason: string) {
    if (!this.apiKey) {
      throw new BadRequestException('Flutterwave payments are not configured');
    }
    try {
      const response = await axios.post(
        `${this.baseUrl}/transactions/${transactionReference}/refund`,
        {
          amount: null, // Refund full amount
          reason,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new BadRequestException(response.data.message);
      }

      return {
        reference: response.data.data.reference,
        amount: response.data.data.amount,
        status: response.data.data.status,
      };
    } catch (error) {
      const message = error instanceof Error ? (error as Error).message : 'Unknown error';
      throw new BadRequestException(`Flutterwave refund failed: ${message}`);
    }
  }

  async processPayout(amount: number, recipient: string, reference: string) {
    this.logger.log(
      `Processing Flutterwave payout of ${amount} to ${recipient}, reference: ${reference}`
    );

    if (!this.apiKey) {
      throw new Error('Flutterwave API key not configured');
    }

    try {
      const result = await this.circuitBreaker.execute(async () => {
        const response = await axios.post(
          `${this.baseUrl}/transfers`,
          {
            account_bank: '044', // Default to bank transfer
            account_number: recipient,
            amount,
            currency: 'NGN',
            reference,
            narration: `Payout: ${reference}`,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        return {
          success: response.data.status === 'success',
          reference,
          providerResponse: response.data,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        this.logger.warn(`Flutterwave circuit breaker open: ${(error as Error).message}`);
        throw new Error('Payout service temporarily unavailable. Please try again later.');
      }
      this.logger.error(`Flutterwave payout failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async verifyWebhookSignature(
    payload: Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    const hash = createHmac('sha256', this.apiKey).update(JSON.stringify(payload)).digest('hex');

    // Timing-safe comparison to prevent timing attacks
    return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  }
}
