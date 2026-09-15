import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { SupportTicket, SupportStats } from '@/lib/admin-types';
import { Icon } from '@/components/Icons';

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const { data: stats } = useQuery<SupportStats>({
    queryKey: ['admin', 'support-stats'],
    queryFn: async () => {
      const res = await adminApi.getSupportStats();
      if (res.success && res.data) return res.data as SupportStats;
      return { open: 0, inProgress: 0, resolved: 0, closed: 0 };
    },
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['admin', 'support-tickets', page, statusFilter, priorityFilter, search],
    queryFn: async () => {
      const res = await adminApi.getSupportTickets({
        page,
        limit: 15,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        search: search || undefined,
      });
      if (res.success && res.data) {
        return res.data as { items: SupportTicket[]; total: number; totalPages: number };
      }
      return { items: [], total: 0, totalPages: 1 };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateSupportTicketStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'support-stats'] });
      if (selectedTicket) {
        adminApi.getSupportTicket(selectedTicket.id).then((res) => {
          if (res.success && res.data) setSelectedTicket(res.data as SupportTicket);
        });
      }
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      adminApi.replySupportTicket(id, body),
    onSuccess: () => {
      setReplyMessage('');
      if (selectedTicket) {
        adminApi.getSupportTicket(selectedTicket.id).then((res) => {
          if (res.success && res.data) setSelectedTicket(res.data as SupportTicket);
        });
      }
    },
  });

  const tickets = ticketsData?.items || [];
  const total = ticketsData?.total || 0;
  const totalPages = ticketsData?.totalPages || 1;

  const statCards = [
    { label: 'Open Tickets', value: stats?.open ?? 0, color: 'var(--admin-red)' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, color: 'var(--admin-orange)' },
    { label: 'Resolved', value: stats?.resolved ?? 0, color: 'var(--admin-emerald)' },
    { label: 'Closed', value: stats?.closed ?? 0, color: 'var(--admin-text-muted)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="messageSquare" size={26} color="var(--admin-orange)" />
          Support Helpdesk
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', marginTop: 4 }}>
          Manage user appeals, creator tickets, account disputes, and refund inquiries
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {statCards.map((c, i) => (
          <div
            key={i}
            style={{
              padding: 18,
              borderRadius: 12,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              {c.label}
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search tickets by subject or user..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            flex: 1,
            minWidth: 240,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            color: 'var(--admin-text)',
            fontSize: 13,
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            color: 'var(--admin-text)',
            fontSize: 13,
          }}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            color: 'var(--admin-text)',
            fontSize: 13,
          }}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Main Grid: Ticket List + Detail Drawer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedTicket ? '1fr 1fr' : '1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* Tickets List */}
        <div
          style={{
            borderRadius: 16,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              Loading tickets...
            </p>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Icon name="checkCircle" size={32} color="var(--admin-emerald)" />
              <p style={{ color: 'var(--admin-text)', fontWeight: 600, marginTop: 12 }}>
                All caught up!
              </p>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 4 }}>
                No support tickets matching the current filter.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--admin-card)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>Subject</th>
                    <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>User</th>
                    <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>Priority</th>
                    <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>Status</th>
                    <th style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        backgroundColor:
                          selectedTicket?.id === t.id ? 'rgba(232,66,10,0.08)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{t.subject}</p>
                        <p style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{t.category}</p>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--admin-text)' }}>
                        {t.userName || t.userEmail || t.userId.slice(0, 8)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            backgroundColor:
                              t.priority === 'urgent'
                                ? 'rgba(204,28,28,0.2)'
                                : t.priority === 'high'
                                  ? 'rgba(232,66,10,0.2)'
                                  : 'rgba(245,158,11,0.2)',
                            color:
                              t.priority === 'urgent'
                                ? 'var(--admin-red)'
                                : t.priority === 'high'
                                  ? 'var(--admin-orange)'
                                  : 'var(--admin-amber)',
                          }}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            backgroundColor:
                              t.status === 'resolved' || t.status === 'closed'
                                ? 'rgba(13,59,46,0.25)'
                                : t.status === 'in_progress'
                                  ? 'rgba(232,66,10,0.2)'
                                  : 'rgba(245,158,11,0.2)',
                            color:
                              t.status === 'resolved' || t.status === 'closed'
                                ? 'var(--admin-emerald)'
                                : t.status === 'in_progress'
                                  ? 'var(--admin-orange)'
                                  : 'var(--admin-amber)',
                          }}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)' }}>
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--admin-card)' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-card)',
                  background: 'transparent',
                  color: page <= 1 ? 'var(--admin-text-muted)' : 'var(--admin-orange)',
                  fontSize: 12,
                  cursor: page <= 1 ? 'default' : 'pointer',
                }}
              >
                Prev
              </button>
              <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', alignSelf: 'center' }}>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--admin-card)',
                  background: 'transparent',
                  color: page >= totalPages ? 'var(--admin-text-muted)' : 'var(--admin-orange)',
                  fontSize: 12,
                  cursor: page >= totalPages ? 'default' : 'pointer',
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Selected Ticket Thread Panel */}
        {selectedTicket && (
          <div
            style={{
              borderRadius: 16,
              border: '1px solid var(--admin-card)',
              backgroundColor: 'var(--admin-surface)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--admin-text)' }}>
                  {selectedTicket.subject}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                  From: {selectedTicket.userName} ({selectedTicket.userEmail || selectedTicket.userId})
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--admin-text-muted)',
                  cursor: 'pointer',
                }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['open', 'in_progress', 'resolved', 'closed'].map((st) => (
                <button
                  key={st}
                  onClick={() => updateStatusMutation.mutate({ id: selectedTicket.id, status: st })}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-card)',
                    backgroundColor:
                      selectedTicket.status === st ? 'var(--admin-orange)' : 'transparent',
                    color: selectedTicket.status === st ? 'white' : 'var(--admin-text-muted)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                  }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div
              style={{
                backgroundColor: 'var(--admin-dark)',
                borderRadius: 10,
                padding: 14,
                marginBottom: 20,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--admin-text)' }}>
                {selectedTicket.description}
              </p>
            </div>

            {/* Conversation Messages Thread */}
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 10, textTransform: 'uppercase' }}>
              Messages ({selectedTicket.messages?.length ?? 0})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 250, overflowY: 'auto', marginBottom: 16 }}>
              {(selectedTicket.messages || []).map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor:
                      m.authorRole?.toLowerCase() === 'agent' || m.authorRole?.toLowerCase() === 'admin'
                        ? 'rgba(232,66,10,0.1)'
                        : 'var(--admin-dark)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--admin-text)' }}>
                      {m.authorName || 'User'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--admin-text)' }}>{m.body}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Type a response to the user..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyMessage.trim()) {
                    replyMutation.mutate({ id: selectedTicket.id, body: replyMessage });
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 13,
                }}
              />
              <button
                onClick={() => {
                  if (replyMessage.trim()) {
                    replyMutation.mutate({ id: selectedTicket.id, body: replyMessage });
                  }
                }}
                disabled={!replyMessage.trim() || replyMutation.isPending}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--admin-orange)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: !replyMessage.trim() ? 'not-allowed' : 'pointer',
                  opacity: !replyMessage.trim() ? 0.5 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
