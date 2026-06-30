import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../ticket/dto/ticket.dto';

@Injectable()
export class TicketService {
  constructor(private prisma: PrismaService) {}

  async createTicket(data: {
    userId: string;
    category: SupportTicketCategory;
    subject: string;
    description: string;
    priority?: SupportTicketPriority;
    orderId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.supportTicket.create({
      data: {
        userId: data.userId,
        category: data.category,
        subject: data.subject,
        description: data.description,
        priority: data.priority || SupportTicketPriority.MEDIUM,
        orderId: data.orderId,
        metadata: (data.metadata || {}) as Prisma.InputJsonValue,
      },
      include: { messages: true },
    });
  }

  async getTicketById(id: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        refund: true,
        chargeback: true,
        appeal: true,
        takedown: true,
        dispute: true,
        suspension: true,
      },
    });
  }

  async getUserTickets(
    userId: string,
    options?: {
      status?: SupportTicketStatus;
      category?: SupportTicketCategory;
      page?: number;
      limit?: number;
    }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(options?.status && { status: options.status }),
      ...(options?.category && { category: options.category }),
    };

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTickets(options?: {
    status?: SupportTicketStatus;
    category?: SupportTicketCategory;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(options?.status && { status: options.status }),
      ...(options?.category && { category: options.category }),
      ...(options?.assignedTo && { assignedTo: options.assignedTo }),
    };

    const [tickets, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTicketStatus(id: string, status: SupportTicketStatus, assignedTo?: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        ...(assignedTo && { assignedTo }),
        ...(status === SupportTicketStatus.RESOLVED && { resolvedAt: new Date() }),
      },
    });
  }

  async addMessage(
    ticketId: string,
    senderId: string,
    senderType: 'USER' | 'ADMIN' | 'SYSTEM',
    message: string,
    isInternal = false
  ) {
    return this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderId,
        senderType,
        message,
        isInternal,
      },
    });
  }

  async assignTicket(id: string, assignedTo: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        assignedTo,
        status: SupportTicketStatus.IN_PROGRESS,
      },
    });
  }

  async escalateTicket(id: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: SupportTicketStatus.ESCALATED,
        priority: SupportTicketPriority.HIGH,
      },
    });
  }

  async closeTicket(id: string) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: SupportTicketStatus.CLOSED,
        resolvedAt: new Date(),
      },
    });
  }
}
