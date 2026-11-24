import { Injectable, Logger } from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { upstreamAuthContext } from '../../common/upstream-auth.middleware';

// support-service has answered these endpoints with more than one shape over
// time (nested `user`, `tickets` vs `items`, `message` vs `body`), and this
// service is the normaliser, so every field below it probes is optional.
interface UpstreamUser {
  email?: string;
  displayName?: string;
}

interface UpstreamMessage {
  id?: string;
  ticketId?: string;
  senderId?: string;
  authorId?: string;
  userId?: string;
  senderName?: string;
  authorName?: string;
  senderType?: string;
  authorRole?: string;
  message?: string;
  body?: string;
  createdAt?: string;
}

interface UpstreamTicket {
  // The admin UI keys every row off these two, and the normaliser below already
  // treats them as present.
  id: string;
  userId: string;
  subject?: string;
  description?: string;
  userEmail?: string;
  userName?: string;
  user?: UpstreamUser;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  messages?: UpstreamMessage[];
  createdAt?: string;
  updatedAt?: string;
}

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
  messages?: UpstreamMessage[];
  createdAt: string;
  updatedAt: string;
}

interface UpstreamStats {
  open?: number;
  openTickets?: number;
  inProgress?: number;
  inProgressTickets?: number;
  resolved?: number;
  resolvedTickets?: number;
  closed?: number;
  closedTickets?: number;
  avgResponseTimeMs?: number;
}

/**
 * Passthrough of support-service's SCREAMING enums into the panel's lowercase
 * unions. Not a validator: the upstream states carry members this union does not
 * (`PENDING_INFO`, `ESCALATED`), and folding those into a known state would
 * discard a status the ticket list can already render.
 */
function asState<T extends string>(raw: string | undefined, fallback: T): T {
  return (raw || fallback).toLowerCase() as T;
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
    } catch (error) {
      this.logger.warn(
        `support-service unreachable at ${url}: ${error instanceof Error ? error.message : error}`
      );
      // The try wraps the transport only, so whatever reaches here is an
      // unreachable or timed-out upstream. Carrying a network `code` is what makes
      // mapAndThrow answer 503 rather than flattening an outage into a generic 500.
      mapAndThrow(
        Object.assign(new Error('support-service is currently unavailable'), {
          cause: error,
          code: (error as { code?: string }).code ?? 'ECONNREFUSED',
        }),
        `reaching support-service at ${url}`
      );
    }

    const body = (await res.json().catch(() => null)) as {
      success?: boolean;
      data?: T;
      message?: string;
    } | null;

    if (!res.ok || !body) {
      throw new Error(body?.message || `support-service error (${res.status})`);
    }

    return (body.data !== undefined ? body.data : (body as unknown)) as T;
  }

  async getStats() {
    try {
      const stats = await this.upstream<UpstreamStats>('/support/dashboard/stats');
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
    if (query.status && query.status !== 'all') q.set('status', query.status.toUpperCase());
    if (query.priority && query.priority !== 'all') q.set('priority', query.priority.toUpperCase());
    if (query.category && query.category !== 'all') q.set('category', query.category.toUpperCase());

    try {
      const res = await this.upstream<
        | UpstreamTicket[]
        | {
            items?: UpstreamTicket[];
            tickets?: UpstreamTicket[];
            total?: number;
            meta?: { total?: number };
          }
      >(`/support/tickets?${q.toString()}`);
      // The list endpoint has answered with a bare array as well as a wrapper.
      const envelope = Array.isArray(res) ? { items: res } : res;
      const rawList = envelope.tickets || envelope.items || [];
      const total = envelope.meta?.total || envelope.total || rawList.length;

      const items: SupportTicketItem[] = rawList.map((t) => ({
        id: t.id,
        subject: t.subject || 'Support Request',
        description: t.description || '',
        userId: t.userId,
        userEmail: t.userEmail || t.user?.email || 'user@azeebo.tv',
        userName: t.userName || t.user?.displayName || 'Azeebo User',
        status: asState<SupportTicketItem['status']>(t.status, 'open'),
        priority: asState<SupportTicketItem['priority']>(t.priority, 'medium'),
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
      const res = await this.upstream<UpstreamTicket & { ticket?: UpstreamTicket }>(
        `/support/tickets/${id}`
      );
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
        messages: (t.messages || []).map((m) => ({
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
    } catch (err) {
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
