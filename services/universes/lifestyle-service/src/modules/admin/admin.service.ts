import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getStats() {
    try {
      const [totalStories, totalEvents, totalUsers, storiesByStatus, eventsByStatus] =
        await Promise.all([
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
        storiesByStatus: storiesByStatus.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count.status }),
          {}
        ),
        eventsByStatus: eventsByStatus.reduce(
          (acc, s) => ({ ...acc, [s.status]: s._count.status }),
          {}
        ),
      };
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error}`);
      throw error;
    }
  }

  async getContent(options?: { page?: number; limit?: number }) {
    try {
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
    } catch (error) {
      this.logger.error(`Failed to get content: ${error}`);
      throw error;
    }
  }

  async getUsers(options?: { page?: number; limit?: number }) {
    try {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
        this.prisma.user.count(),
      ]);

      return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
      this.logger.error(`Failed to get users: ${error}`);
      throw error;
    }
  }

  // Write operations
  async updateStory(id: string, data: { title?: string; status?: string; content?: string }) {
    const existing = await this.prisma.cultureStory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Story not found');
    return this.prisma.cultureStory.update({ where: { id }, data: data as never });
  }

  async deleteStory(id: string) {
    const existing = await this.prisma.cultureStory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Story not found');
    return this.prisma.cultureStory.delete({ where: { id } });
  }

  async updateEvent(id: string, data: { title?: string; status?: string; description?: string }) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Event not found');
    return this.prisma.event.update({ where: { id }, data: data as never });
  }

  async deleteEvent(id: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Event not found');
    return this.prisma.event.delete({ where: { id } });
  }
}
