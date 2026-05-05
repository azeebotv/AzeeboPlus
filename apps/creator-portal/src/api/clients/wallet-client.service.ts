import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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

  constructor(private readonly configService: ConfigService) {
    this.walletServiceUrl =
      this.configService.get<string>('WALLET_SERVICE_URL') || 'http://localhost:3004';
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
  ): Promise<WalletServiceResponse<T>> {
    const url = `${this.walletServiceUrl}${endpoint}`;
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

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
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
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
        reject(
          new HttpException(
            `Wallet Service error: ${error.message}`,
            HttpStatus.SERVICE_UNAVAILABLE
          )
        );
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async getWallet(userId: string): Promise<WalletServiceResponse<Wallet>> {
    const endpoint = `/api/wallet/user/${userId}`;
    return this.request<Wallet>(endpoint);
  }

  async getWalletTransactions(
    userId: string,
    page = 1,
    limit = 20,
    type?: string
  ): Promise<WalletServiceResponse<{ items: WalletTransaction[]; total: number }>> {
    const endpoint = `/api/wallet/user/${userId}/transactions?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`;
    return this.request<{ items: WalletTransaction[]; total: number }>(endpoint);
  }

  async createPayoutRequest(
    userId: string,
    amount: number,
    method: string,
    metadata?: Record<string, unknown>
  ): Promise<WalletServiceResponse<PayoutRequest>> {
    const endpoint = '/api/wallet/payouts';
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
    const endpoint = `/api/wallet/payouts/user/${userId}?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`;
    return this.request<{ items: PayoutRequest[]; total: number }>(endpoint);
  }

  async getPayoutRequestById(payoutId: string): Promise<WalletServiceResponse<PayoutRequest>> {
    const endpoint = `/api/wallet/payouts/${payoutId}`;
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
    const endpoint = `/api/wallet/user/${userId}/stats`;
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
    const endpoint = `/api/wallet/payouts/${payoutId}/cancel`;
    return this.request<{ success: boolean; message: string }>(endpoint, {
      method: 'POST',
    });
  }
}
