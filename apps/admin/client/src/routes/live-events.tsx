import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { LiveEventAdmin } from '@/lib/admin-types';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: 'rgba(232,66,10,0.15)', color: '#E8420A' },
  live: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e' },
  ended: { bg: 'rgba(107,114,128,0.15)', color: '#6b7280' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
};

function formatCurrency(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LiveEventsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LiveEventAdmin | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    ticketPrice: '',
    currency: 'NGN',
    maxViewers: '',
    duration: '60',
    scheduledAt: '',
    chatEnabled: true,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'live-events', statusFilter],
    queryFn: async () => {
      const res = await adminApi.listLiveEvents(statusFilter || undefined);
      return res.success
        ? (res.data as { items: LiveEventAdmin[]; total: number })
        : { items: [], total: 0 };
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createLiveEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-events'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateLiveEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-events'] });
      closeModal();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelLiveEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'live-events'] }),
  });

  const events = data?.items ?? [];

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm({
      title: '',
      description: '',
      thumbnail: '',
      ticketPrice: '',
      currency: 'NGN',
      maxViewers: '',
      duration: '60',
      scheduledAt: '',
      chatEnabled: true,
    });
  }

  function openCreate() {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      thumbnail: '',
      ticketPrice: '',
      currency: 'NGN',
      maxViewers: '',
      duration: '60',
      scheduledAt: '',
      chatEnabled: true,
    });
    setShowModal(true);
  }

  function openEdit(event: LiveEventAdmin) {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description || '',
      thumbnail: event.thumbnail,
      ticketPrice: String(event.ticketPrice),
      currency: event.currency,
      maxViewers: event.maxViewers ? String(event.maxViewers) : '',
      duration: String(event.duration),
      scheduledAt: event.scheduledAt.slice(0, 16),
      chatEnabled: event.chatEnabled,
    });
    setShowModal(true);
  }

  function handleSubmit() {
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || undefined,
      thumbnail: form.thumbnail,
      ticketPrice: parseFloat(form.ticketPrice) || 0,
      currency: form.currency,
      maxViewers: form.maxViewers ? parseInt(form.maxViewers) : undefined,
      duration: parseInt(form.duration) || 60,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      chatEnabled: form.chatEnabled,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Live Events</h1>
          <p style={{ color: '#9A8A7A' }}>{data?.total ?? 0} events</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          + New Event
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'scheduled', 'live', 'ended', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              backgroundColor: statusFilter === s ? '#E8420A' : 'rgba(255,255,255,0.05)',
              color: statusFilter === s ? '#fff' : '#9A8A7A',
              cursor: 'pointer',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading && (
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
      )}
      {error && (
        <p style={{ color: '#ef4444', textAlign: 'center', padding: 40 }}>Failed to load events</p>
      )}

      {!isLoading && !error && (
        <div style={{ borderRadius: 16, border: '1px solid #2A1A1A', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A1A1A' }}>
                  {['Title', 'Status', 'Price', 'Scheduled', 'Tickets', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: '#9A8A7A',
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const statusStyle = STATUS_STYLES[event.status] || {
                    bg: 'rgba(107,114,128,0.15)',
                    color: '#6b7280',
                  };
                  return (
                    <tr
                      key={event.id}
                      style={{
                        borderBottom: '1px solid #1A0A0A',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{event.title}</p>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#E8420A' }}>
                        {formatCurrency(Number(event.ticketPrice), event.currency)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9A8A7A', fontSize: 13 }}>
                        {formatDate(event.scheduledAt)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#9A8A7A', fontSize: 13 }}>
                        {event._count?.tickets ?? 0}
                        {event.maxViewers ? ` / ${event.maxViewers}` : ''}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => openEdit(event)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid #2A1A1A',
                              background: 'transparent',
                              color: '#9A8A7A',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          {event.status !== 'cancelled' && event.status !== 'ended' && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(`Cancel "${event.title}" and refund all tickets?`)
                                ) {
                                  cancelMutation.mutate(event.id);
                                }
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'transparent',
                                color: '#ef4444',
                                fontSize: 11,
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>
                      No live events found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 16,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: '#1A0A0A',
              borderRadius: 16,
              border: '1px solid #2A1A1A',
              padding: 24,
              maxWidth: 560,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {editing ? 'Edit Live Event' : 'New Live Event'}
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Thumbnail URL
              </label>
              <input
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}
            >
              <div>
                <label
                  style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}
                >
                  Ticket Price
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.ticketPrice}
                  onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}
                >
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 14,
                    outline: 'none',
                  }}
                >
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}
            >
              <div>
                <label
                  style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}
                >
                  Duration (min)
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}
                >
                  Max Viewers
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.maxViewers}
                  onChange={(e) => setForm({ ...form, maxViewers: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #2A1A1A',
                    backgroundColor: '#0D0505',
                    color: '#F5F0EB',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  backgroundColor: '#0D0505',
                  color: '#F5F0EB',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.chatEnabled}
                  onChange={(e) => setForm({ ...form, chatEnabled: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#E8420A' }}
                />
                <span style={{ fontSize: 13, color: '#9A8A7A' }}>Enable Chat</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.title || !form.scheduledAt}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background:
                    !form.title || !form.scheduledAt
                      ? '#2A1A1A'
                      : 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: !form.title || !form.scheduledAt ? '#666' : '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: !form.title || !form.scheduledAt ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Saving...' : editing ? 'Update Event' : 'Create Event'}
              </button>
              <button
                onClick={closeModal}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: '1px solid #2A1A1A',
                  background: 'transparent',
                  color: '#9A8A7A',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
