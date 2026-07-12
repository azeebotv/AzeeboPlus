import {Inject,  Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  type: string;
  importance: string;
  universeId: string;
  universeName: string;
  characterId: string;
  characterName: string;
  locationId: string;
  locationName: string;
  createdAt: string;
}

interface TimelineResponse {
  success: boolean;
  data: TimelineEvent[];
}

interface SingleEventResponse {
  success: boolean;
  data: TimelineEvent;
}

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);

  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async getTimeline(
    universeSlug?: string,
    characterSlug?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TimelineResponse> {
    try {
      const where: Record<string, unknown> = {};

      if (universeSlug) {
        const universe = await this.prisma.universeMap.findUnique({
          where: { slug: universeSlug },
        });
        if (universe) {
          where.universeId = universe.id;
        }
      }

      if (characterSlug) {
        const character = await this.prisma.character.findUnique({
          where: { slug: characterSlug },
        });
        if (character) {
          where.characterId = character.id;
        }
      }

      if (startDate) {
        where.date = { gte: new Date(startDate) };
      }

      if (endDate) {
        where.date = { ...(where.date as object), lte: new Date(endDate) };
      }

      const events = await this.prisma.timelineEvent.findMany({
        where,
        include: { universe: true, character: true, location: true },
        orderBy: { date: 'asc' },
      });

      const formattedEvents: TimelineEvent[] = events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date.toISOString(),
        endDate: event.endDate?.toISOString() || '',
        type: event.type,
        importance: event.importance,
        universeId: event.universeId,
        universeName: event.universe.name,
        characterId: event.characterId || '',
        characterName: event.character?.name || '',
        locationId: event.locationId || '',
        locationName: event.location?.name || '',
        createdAt: event.createdAt.toISOString(),
      }));

      return {
        success: true,
        data: formattedEvents,
      };
    } catch (error) {
      this.logger.error(`Failed to get timeline: ${error}`);
      return {
        success: true,
        data: [],
      };
    }
  }

  async getEventById(id: string): Promise<SingleEventResponse> {
    try {
      const event = await this.prisma.timelineEvent.findUnique({
        where: { id },
        include: { universe: true, character: true, location: true },
      });

      if (!event) {
        throw new NotFoundException(`Event not found: ${id}`);
      }

      const formattedEvent: TimelineEvent = {
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date.toISOString(),
        endDate: event.endDate?.toISOString() || '',
        type: event.type,
        importance: event.importance,
        universeId: event.universeId,
        universeName: event.universe.name,
        characterId: event.characterId || '',
        characterName: event.character?.name || '',
        locationId: event.locationId || '',
        locationName: event.location?.name || '',
        createdAt: event.createdAt.toISOString(),
      };

      return {
        success: true,
        data: formattedEvent,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get event by id: ${error}`);
      throw error;
    }
  }

  async getUpcomingEvents(limit = 10): Promise<TimelineResponse> {
    try {
      const now = new Date();

      const events = await this.prisma.timelineEvent.findMany({
        where: { date: { gt: now } },
        include: { universe: true, character: true, location: true },
        orderBy: { date: 'asc' },
        take: limit,
      });

      const formattedEvents: TimelineEvent[] = events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date.toISOString(),
        endDate: event.endDate?.toISOString() || '',
        type: event.type,
        importance: event.importance,
        universeId: event.universeId,
        universeName: event.universe.name,
        characterId: event.characterId || '',
        characterName: event.character?.name || '',
        locationId: event.locationId || '',
        locationName: event.location?.name || '',
        createdAt: event.createdAt.toISOString(),
      }));

      return {
        success: true,
        data: formattedEvents,
      };
    } catch (error) {
      this.logger.error(`Failed to get upcoming events: ${error}`);
      return {
        success: true,
        data: [],
      };
    }
  }

  async createEvent(data: {
    title: string;
    description?: string;
    date: string;
    endDate?: string;
    type: string;
    importance?: string;
    universeId: string;
    characterId?: string;
    locationId?: string;
  }): Promise<SingleEventResponse> {
    try {
      const event = await this.prisma.timelineEvent.create({
        data: {
          title: data.title,
          description: data.description,
          date: new Date(data.date),
          endDate: data.endDate ? new Date(data.endDate) : null,
          type: data.type,
          importance: data.importance || 'normal',
          universeId: data.universeId,
          characterId: data.characterId || null,
          locationId: data.locationId || null,
        },
        include: { universe: true, character: true, location: true },
      });

      const formattedEvent: TimelineEvent = {
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date.toISOString(),
        endDate: event.endDate?.toISOString() || '',
        type: event.type,
        importance: event.importance,
        universeId: event.universeId,
        universeName: event.universe.name,
        characterId: event.characterId || '',
        characterName: event.character?.name || '',
        locationId: event.locationId || '',
        locationName: event.location?.name || '',
        createdAt: event.createdAt.toISOString(),
      };

      return {
        success: true,
        data: formattedEvent,
      };
    } catch (error) {
      this.logger.error(`Failed to create event: ${error}`);
      throw error;
    }
  }
}
