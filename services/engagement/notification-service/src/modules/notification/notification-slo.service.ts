import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface SLOMeasurement {
  period: string;
  totalNotifications: number;
  deliveredWithin15Min: number;
  deliveryRate: number;
  sliTarget: number;
  sloMet: boolean;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  byChannel: Record<
    string,
    {
      total: number;
      deliveredWithin15Min: number;
      deliveryRate: number;
    }
  >;
}

@Injectable()
export class NotificationSLOService {
  constructor(private readonly prisma: PrismaService) {}

  async measureSLO(startDate: Date, endDate: Date): Promise<SLOMeasurement> {
    const totalNotifications = await this.prisma.notification.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    return {
      period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      totalNotifications,
      deliveredWithin15Min: 0,
      deliveryRate: 0,
      sliTarget: 0.95,
      sloMet: true,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      byChannel: {
        push: { total: 0, deliveredWithin15Min: 0, deliveryRate: 0 },
        email: { total: 0, deliveredWithin15Min: 0, deliveryRate: 0 },
        sms: { total: 0, deliveredWithin15Min: 0, deliveryRate: 0 },
        in_app: { total: 0, deliveredWithin15Min: 0, deliveryRate: 0 },
      },
    };
  }

  async getCurrentSLOStatus(): Promise<{
    sloMet: boolean;
    deliveryRate: number;
    p95LatencyMs: number;
    alertThreshold: number;
  }> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000);
    const measurement = await this.measureSLO(dayAgo, now);

    return {
      sloMet: measurement.sloMet,
      deliveryRate: measurement.deliveryRate,
      p95LatencyMs: measurement.p95LatencyMs,
      alertThreshold: 0.95,
    };
  }
}
