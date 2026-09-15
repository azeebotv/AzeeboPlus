import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { mapAndThrow } from '@azeebo/security';

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

interface FlutterwaveRefundResponse {
  status: string;
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
}

interface VerifyResult {
  status: string;
  amount: number;
  currency: string;
  paidAt: Date;
  reference: string;
}

interface RefundResult {
  reference: string;
  amount: number;
  status: string;
}

@Injectable()
export class FlutterwaveProvider {
  private readonly logger = new Logger(FlutterwaveProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('FLUTTERWAVE_SECRET_KEY') || '';
    this.baseUrl = this.configService.get<string>(
      'FLUTTERWAVE_API_URL',
      'https://api.flutterwave.com/v3'
    );
    if (!this.apiKey) {
      this.logger.warn(
        'FLUTTERWAVE_SECRET_KEY is not configured — Flutterwave payments will be unavailable'
      );
    }
  }

  async initializePayment(
    amount: number,
    currency: string,
    userId: string
  ): Promise<InitializeResult> {
    if (!this.apiKey) {
      throw new BadRequestException('Flutterwave payments are not configured');
    }
    try {
      const response = await axios.post<FlutterwaveInitializeResponse>(
        `${this.baseUrl}/payments`,
        {
          tx_ref: `tx_${Date.now()}_${userId}`,
          amount,
          currency: currency || 'NGN',
          redirect_url:
            this.configService.get<string>('FLUTTERWAVE_CALLBACK_URL') ||
            (process.env.NODE_ENV === 'production'
              ? (() => {
                  throw new Error('FLUTTERWAVE_CALLBACK_URL must be configured in production');
                })()
              : 'http://localhost:3003/webhooks/flutterwave'),
          customer: {
            email: `user-${userId}@azeebo.plus`,
            name: `User ${userId}`,
          },
          meta: {
            user_id: userId,
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

      return {
        reference: response.data.data.reference,
        authorizationUrl: response.data.data.link,
      };
    } catch (error: unknown) {
      mapAndThrow(error, 'initializing Flutterwave payment');
    }
  }

  async verifyPayment(reference: string): Promise<VerifyResult> {
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
      mapAndThrow(error, `verifying Flutterwave payment ${reference}`);
    }
  }

  async processRefund(transactionReference: string, reason: string): Promise<RefundResult> {
    if (!this.apiKey) {
      throw new BadRequestException('Flutterwave payments are not configured');
    }
    try {
      const response = await axios.post<FlutterwaveRefundResponse>(
        `${this.baseUrl}/transactions/${transactionReference}/refund`,
        {
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

      if (response.data.status !== 'success') {
        throw new BadRequestException(response.data.message);
      }

      return {
        reference: response.data.data.reference,
        amount: response.data.data.amount,
        status: response.data.data.status,
      };
    } catch (error: unknown) {
      mapAndThrow(error, `processing Flutterwave refund ${transactionReference}`);
    }
  }

  async verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }
    const { createHmac, timingSafeEqual } = await import('crypto');
    const hash = createHmac('sha256', this.apiKey).update(rawBody).digest('hex');

    if (hash.length !== signature.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(hash, 'utf8'), Buffer.from(signature, 'utf8'));
  }
}
