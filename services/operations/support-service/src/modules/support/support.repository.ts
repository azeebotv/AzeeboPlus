import {Inject,  Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import {
  SupportTicketPriority,
  SupportTicketStatus,
} from '../ticket/dto/ticket.dto';

export interface CreateTicketDto {
  userId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Ticket {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt?: Date;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  createdAt: Date;
}

export interface PaginatedTickets {
  data: Ticket[];
  page: number;
  limit: number;
  total: number;
}

// NOTE: Legacy repository — duplicates ticket.repository.ts functionality.
// Should be consolidated into the canonical ticket module and removed.
@Injectable()
export class SupportRepository {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {}

  async createTicket(data: CreateTicketDto): Promise<Ticket> {
    const priorityMap: Record<string, SupportTicketPriority> = {
      low: SupportTicketPriority.LOW,
      medium: SupportTicketPriority.MEDIUM,
      high: SupportTicketPriority.HIGH,
    };

    const ticket = await this.prisma.supportTicket.create({
      data: {
        id: `ticket-${randomUUID()}`,
        userId: data.userId,
        subject: data.title,
        description: data.description,
        priority: priorityMap[data.priority],
        status: 'OPEN',
        category: 'GENERAL',
      },
    });

    return {
      id: ticket.id,
      userId: ticket.userId,
      title: ticket.subject,
      description: ticket.description,
      status: ticket.status.toLowerCase().replace('_', '') as Ticket['status'],
      priority: ticket.priority.toLowerCase() as Ticket['priority'],
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  async getTickets(userId: string, page: number, limit: number): Promise<PaginatedTickets> {
    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where: { userId } }),
    ]);

    return {
      data: data.map((ticket) => ({
        id: ticket.id,
        userId: ticket.userId,
        title: ticket.subject,
        description: ticket.description,
        status: ticket.status.toLowerCase().replace('_', '') as Ticket['status'],
        priority: ticket.priority.toLowerCase() as Ticket['priority'],
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      })),
      page,
      limit,
      total,
    };
  }

  async getTicketById(ticketId: string): Promise<Ticket | null> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) return null;

    return {
      id: ticket.id,
      userId: ticket.userId,
      title: ticket.subject,
      description: ticket.description,
      status: ticket.status.toLowerCase().replace('_', '') as Ticket['status'],
      priority: ticket.priority.toLowerCase() as Ticket['priority'],
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  async updateTicket(ticketId: string, data: Partial<Ticket>): Promise<Ticket | null> {
    const statusMap: Record<string, SupportTicketStatus> = {
      open: SupportTicketStatus.OPEN,
      in_progress: SupportTicketStatus.IN_PROGRESS,
      resolved: SupportTicketStatus.RESOLVED,
      closed: SupportTicketStatus.CLOSED,
    };

    const priorityMap: Record<string, SupportTicketPriority> = {
      low: SupportTicketPriority.LOW,
      medium: SupportTicketPriority.MEDIUM,
      high: SupportTicketPriority.HIGH,
    };

    const ticket = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        subject: data.title,
        description: data.description,
        status: data.status ? statusMap[data.status] : undefined,
        priority: data.priority ? priorityMap[data.priority] : undefined,
      },
    });

    return {
      id: ticket.id,
      userId: ticket.userId,
      title: ticket.subject,
      description: ticket.description,
      status: ticket.status.toLowerCase().replace('_', '') as Ticket['status'],
      priority: ticket.priority.toLowerCase() as Ticket['priority'],
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  async addReply(ticketId: string, userId: string, message: string): Promise<TicketReply> {
    const reply = await this.prisma.supportMessage.create({
      data: {
        id: `reply-${randomUUID()}`,
        ticketId,
        senderId: userId,
        senderType: 'USER',
        message,
      },
    });

    return {
      id: reply.id,
      ticketId: reply.ticketId,
      userId: reply.senderId,
      message: reply.message,
      createdAt: reply.createdAt,
    };
  }

  async closeTicket(ticketId: string): Promise<Ticket | null> {
    return this.updateTicket(ticketId, { status: 'closed' });
  }
}
