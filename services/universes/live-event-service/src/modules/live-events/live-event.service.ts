import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service.js';
import axios from 'axios';

@Injectable()
export class LiveEventService {
  private readonly logger = new Logger(LiveEventService.name);
  private readonly walletServiceUrl: string;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService
  ) {
    this.walletServiceUrl =
      this.config.get<string>('WALLET_SERVICE_URL') || 'http://wallet-service:3002';
  }

  async listEvents(status?: string, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.liveEvent.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.liveEvent.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEvent(id: string) {
    const event = await this.prisma.liveEvent.findUnique({
      where: { id },
      include: { _count: { select: { tickets: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async createEvent(data: {
    title: string;
    description?: string;
    thumbnail: string;
    organizerId: string;
    scheduledAt: string;
    duration: number;
    ticketPrice: number;
    currency?: string;
    maxViewers?: number;
    chatEnabled?: boolean;
  }) {
    return this.prisma.liveEvent.create({
      data: {
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        organizerId: data.organizerId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        ticketPrice: data.ticketPrice,
        currency: data.currency || 'NGN',
        maxViewers: data.maxViewers,
        chatEnabled: data.chatEnabled ?? true,
        status: 'scheduled',
      },
    });
  }

  async updateEvent(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      thumbnail: string;
      scheduledAt: string;
      duration: number;
      ticketPrice: number;
      currency: string;
      maxViewers: number;
      streamUrl: string;
      replayUrl: string;
      status: string;
      chatEnabled: boolean;
    }>
  ) {
    const existing = await this.prisma.liveEvent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Event not found');

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.ticketPrice !== undefined) updateData.ticketPrice = data.ticketPrice;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.maxViewers !== undefined) updateData.maxViewers = data.maxViewers;
    if (data.streamUrl !== undefined) updateData.streamUrl = data.streamUrl;
    if (data.replayUrl !== undefined) updateData.replayUrl = data.replayUrl;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.chatEnabled !== undefined) updateData.chatEnabled = data.chatEnabled;

    return this.prisma.liveEvent.update({ where: { id }, data: updateData });
  }

  async purchaseTicket(eventId: string, userId: string) {
    const event = await this.prisma.liveEvent.findUnique({
      where: { id: eventId },
      include: { _count: { select: { tickets: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');

    if (event.status === 'cancelled') {
      throw new BadRequestException('Event has been cancelled');
    }

    if (event.status === 'ended') {
      throw new BadRequestException('Event has already ended');
    }

    if (event.maxViewers && event._count.tickets >= event.maxViewers) {
      throw new ConflictException('Event is sold out');
    }

    const existingTicket = await this.prisma.liveEventTicket.findFirst({
      where: { eventId, userId, status: 'purchased' },
    });
    if (existingTicket) {
      throw new ConflictException('You already have a ticket for this event');
    }

    if (Number(event.ticketPrice) > 0) {
      try {
        await axios.post(`${this.walletServiceUrl}/wallet/debit`, {
          userId,
          amount: Number(event.ticketPrice),
          currency: event.currency,
          description: `Ticket for ${event.title}`,
          reference: `ticket-${eventId}-${userId}-${Date.now()}`,
        });
      } catch (error) {
        this.logger.error('Wallet debit failed', error);
        throw new BadRequestException(
          'Insufficient balance. Please fund your wallet and try again.'
        );
      }
    }

    return this.prisma.liveEventTicket.create({
      data: {
        eventId,
        userId,
        amount: event.ticketPrice,
        currency: event.currency,
        status: 'purchased',
      },
    });
  }

  async getUserTickets(userId: string) {
    return this.prisma.liveEventTicket.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { purchasedAt: 'desc' },
    });
  }

  async getStreamUrl(eventId: string, userId: string) {
    const event = await this.prisma.liveEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.status === 'scheduled') {
      throw new ForbiddenException('Event has not started yet');
    }

    const ticket = await this.prisma.liveEventTicket.findFirst({
      where: { eventId, userId, status: 'purchased' },
    });
    if (!ticket) {
      throw new ForbiddenException('You must purchase a ticket to watch this event');
    }

    if (event.streamUrl) return { streamUrl: event.streamUrl, event };

    if (event.replayUrl && event.status === 'ended') {
      return { streamUrl: event.replayUrl, event };
    }

    throw new NotFoundException('Stream not available yet');
  }

  async cancelEvent(id: string) {
    const event = await this.prisma.liveEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.status === 'ended' || event.status === 'cancelled') {
      throw new BadRequestException('Event cannot be cancelled');
    }

    await this.prisma.liveEventTicket.updateMany({
      where: { eventId: id, status: 'purchased' },
      data: { status: 'refunded', refundedAt: new Date() },
    });

    return this.prisma.liveEvent.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }
}
