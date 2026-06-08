import { apiClient } from './client';
import type { ApiResponse } from './auth';

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketData {
  subject: string;
  category: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export const supportApi = {
  createTicket: async (data: CreateTicketData): Promise<ApiResponse<SupportTicket>> => {
    return apiClient.post<ApiResponse<SupportTicket>>('/support/tickets', data);
  },

  getTickets: async (page = 1, limit = 20): Promise<ApiResponse<{ items: SupportTicket[]; total: number; page: number; limit: number; totalPages: number }>> => {
    return apiClient.get<ApiResponse<{ items: SupportTicket[]; total: number; page: number; limit: number; totalPages: number }>>(
      `/support/tickets?page=${page}&limit=${limit}`
    );
  },

  getTicketById: async (ticketId: string): Promise<ApiResponse<SupportTicket>> => {
    return apiClient.get<ApiResponse<SupportTicket>>(`/support/tickets/${ticketId}`);
  },

  addMessage: async (ticketId: string, message: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>(`/support/tickets/${ticketId}/messages`, { message });
  },

  closeTicket: async (ticketId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.post<ApiResponse<{ message: string }>>(`/support/tickets/${ticketId}/close`);
  },
};
