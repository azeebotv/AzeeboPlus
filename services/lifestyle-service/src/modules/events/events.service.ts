import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  isOnline: boolean;
  onlineLink: string;
  maxAttendees: number;
  status: string;
  categoryId: string;
  categoryName: string;
  creatorId: string;
  creatorName: string;
  viewCount: number;
  rsvpCount: number;
  publishedAt: string;
  createdAt: string;
}

interface Rsvp {
  id: string;
  userId: string;
  eventId: string;
  status: string;
  guests: number;
  note: string;
  createdAt: string;
}

interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

interface EventResponse {
  success: boolean;
  data?:
    | Event
    | Event[]
    | EventCategory[]
    | { items: Event[]; total: number; page: number; limit: number; totalPages: number }
    | { message: string }
    | { rsvp: Rsvp; message: string };
  error?: { code: string; message: string };
}

interface CreateEventData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: string;
  venue?: string;
  isOnline?: boolean;
  onlineLink?: string;
  maxAttendees?: number;
  categoryId?: string;
  creatorId: string;
}

interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  venue?: string;
  isOnline?: boolean;
  onlineLink?: string;
  maxAttendees?: number;
  categoryId?: string;
  status?: string;
}

interface RsvpData {
  status?: string;
  guests?: number;
  note?: string;
}

interface WhereClause {
  status?: string;
  category?: { slug: string };
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async getEvents(
    page = 1,
    limit = 20,
    category?: string,
    status = 'published'
  ): Promise<EventResponse> {
    const where: WhereClause = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (category) {
      where.category = { slug: category };
    }

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: { category: true, creator: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    const formattedEvents: Event[] = items.map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      coverImage: event.coverImage || '',
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() || '',
      location: event.location || '',
      venue: event.venue || '',
      isOnline: event.isOnline,
      onlineLink: event.onlineLink || '',
      maxAttendees: event.maxAttendees || 0,
      status: event.status,
      categoryId: event.categoryId || '',
      categoryName: event.category?.name || '',
      creatorId: event.creatorId,
      creatorName: event.creator.displayName || event.creator.username,
      viewCount: event.viewCount,
      rsvpCount: event.rsvpCount,
      publishedAt: event.publishedAt?.toISOString() || '',
      createdAt: event.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        items: formattedEvents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCategories(): Promise<EventResponse> {
    const categories = await this.prisma.eventCategory.findMany();
    const formattedCategories: EventCategory[] = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '',
    }));

