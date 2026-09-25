import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CacheService, cacheKey } from '@azeebo/shared-services';

@Injectable()
export class FixturesService {
  private readonly logger = new Logger(FixturesService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(CacheService) private cache: CacheService
  ) {}

  async getFixtures(
    page = 1,
    limit = 20,
    sport?: string,
    status?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }> {
    try {
      const dateKey = fromDate || toDate || 'all';
      const cacheK = cacheKey(
        'sports',
        `fixtures:${dateKey}:${page}:${limit}:${sport || 'all'}:${status || 'all'}`
      );
      const cached = await this.cache.get<{ success: boolean; data?: unknown }>(cacheK);
      if (cached) return cached;

      const where: Record<string, unknown> = {};
      if (sport) where.sport = sport;
      if (status) where.status = status;
      if (fromDate || toDate) {
        where.startsAt = {};
        if (fromDate) (where.startsAt as Record<string, unknown>).gte = new Date(fromDate);
        if (toDate) (where.startsAt as Record<string, unknown>).lte = new Date(toDate);
      }

      const [items, total] = await Promise.all([
        this.prisma.sportsEvent.findMany({
          where,
          include: {
            teams: true,
            fixtureMetadata: true,
            PredictionMarket: true,
            _count: { select: { predictions: true, fanBoards: true } },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { startsAt: 'asc' },
        }),
        this.prisma.sportsEvent.count({ where }),
      ]);

      const result = {
        success: true,
        data: { items, page, limit, total, totalPages: Math.ceil(total / limit) },
      };

      await this.cache.set(cacheK, result, 30);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get fixtures: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get fixtures' },
      };
    }
  }

  async getFixtureById(
    eventId: string
  ): Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }> {
    try {
      const cacheK = cacheKey('sports', `predictions:${eventId}`);
      const cached = await this.cache.get<{ success: boolean; data?: unknown }>(cacheK);
      if (cached) return cached;

      const event = await this.prisma.sportsEvent.findUnique({
        where: { id: eventId },
        include: {
          teams: true,
          fixtureMetadata: true,
          PredictionMarket: true,
          contests: true,
          Highlight: { orderBy: { createdAt: 'desc' }, take: 10 },
        },
      });

      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const result = { success: true, data: event };
      await this.cache.set(cacheK, result, 30);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get fixture by id: ${error}`);
      throw error;
    }
  }

  async createFixtureMetadata(
    eventId: string,
    metadata: {
      venue?: string;
      referee?: string;
      weather?: string;
      temperature?: number;
      attendance?: number;
      broadcast?: string[];
      stats?: unknown;
    }
  ): Promise<{
    success: boolean;
    data?: { metadataId: string };
    error?: { code: string; message: string };
  }> {
    try {
      const event = await this.prisma.sportsEvent.findUnique({ where: { id: eventId } });
      if (!event) {
        throw new NotFoundException('Event not found');
      }

      const existing = await this.prisma.fixtureMetadata.findUnique({ where: { eventId } });
      if (existing) {
        const updated = await this.prisma.fixtureMetadata.update({
          where: { id: existing.id },
          data: {
            venue: metadata.venue,
            referee: metadata.referee,
            weather: metadata.weather,
            temperature: metadata.temperature,
            attendance: metadata.attendance,
            broadcast: metadata.broadcast,
            stats: metadata.stats ? JSON.parse(JSON.stringify(metadata.stats)) : undefined,
          },
        });
        return { success: true, data: { metadataId: updated.id } };
      }

      const fixture = await this.prisma.fixtureMetadata.create({
        data: {
          eventId,
          venue: metadata.venue,
          referee: metadata.referee,
          weather: metadata.weather,
          temperature: metadata.temperature,
          attendance: metadata.attendance,
          broadcast: metadata.broadcast,
          stats: metadata.stats ? JSON.parse(JSON.stringify(metadata.stats)) : undefined,
        },
      });

      return { success: true, data: { metadataId: fixture.id } };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to create fixture metadata: ${error}`);
      return {
        success: false,
        error: { code: 'CREATE_FAILED', message: 'Failed to create fixture metadata' },
      };
    }
  }

  async updateEventResult(
    eventId: string,
    teams: { teamId: string; score: number }[]
  ): Promise<{
    success: boolean;
    data?: { message: string };
    error?: { code: string; message: string };
  }> {
    try {
      // Batch update team scores in a single transaction (fixes N+1)
      await this.prisma.$transaction(
        teams.map((team) =>
          this.prisma.eventTeam.update({
            where: { id: team.teamId },
            data: { score: team.score },
          })
        )
      );

      await this.prisma.sportsEvent.update({
        where: { id: eventId },
        data: { status: 'completed', endsAt: new Date() },
      });

      await this.cache.invalidate('sports:*');

      return { success: true, data: { message: 'Results updated' } };
    } catch (error) {
      this.logger.error(`Failed to update event result: ${error}`);
      return {
        success: false,
        error: { code: 'UPDATE_FAILED', message: 'Failed to update event result' },
      };
    }
  }

  async getSports(): Promise<{
    success: boolean;
    data?: string[];
    error?: { code: string; message: string };
  }> {
    try {
      const events = await this.prisma.sportsEvent.findMany({
        select: { sport: true },
        distinct: ['sport'],
      });
      return { success: true, data: events.map((e) => e.sport) };
    } catch (error) {
      this.logger.error(`Failed to get sports: ${error}`);
      return {
        success: false,
        error: { code: 'FETCH_FAILED', message: 'Failed to get sports' },
      };
    }
  }
}
