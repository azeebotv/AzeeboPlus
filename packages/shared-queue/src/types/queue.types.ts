import { Job } from 'bullmq';

export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  PAYMENTS: 'payments',
  EMAILS: 'emails',
  ANALYTICS: 'analytics',
  CONTENT_PROCESSING: 'content-processing',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
  STALLED = 'stalled',
}

export interface PaymentJobData {
  userId: string;
  amount: number;
  currency: string;
  provider: string;
  providerReference?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProcessor {
  processPayment(job: Job<PaymentJobData>): Promise<{ success: boolean; reference: string }>;
  refundPayment(job: Job<PaymentJobData>): Promise<{ success: boolean; reference: string }>;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template?: string;
  html?: string;
  data?: Record<string, unknown>;
  from?: string;
}

export interface EmailProcessor {
  sendEmail(job: Job<EmailJobData>): Promise<void>;
}
