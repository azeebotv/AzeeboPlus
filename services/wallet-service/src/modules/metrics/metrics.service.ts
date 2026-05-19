import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private register: client.Registry;
  private requestCounter: client.Counter<string>;
  private errorCounter: client.Counter<string>;
  private requestDuration: client.Histogram<string>;
  private transactionCounter: client.Counter<string>;
  private balanceGauge: client.Gauge<string>;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    this.requestCounter = new client.Counter({
      name: 'wallet_requests_total',
      help: 'Total number of requests to wallet service',
      labelNames: ['endpoint', 'method', 'status_code'],
      registers: [this.register],
    });

    this.errorCounter = new client.Counter({
      name: 'wallet_errors_total',
      help: 'Total number of errors in wallet service',
      labelNames: ['endpoint', 'error_type'],
      registers: [this.register],
    });

    this.requestDuration = new client.Histogram({
      name: 'wallet_request_duration_seconds',
      help: 'Duration of requests to wallet service',
      labelNames: ['endpoint', 'method'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 5],
      registers: [this.register],
    });

    this.transactionCounter = new client.Counter({
      name: 'wallet_transactions_total',
      help: 'Total number of wallet transactions',
      labelNames: ['type', 'status'],
      registers: [this.register],
    });

    this.balanceGauge = new client.Gauge({
      name: 'wallet_balance_total',
      help: 'Total wallet balance across all users',
      registers: [this.register],
    });
  }

  onModuleInit() {
    this.register.setDefaultLabels({
      service: 'wallet-service',
      environment: process.env.NODE_ENV || 'development',
    });
  }

  onModuleDestroy() {
    this.register.clear();
  }

  incrementRequestCounter(endpoint: string, method: string, statusCode: number) {
    this.requestCounter.inc({ endpoint, method, status_code: statusCode.toString() });
  }

  incrementErrorCounter(endpoint: string, errorType: string) {
    this.errorCounter.inc({ endpoint, error_type: errorType });
  }

  startRequestTimer(endpoint: string, method: string): () => void {
    const start = Date.now();
    return () => {
      const duration = (Date.now() - start) / 1000;
      this.requestDuration.observe({ endpoint, method }, duration);
    };
  }

  incrementTransactionCounter(type: 'fund' | 'withdraw' | 'transfer' | 'debit' | 'credit', status: 'success' | 'failed') {
    this.transactionCounter.inc({ type, status });
  }

  setBalance(totalBalance: number) {
    this.balanceGauge.set(totalBalance);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
