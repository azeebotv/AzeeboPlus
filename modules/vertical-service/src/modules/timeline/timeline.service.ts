import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface TimelineEvent {
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

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  async getTimeline(
    universeSlug?: string,
    characterSlug?: string,
    startDate?: string,
    endDate?: string,
  ) {
    let where = {};

    if (universeSlug) {
      const universe = await this.prisma.universeMap.findUnique({
        where: { slug: universeSlug },
      });
      if (universe) {
        where = { ...where, universeId: universe.id };
      }
    }

    if (characterSlug) {
      const character = await this.prisma.character.findUnique({
        where: { slug: characterSlug },
      });
      if (character) {
        where = { ...where, characterId: character.id };
      }
    }

    if (startDate) {
      where = { ...where, date: { gte: new Date(startDate) } };
    }

    if (endDate) {
      where = { ...where, date: { lte: new Date(endDate) } };
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
  }

  async getEventById(id: string) {
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
  }

  async getUpcomingEvents(limit = 10) {
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
  }) {
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
  }
}
