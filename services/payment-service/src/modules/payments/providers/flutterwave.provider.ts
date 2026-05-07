import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

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
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor() {
    this.apiKey = process.env.FLUTTERWAVE_SECRET_KEY!;
    if (!this.apiKey) {
      throw new Error('FLUTTERWAVE_SECRET_KEY is not configured');
    }
  }

  async initializePayment(
    amount: number,
    currency: string,
    userId: string
  ): Promise<InitializeResult> {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Flutterwave initialization failed: ${errorMessage}`);
    }
  }

  async verifyPayment(reference: string): Promise<VerifyResult> {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Flutterwave verification failed: ${errorMessage}`);
    }
  }

  async processRefund(transactionReference: string, reason: string): Promise<RefundResult> {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Flutterwave refund failed: ${errorMessage}`);
    }
  }

  async verifyWebhookSignature(
    payload: Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    const crypto = await import('crypto');
    const hash = crypto
      .createHmac('sha256', this.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }
}
