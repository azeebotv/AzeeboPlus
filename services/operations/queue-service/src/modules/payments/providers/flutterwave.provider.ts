import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios from 'axios';
import { createHmac } from 'crypto';

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
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor() {
    this.apiKey = process.env.FLUTTERWAVE_SECRET_KEY!;
    if (!this.apiKey) {
      throw new Error('FLUTTERWAVE_SECRET_KEY is not configured');
    }
    this.logger.log('FlutterwaveProvider initialized');
  }

  async initializePayment(amount: number, currency: string, userId: string) {
    try {
      const response = await axios.post<FlutterwaveInitializeResponse>(
        `${this.baseUrl}/payments`,
        {
          tx_ref: `tx_${Date.now()}_${userId}`,
          amount,
          currency: currency || 'NGN',
          redirect_url:
            process.env.FLUTTERWAVE_CALLBACK_URL || 'https://api.azeebo.plus/payments/webhook',
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

      return {
        reference: response.data.data.reference,
        authorizationUrl: response.data.data.link,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Flutterwave initialization failed: ${message}`);
    }
  }

  async verifyPayment(reference: string) {
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
    const hash = createHmac('sha256', this.apiKey).update(JSON.stringify(payload)).digest('hex');

    return hash === signature;
  }
}
