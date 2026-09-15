import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { unwrapList } from '@/lib/payload';
import type { LiveEventAdmin } from '@/lib/admin-types';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: 'rgba(232,66,10,0.15)', color: 'var(--admin-orange)' },
  live: { bg: 'rgba(34,197,94,0.15)', color: 'var(--admin-emerald)' },
  ended: { bg: 'rgba(107,114,128,0.15)', color: 'var(--admin-grey)' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', color: 'var(--admin-red)' },
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
      // Upstream listEvents returns { items, total, page, limit, totalPages } —
      // but an upstream envelope drift must never crash the tree, so unwrap
      // through the shared guard instead of casting.
      const { items, total } = unwrapList<LiveEventAdmin>(res.success ? res.data : null);
      return { items, total: total ?? items.length };
    },
  });

  const [formError, setFormError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createLiveEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-events'] });
      closeModal();
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to create event'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateLiveEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'live-events'] });
      closeModal();
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to update event'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelLiveEvent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'live-events'] }),
    onError: (e: Error) => setFormError(e.message || 'Failed to cancel event'),
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
    setFormError('');
    // Validate BEFORE Date math — new Date('') → Invalid Date →
    // toISOString() throws RangeError and crashes the component tree.
    const when = new Date(form.scheduledAt);
    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (Number.isNaN(when.getTime())) {
      setFormError('Pick a valid date and time for the schedule.');
      return;
    }
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || undefined,
      thumbnail: form.thumbnail,
      ticketPrice: parseFloat(form.ticketPrice) || 0,
      currency: form.currency,
      maxViewers: form.maxViewers ? parseInt(form.maxViewers) : undefined,
      duration: parseInt(form.duration) || 60,
      scheduledAt: when.toISOString(),
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
          <p style={{ color: 'var(--admin-text-muted)' }}>{data?.total ?? 0} events</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: 'white',
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
              backgroundColor:
                statusFilter === s ? 'var(--admin-orange)' : 'rgba(255,255,255,0.05)',
              color: statusFilter === s ? 'white' : 'var(--admin-text-muted)',
              cursor: 'pointer',
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading && (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      )}
      {error && (
        <p style={{ color: 'var(--admin-red)', textAlign: 'center', padding: 40 }}>
          Failed to load events
        </p>
      )}

      {!isLoading && !error && (
        <div
          style={{ borderRadius: 16, border: '1px solid var(--admin-surface)', overflow: 'hidden' }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--admin-surface)' }}>
                  {['Title', 'Status', 'Price', 'Scheduled', 'Tickets', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        color: 'var(--admin-text-muted)',
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
                    color: 'var(--admin-grey)',
                  };
                  return (
                    <tr
                      key={event.id}
                      style={{
                        borderBottom: '1px solid var(--admin-bg)',
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
                      <td
                        style={{
                          padding: '12px 16px',
                          fontWeight: 700,
                          color: 'var(--admin-orange)',
                        }}
                      >
                        {formatCurrency(Number(event.ticketPrice), event.currency)}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontSize: 13,
                        }}
                      >
                        {formatDate(event.scheduledAt)}
                      </td>
                      <td
                        style={{
                          padding: '12px 16px',
                          color: 'var(--admin-text-muted)',
                          fontSize: 13,
                        }}
                      >
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
                              border: '1px solid var(--admin-surface)',
                              background: 'transparent',
                              color: 'var(--admin-text-muted)',
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
                                color: 'var(--admin-red)',
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
                    <td
                      colSpan={6}
                      style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}
                    >
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
              backgroundColor: 'var(--admin-bg)',
              borderRadius: 16,
              border: '1px solid var(--admin-surface)',
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

            {formError && (
              <div
                role="alert"
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(204,28,28,0.4)',
                  backgroundColor: 'rgba(204,28,28,0.12)',
                  color: 'var(--admin-red-light)',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
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
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Thumbnail URL
              </label>
              <input
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
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
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
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
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
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
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
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
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
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
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
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
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                    color: 'var(--admin-text)',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
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
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'var(--admin-dark)',
                  color: 'var(--admin-text)',
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
                  style={{ width: 16, height: 16, accentColor: 'var(--admin-orange)' }}
                />
                <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>Enable Chat</span>
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
                      ? 'var(--admin-surface)'
                      : 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: !form.title || !form.scheduledAt ? 'var(--admin-grey)' : 'white',
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
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
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
