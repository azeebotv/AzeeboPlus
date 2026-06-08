import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalStories, totalEvents, totalUsers, storiesByStatus, eventsByStatus] = await Promise.all([
      this.prisma.cultureStory.count(),
      this.prisma.event.count(),
      this.prisma.user.count(),
      this.prisma.cultureStory.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.event.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    return {
      totalStories,
      totalEvents,
      totalUsers,
      storiesByStatus: storiesByStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.status }), {}),
      eventsByStatus: eventsByStatus.reduce((acc, s) => ({ ...acc, [s.status]: s._count.status }), {}),
    };
  }

  async getContent(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [stories, events, storyCount, eventCount] = await Promise.all([
      this.prisma.cultureStory.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.event.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.cultureStory.count(),
      this.prisma.event.count(),
    ]);
    const total = storyCount + eventCount;

    return {
      stories,
      events,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUsers(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count(),
    ]);

    return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
