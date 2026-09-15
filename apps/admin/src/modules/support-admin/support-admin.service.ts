import { Injectable, Logger } from '@nestjs/common';
import { upstreamAuthContext } from '../../common/upstream-auth.middleware';

export interface SupportTicketItem {
  id: string;
  subject: string;
  description: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  messages?: any[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class SupportAdminService {
  private readonly logger = new Logger(SupportAdminService.name);

  private get baseUrl(): string {
    return process.env.SUPPORT_SERVICE_URL || 'http://localhost:3028';
  }

  private async upstream<T>(path: string, init: RequestInit = {}): Promise<T> {
    const auth = upstreamAuthContext.getStore();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((init.headers as Record<string, string>) || {}),
    };

    if (auth?.authorization) {
      headers['authorization'] = auth.authorization;
    } else if (auth?.userId) {
      headers['x-user-id'] = auth.userId;
      if (auth.email) headers['x-user-email'] = auth.email;
      if (auth.role) headers['x-user-role'] = auth.role;
      if (auth.gatewaySecret) headers['x-gateway-secret'] = auth.gatewaySecret;
    }

    const url = `${this.baseUrl}/v1${path.startsWith('/') ? path : `/${path}`}`;
    let res: Response;
    try {
      res = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(6_000) });
    } catch (e) {
      this.logger.warn(`support-service unreachable at ${url}: ${e instanceof Error ? e.message : e}`);
      throw new Error('support-service is currently unavailable');
    }

    const body = (await res.json().catch(() => null)) as
      | { success?: boolean; data?: T; message?: string }
      | null;

    if (!res.ok || !body) {
      throw new Error(body?.message || `support-service error (${res.status})`);
    }

    return (body.data !== undefined ? body.data : (body as unknown)) as T;
  }

  async getStats() {
    try {
      const stats = await this.upstream<any>('/support/dashboard/stats');
      return {
        open: Number(stats?.openTickets || stats?.open || 0),
        inProgress: Number(stats?.inProgressTickets || stats?.inProgress || 0),
        resolved: Number(stats?.resolvedTickets || stats?.resolved || 0),
        closed: Number(stats?.closedTickets || stats?.closed || 0),
        avgResponseTimeMs: Number(stats?.avgResponseTimeMs || 0),
      };
    } catch (err) {
      return {
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        avgResponseTimeMs: 0,
      };
    }
  }

  async getTickets(query: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
  }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);

    const q = new URLSearchParams();
    q.set('page', String(page));
    q.set('limit', String(limit));
    if (query.status && query.status !== 'all') q.set('status', query.status);
    if (query.priority && query.priority !== 'all') q.set('priority', query.priority);
    if (query.category && query.category !== 'all') q.set('category', query.category);

    try {
      const res = await this.upstream<{ items?: any[]; tickets?: any[]; total?: number; meta?: any }>(
        `/support/tickets?${q.toString()}`
      );
      const rawList = res.tickets || res.items || (Array.isArray(res) ? res : []);
      const total = res.meta?.total || res.total || rawList.length;

      const items: SupportTicketItem[] = rawList.map((t: any) => ({
        id: t.id,
        subject: t.subject || 'Support Request',
        description: t.description || '',
        userId: t.userId,
        userEmail: t.userEmail || t.user?.email || 'user@azeebo.tv',
        userName: t.userName || t.user?.displayName || 'Azeebo User',
        status: (t.status || 'open').toLowerCase(),
        priority: (t.priority || 'medium').toLowerCase(),
        category: t.category || 'General',
        assignedTo: t.assignedTo || null,
        assignedToName: t.assignedToName || (t.assignedTo ? 'Agent' : null),
        messages: t.messages || [],
        createdAt: t.createdAt || new Date().toISOString(),
        updatedAt: t.updatedAt || new Date().toISOString(),
      }));

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (err) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
      };
    }
  }

  async getTicketById(id: string) {
    try {
      const res = await this.upstream<{ ticket?: any }>(`/support/tickets/${id}`);
      const t = res.ticket || res;
      return {
        id: t.id,
        subject: t.subject || 'Support Request',
        description: t.description || '',
        userId: t.userId,
        userEmail: t.userEmail || t.user?.email,
        userName: t.userName || t.user?.displayName,
        status: (t.status || 'open').toLowerCase(),
        priority: (t.priority || 'medium').toLowerCase(),
        category: t.category || 'General',
        assignedTo: t.assignedTo || null,
        assignedToName: t.assignedToName,
        messages: (t.messages || []).map((m: any) => ({
          id: m.id,
          ticketId: m.ticketId || id,
          authorId: m.senderId || m.authorId || m.userId,
          authorName: m.senderName || m.authorName || 'Agent',
          authorRole: m.senderType || m.authorRole || 'agent',
          body: m.message || m.body || '',
          createdAt: m.createdAt || new Date().toISOString(),
        })),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    } catch (e) {
      return null;
    }
  }

  async updateStatus(id: string, status: string, assignedTo?: string) {
    return this.upstream(`/support/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toUpperCase(), assignedTo }),
    });
  }

  async assignTicket(id: string, assignedTo: string) {
    return this.upstream(`/support/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedTo }),
    });
  }

  async addReply(id: string, message: string) {
    return this.upstream(`/support/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, isInternal: false }),
    });
  }
}
