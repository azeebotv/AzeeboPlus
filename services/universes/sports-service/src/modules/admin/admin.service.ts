import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalEvents, totalPredictions, totalUsers, eventsByStatus, eventsBySport] = await Promise.all([
      this.prisma.sportsEvent.count(),
      this.prisma.predictionEntry.count(),
      this.prisma.user.count(),
      this.prisma.sportsEvent.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.sportsEvent.groupBy({ by: ['sport'], _count: { sport: true } }),
    ]);

    return {
      totalEvents,
      totalPredictions,
      totalUsers,
      eventsByStatus: eventsByStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.status }), {}),
      eventsBySport: eventsBySport.reduce((acc, s) => ({ ...acc, [s.sport]: s._count.sport }), {}),
    };
  }

  async getEvents(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

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
  }

  async getPredictions(options?: { limit?: number }) {
    const limit = options?.limit || 20;

    const predictions = await this.prisma.predictionEntry.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { event: true, user: true },
    });

    return predictions;
  }
}
