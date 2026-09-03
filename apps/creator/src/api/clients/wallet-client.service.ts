import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';

export interface WalletServiceResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  bonusBalance: number;
  promoBalance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  reference: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  metadata: Record<string, unknown>;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WalletClientService {
  private readonly walletServiceUrl: string;

  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {
    const url = this.configService.get<string>('API_GATEWAY_URL');
    if (!url && process.env.NODE_ENV === 'production') {
      throw new Error('API_GATEWAY_URL environment variable must be set in production');
    }
    this.walletServiceUrl = url || 'http://localhost:3013';
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
  ): Promise<WalletServiceResponse<T>> {
    const url = `${this.walletServiceUrl}${endpoint}`;
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    return new Promise((resolve, reject) => {
      const req = protocol.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal as AbortSignal,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            clearTimeout(timeout);
            try {
              const response = JSON.parse(data);
              resolve(response);
            } catch (error) {
              reject(
                new HttpException('Invalid response from Wallet Service', HttpStatus.BAD_GATEWAY)
              );
            }
          });
        }
      );

      req.on('error', (error) => {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
          reject(new HttpException('Wallet Service request timed out', HttpStatus.GATEWAY_TIMEOUT));
        } else {
          reject(
            new HttpException(
              `Wallet Service error: ${(error as Error).message}`,
              HttpStatus.SERVICE_UNAVAILABLE
            )
          );
        }
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async getWallet(userId: string): Promise<WalletServiceResponse<Wallet>> {
    const endpoint = `/v1/wallet/user/${userId}`;
    return this.request<Wallet>(endpoint);
  }

  async getWalletTransactions(
    userId: string,
    page = 1,
    limit = 20,
    type?: string
  ): Promise<WalletServiceResponse<{ items: WalletTransaction[]; total: number }>> {
    const endpoint = `/v1/wallet/user/${userId}/transactions?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`;
    return this.request<{ items: WalletTransaction[]; total: number }>(endpoint);
  }

  async createPayoutRequest(
    userId: string,
    amount: number,
    method: string,
    metadata?: Record<string, unknown>
  ): Promise<WalletServiceResponse<PayoutRequest>> {
    const endpoint = '/v1/wallet/payouts';
    return this.request<PayoutRequest>(endpoint, {
      method: 'POST',
      body: {
        userId,
        amount,
        method,
        metadata,
      },
    });
  }

  async getPayoutRequests(
    userId: string,
    page = 1,
    limit = 20,
    status?: string
  ): Promise<WalletServiceResponse<{ items: PayoutRequest[]; total: number }>> {
    const endpoint = `/v1/wallet/payouts/user/${userId}?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
    return this.request<{ items: PayoutRequest[]; total: number }>(endpoint);
  }

  async getPayoutRequestById(payoutId: string): Promise<WalletServiceResponse<PayoutRequest>> {
    const endpoint = `/v1/wallet/payouts/${payoutId}`;
    return this.request<PayoutRequest>(endpoint);
  }

  async getWalletStats(userId: string): Promise<
    WalletServiceResponse<{
      totalBalance: number;
      totalEarnings: number;
      totalPayouts: number;
      pendingPayouts: number;
    }>
  > {
    const endpoint = `/v1/wallet/user/${userId}/stats`;
    return this.request<{
      totalBalance: number;
      totalEarnings: number;
      totalPayouts: number;
      pendingPayouts: number;
    }>(endpoint);
  }

  async cancelPayoutRequest(
    payoutId: string
  ): Promise<WalletServiceResponse<{ success: boolean; message: string }>> {
    const endpoint = `/v1/wallet/payouts/${payoutId}/cancel`;
    return this.request<{ success: boolean; message: string }>(endpoint, {
      method: 'POST',
    });
  }

  async debit(
    walletId: string,
    amount: number,
    description: string,
    idempotencyKey: string
  ): Promise<WalletServiceResponse<{ success: boolean }>> {
    const endpoint = '/v1/wallet/debit';
    return this.request<{ success: boolean }>(endpoint, {
      method: 'POST',
      body: { walletId, amount, description, idempotencyKey },
    });
  }
}