    return {
      success: true,
      data: formattedCategories,
    };
  }

  async getUpcomingEvents(limit = 10): Promise<EventResponse> {
    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: {
        status: 'published',
        startDate: { gt: now },
      },
      include: { category: true, creator: true },
      take: limit,
      orderBy: { startDate: 'asc' },
    });

    const formattedEvents: Event[] = events.map((event) => ({
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      coverImage: event.coverImage || '',
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() || '',
      location: event.location || '',
      venue: event.venue || '',
      isOnline: event.isOnline,
      onlineLink: event.onlineLink || '',
      maxAttendees: event.maxAttendees || 0,
      status: event.status,
      categoryId: event.categoryId || '',
      categoryName: event.category?.name || '',
      creatorId: event.creatorId,
      creatorName: event.creator.displayName || event.creator.username,
      viewCount: event.viewCount,
      rsvpCount: event.rsvpCount,
      publishedAt: event.publishedAt?.toISOString() || '',
      createdAt: event.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: formattedEvents,
    };
  }

  async getEventBySlug(slug: string): Promise<EventResponse> {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: { category: true, creator: true, rsvps: true },
    });

    if (!event) {
      throw new NotFoundException(`Event not found: ${slug}`);
    }

    const formattedRsvps: Rsvp[] = event.rsvps.map((rsvp) => ({
      id: rsvp.id,
      userId: rsvp.userId,
      eventId: rsvp.eventId,
      status: rsvp.status,
      guests: rsvp.guests,
      note: rsvp.note || '',
      createdAt: rsvp.createdAt.toISOString(),
    }));

    const formattedEvent: Event & { rsvps: Rsvp[] } = {
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      coverImage: event.coverImage || '',
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() || '',
      location: event.location || '',
      venue: event.venue || '',
      isOnline: event.isOnline,
      onlineLink: event.onlineLink || '',
      maxAttendees: event.maxAttendees || 0,
      status: event.status,
      categoryId: event.categoryId || '',
      categoryName: event.category?.name || '',
      creatorId: event.creatorId,
      creatorName: event.creator.displayName || event.creator.username,
      viewCount: event.viewCount,
      rsvpCount: event.rsvpCount,
      publishedAt: event.publishedAt?.toISOString() || '',
      createdAt: event.createdAt.toISOString(),
      rsvps: formattedRsvps,
    };

    return {
      success: true,
      data: formattedEvent,
    };
  }

  async createEvent(data: CreateEventData): Promise<EventResponse> {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    const event = await this.prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        coverImage: '',
        startDate,
        endDate,
        location: data.location,
        venue: data.venue,
        isOnline: data.isOnline || false,
        onlineLink: data.onlineLink,
        maxAttendees: data.maxAttendees,
        status: 'draft',
        categoryId: data.categoryId,
        creatorId: data.creatorId,
        viewCount: 0,
        rsvpCount: 0,
        publishedAt: null,
      },
      include: { category: true, creator: true },
    });

    const formattedEvent: Event = {
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      coverImage: event.coverImage || '',
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() || '',
      location: event.location || '',
      venue: event.venue || '',
      isOnline: event.isOnline,
      onlineLink: event.onlineLink || '',
      maxAttendees: event.maxAttendees || 0,
      status: event.status,
      categoryId: event.categoryId || '',
      categoryName: event.category?.name || 'General',
      creatorId: event.creatorId,
      creatorName: event.creator.displayName || event.creator.username,
      viewCount: event.viewCount,
      rsvpCount: event.rsvpCount,
      publishedAt: event.publishedAt?.toISOString() || '',
      createdAt: event.createdAt.toISOString(),
    };

    return {
      success: true,
      data: formattedEvent,
    };
  }

  async updateEvent(id: string, data: UpdateEventData): Promise<EventResponse> {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Event not found: ${id}`);
    }

    const updateData: Record<string, unknown> = {};
    if (data.title) {
      updateData.title = data.title;
      updateData.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.venue !== undefined) updateData.venue = data.venue;
    if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;
    if (data.onlineLink !== undefined) updateData.onlineLink = data.onlineLink;
    if (data.maxAttendees !== undefined) updateData.maxAttendees = data.maxAttendees;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'published' && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: updateData,
      include: { category: true, creator: true },
    });

    const formatted: Event = {
      id: updated.id,
      title: updated.title,
      slug: updated.slug,
      description: updated.description,
      coverImage: updated.coverImage || '',
      startDate: updated.startDate.toISOString(),
      endDate: updated.endDate?.toISOString() || '',
      location: updated.location || '',
      venue: updated.venue || '',
      isOnline: updated.isOnline,
      onlineLink: updated.onlineLink || '',
      maxAttendees: updated.maxAttendees || 0,
      status: updated.status,
      categoryId: updated.categoryId || '',
      categoryName: updated.category?.name || '',
      creatorId: updated.creatorId,
      creatorName: updated.creator.displayName || updated.creator.username,
      viewCount: updated.viewCount,
      rsvpCount: updated.rsvpCount,
      publishedAt: updated.publishedAt?.toISOString() || '',
      createdAt: updated.createdAt.toISOString(),
    };

    return {
      success: true,
      data: formatted,
    };
  }

  async deleteEvent(id: string): Promise<EventResponse> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException(`Event not found: ${id}`);

    await this.prisma.event.delete({ where: { id } });

    return {
      success: true,
      data: { message: 'Event deleted successfully' },
    };
  }

  async rsvpEvent(eventId: string, userId: string, data: RsvpData): Promise<EventResponse> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { rsvps: true },
    });
    if (!event) throw new NotFoundException(`Event not found: ${eventId}`);

    const existing = await this.prisma.eventRsvp.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) {
      throw new BadRequestException('Already RSVPed to this event!');
    }

    if (event.maxAttendees && event.rsvpCount >= event.maxAttendees) {
      throw new BadRequestException('Event is fully booked!');
    }

    const rsvp = await this.prisma.eventRsvp.create({
      data: {
        userId,
        eventId,
        status: data.status || 'attending',
        guests: data.guests || 0,
        note: data.note,
      },
      include: { event: true },
    });

    await this.prisma.event.update({
      where: { id: eventId },
      data: { rsvpCount: event.rsvpCount + 1 },
    });

    const formattedRsvp: Rsvp = {
      id: rsvp.id,
      userId: rsvp.userId,
      eventId: rsvp.eventId,
      status: rsvp.status,
      guests: rsvp.guests,
      note: rsvp.note || '',
      createdAt: rsvp.createdAt.toISOString(),
    };

    return {
      success: true,
      data: { rsvp: formattedRsvp, message: 'RSVP successful' },
    };
  }

  async cancelRsvp(eventId: string, userId: string): Promise<EventResponse> {
    const existing = await this.prisma.eventRsvp.findUnique({
      where: { userId_eventId: { userId, eventId } },
      include: { event: true },
    });
    if (!existing) {
      throw new NotFoundException('RSVP not found');
    }

    await this.prisma.eventRsvp.delete({
      where: { userId_eventId: { userId, eventId } },
    });

    await this.prisma.event.update({
      where: { id: eventId },
      data: { rsvpCount: existing.event.rsvpCount - 1 },
    });

    return {
      success: true,
      data: { message: 'RSVP cancelled successfully' },
    };
  }
}
