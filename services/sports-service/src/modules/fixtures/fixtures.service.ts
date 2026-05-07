import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FixturesService {
  constructor(private prisma: PrismaService) {}

  async getFixtures(
    page = 1,
    limit = 20,
    sport?: string,
    status?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{ success: boolean; data?: unknown }> {
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
          FixtureMetadata: true,
          PredictionMarket: true,
          _count: { select: { predictions: true, fanBoards: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startsAt: 'asc' },
      }),
      this.prisma.sportsEvent.count({ where }),
    ]);

    return {
      success: true,
      data: { items, page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFixtureById(eventId: string): Promise<{ success: boolean; data?: unknown }> {
    const event = await this.prisma.sportsEvent.findUnique({
      where: { id: eventId },
      include: {
        teams: true,
        FixtureMetadata: true,
        PredictionMarket: true,
        contests: { include: { prizes: true, entries: true } },
        Highlight: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return { success: true, data: event };
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
  ): Promise<{ success: boolean; data?: { metadataId: string } }> {
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
          stats: metadata.stats as Record<string, string | number | boolean | null> | null,
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
        stats: metadata.stats as Record<string, string | number | boolean | null> | null,
      },
    });

    return { success: true, data: { metadataId: fixture.id } };
  }

  async updateEventResult(
    eventId: string,
    teams: { teamId: string; score: number }[]
  ): Promise<{ success: boolean; data?: { message: string } }> {
    for (const team of teams) {
      await this.prisma.eventTeam.update({
        where: { id: team.teamId },
        data: { score: team.score },
      });
    }

    await this.prisma.sportsEvent.update({
      where: { id: eventId },
      data: { status: 'completed', endsAt: new Date() },
    });

    return { success: true, data: { message: 'Results updated' } };
  }

  async getSports(): Promise<{ success: boolean; data?: string[] }> {
    const events = await this.prisma.sportsEvent.findMany({
      select: { sport: true },
      distinct: ['sport'],
    });
    return { success: true, data: events.map((e) => e.sport) };
  }
}
