import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private register: client.Registry;
  private requestCounter: client.Counter<string>;
  private errorCounter: client.Counter<string>;
  private requestDuration: client.Histogram<string>;
  private paymentCounter: client.Counter<string>;
  private refundCounter: client.Counter<string>;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    this.requestCounter = new client.Counter({
      name: 'payment_requests_total',
      help: 'Total number of requests to payment service',
      labelNames: ['endpoint', 'method', 'status_code'],
      registers: [this.register],
    });

    this.errorCounter = new client.Counter({
      name: 'payment_errors_total',
      help: 'Total number of errors in payment service',
      labelNames: ['endpoint', 'error_type'],
      registers: [this.register],
    });

    this.requestDuration = new client.Histogram({
      name: 'payment_request_duration_seconds',
      help: 'Duration of requests to payment service',
      labelNames: ['endpoint', 'method'],
      buckets: [0.001, 0.01, 0.1, 0.5, 1, 5, 10],
      registers: [this.register],
    });

    this.paymentCounter = new client.Counter({
      name: 'payment_transactions_total',
      help: 'Total number of payment transactions',
      labelNames: ['provider', 'status'],
      registers: [this.register],
    });

    this.refundCounter = new client.Counter({
      name: 'payment_refunds_total',
      help: 'Total number of refunds',
      labelNames: ['status'],
      registers: [this.register],
    });
  }

  onModuleInit() {
    this.register.setDefaultLabels({
      service: 'payment-service',
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

  incrementPaymentCounter(provider: string, status: 'success' | 'failed' | 'pending') {
    this.paymentCounter.inc({ provider, status });
  }

  incrementRefundCounter(status: 'success' | 'failed' | 'pending') {
    this.refundCounter.inc({ status });
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
