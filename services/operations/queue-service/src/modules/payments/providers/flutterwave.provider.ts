import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';

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

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY') || '';
    this.baseUrl = this.configService.get<string>('FLUTTERWAVE_API_URL', 'https://api.flutterwave.com/v3');
    if (!this.apiKey) {
      this.logger.warn(
        'FLUTTERWAVE_SECRET_KEY is not configured — Flutterwave payments will be unavailable'
      );
    } else {
      this.logger.log('FlutterwaveProvider initialized');
    }
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
    // Cleanup expired entries periodically
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
    const cached = this.checkIdempotency(idempotencyKey);
    if (cached) return cached;

    try {
      const response = await axios.post<FlutterwaveInitializeResponse>(
        `${this.baseUrl}/payments`,
        {
          tx_ref: `tx_${Date.now()}_${userId}`,
          amount,
          currency: currency || 'NGN',
          redirect_url:
            process.env.FLUTTERWAVE_CALLBACK_URL || 'http://localhost:3003/webhooks/flutterwave',
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
      this.storeIdempotency(idempotencyKey, result);

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Flutterwave refund failed: ${message}`);
    }
  }

  async processPayout(amount: number, recipient: string, reference: string) {
    this.logger.log(
      `Processing Flutterwave payout of ${amount} to ${recipient}, reference: ${reference}`
    );
    throw new Error(
      'Flutterwave payout is not implemented. Please use wallet-service direct transfer for payouts.'
    );
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
