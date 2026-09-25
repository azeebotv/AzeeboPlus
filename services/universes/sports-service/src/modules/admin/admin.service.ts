import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getStats() {
    try {
      const [totalEvents, totalPredictions, eventsByStatus, eventsBySport] = await Promise.all([
        this.prisma.sportsEvent.count(),
        this.prisma.predictionEntry.count(),
        this.prisma.sportsEvent.groupBy({ by: ['status'], _count: { status: true } }),
        this.prisma.sportsEvent.groupBy({ by: ['sport'], _count: { sport: true } }),
      ]);

      return {
        totalEvents,
        totalPredictions,
        eventsByStatus: eventsByStatus.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count.status }),
          {}
        ),
        eventsBySport: eventsBySport.reduce(
          (acc, s) => ({ ...acc, [s.sport]: s._count.sport }),
          {}
        ),
      };
    } catch (error) {
      this.logger.error(`Failed to get admin stats: ${error}`);
      throw error;
    }
  }

  async getEvents(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const [events, total] = await Promise.all([
        this.prisma.sportsEvent.findMany({
          skip,
          take: limit,
          orderBy: { startsAt: 'desc' },
          include: { teams: true },
        }),
        this.prisma.sportsEvent.count(),
      ]);

      return { events, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
      this.logger.error(`Failed to get admin events: ${error}`);
      throw error;
    }
  }

  async getPredictions(options?: { limit?: number }) {
    const limit = options?.limit || 20;

    try {
      const predictions = await this.prisma.predictionEntry.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { event: true },
      });

      return predictions;
    } catch (error) {
      this.logger.error(`Failed to get admin predictions: ${error}`);
      throw error;
    }
  }
}
