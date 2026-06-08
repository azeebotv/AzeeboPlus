import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupportRepository, CreateTicketDto, Ticket, TicketReply } from './support.repository';

interface CreateTicketInput {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

@Injectable()
export class SupportService {
  constructor(private readonly supportRepository: SupportRepository) {}

  async createTicket(userId: string, data: CreateTicketInput): Promise<Ticket> {
    const ticketData: CreateTicketDto = {
      userId,
      title: data.title,
      description: data.description,
      priority: data.priority,
    };

    return this.supportRepository.createTicket(ticketData);
  }

  async getTickets(userId: string): Promise<Ticket[]> {
    const result = await this.supportRepository.getTickets(userId, 1, 20);
    return result.data;
  }

  async getTicketById(userId: string, ticketId: string): Promise<Ticket> {
    const ticket = await this.supportRepository.getTicketById(ticketId);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return ticket;
  }

  async updateTicket(
    userId: string,
    ticketId: string,
    data: Partial<CreateTicketInput>
  ): Promise<Ticket> {
    await this.getTicketById(userId, ticketId);

    const updatedTicket = await this.supportRepository.updateTicket(ticketId, data);
    if (!updatedTicket) {
      throw new NotFoundException('Ticket not found');
    }
    return updatedTicket;
  }

  async addReply(userId: string, ticketId: string, message: string): Promise<TicketReply> {
    await this.getTicketById(userId, ticketId);

    return this.supportRepository.addReply(ticketId, userId, message);
  }

  async closeTicket(userId: string, ticketId: string): Promise<Ticket> {
    await this.getTicketById(userId, ticketId);

    const ticket = await this.supportRepository.closeTicket(ticketId);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }
}
