import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { Itinerary, Neighborhood, Partner, PartnerOffer } from '@/lib/admin-types';
import { requireData } from '@/lib/payload';
import { Icon } from '@/components/Icons';

/**
 * Lifestyle guides management (9TLIFE catalogs). One page, four tabs —
 * itineraries, neighborhoods, partners, offers — each with full CRUD against
 * lifestyle-service via the gateway's /lifestyle/admin routes. The public
 * 9TLIFE pages only ever show published/active rows, so publishing here is
 * the visibility switch.
 */

const CATALOG_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(154,138,122,0.2)', color: 'var(--admin-text-muted)' },
  published: { bg: 'rgba(13,59,46,0.3)', color: 'var(--admin-emerald)' },
  archived: { bg: 'rgba(120,120,120,0.2)', color: 'var(--admin-grey)' },
  active: { bg: 'rgba(13,59,46,0.3)', color: 'var(--admin-emerald)' },
  expired: { bg: 'rgba(204,28,28,0.15)', color: 'var(--admin-red)' },
};

type Catalog = 'itineraries' | 'neighborhoods' | 'partners' | 'offers';

const TABS: Catalog[] = ['itineraries', 'neighborhoods', 'partners', 'offers'];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--admin-surface)',
  backgroundColor: 'var(--admin-dark)',
  color: 'var(--admin-text)',
  fontSize: 14,
};

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--admin-card)',
  borderRadius: 12,
  padding: 16,
  background: 'var(--admin-surface)',
};

const primaryBtn: React.CSSProperties = {
  padding: '9px 18px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--admin-orange)',
  color: 'white',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};

function StatusBadge({ status }: { status: string }) {
  const st = CATALOG_STATUS_STYLE[status] ?? {
    bg: 'rgba(154,138,122,0.2)',
    color: 'var(--admin-text-muted)',
  };
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: st.bg,
        color: st.color,
      }}
    >
      {status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', flex: 1, minWidth: 160 }}>
      <span
        style={{
          display: 'block',
          fontSize: 11,
          color: 'var(--admin-text-muted)',
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function ConfirmDeleteButton({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button
        onClick={() => setArmed(true)}
        title={`Delete ${label}`}
        style={{
          ...primaryBtn,
          background: 'transparent',
          border: '1px solid var(--admin-red)',
          color: 'var(--admin-red)',
          padding: '6px 10px',
        }}
      >
        <Icon name="trash" size={14} />
      </button>
    );
  }
  return (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      <button
        onClick={onConfirm}
        style={{ ...primaryBtn, background: 'var(--admin-red)', padding: '6px 10px' }}
      >
        Confirm
      </button>
      <button
        onClick={() => setArmed(false)}
        style={{
          ...primaryBtn,
          background: 'transparent',
          border: '1px solid var(--admin-grey)',
          color: 'var(--admin-text-muted)',
          padding: '6px 10px',
        }}
      >
        Cancel
      </button>
    </span>
  );
}

// ─── Itineraries tab ─────────────────────────────────────────────────────────

interface ItineraryFormState {
  title: string;
  description: string;
  city: string;
  duration: string;
  status: string;
  stops: Array<{ name: string; description: string; duration: string; order: number }>;
}

const EMPTY_ITINERARY: ItineraryFormState = {
  title: '',
  description: '',
  city: 'Lagos',
  duration: '1 day',
  status: 'draft',
  stops: [{ name: '', description: '', duration: '', order: 1 }],
};

function ItinerariesTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Itinerary | null>(null);
  const [form, setForm] = useState<ItineraryFormState>(EMPTY_ITINERARY);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'lifestyle-itineraries', statusFilter],
    queryFn: async () => {
      const res = await adminApi.getItineraries(statusFilter);
      if (!res.success) throw new Error(res.message || 'Failed to load itineraries');
      return res.data ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'lifestyle-itineraries'] });

  const createMutation = useMutation({
    mutationFn: adminApi.createItinerary,
    onSuccess: () => {
      setShowForm(false);
      setForm(EMPTY_ITINERARY);
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError((e as Error).message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Parameters<typeof adminApi.updateItinerary>[1]) =>
      adminApi.updateItinerary(id, data),
    onSuccess: () => {
      setEditTarget(null);
      setForm(EMPTY_ITINERARY);
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError((e as Error).message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteItinerary,
    onSuccess: invalidate,
    onError: (e) => setFormError((e as Error).message || 'Delete failed'),
  });

  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const openEdit = (row: Itinerary) => {
    setEditTarget(row);
    setShowForm(true);
    setFormError(null);
    setForm({
      title: row.title,
      description: row.description,
      city: row.city,
      duration: row.duration,
      status: row.status,
      stops: (row.stops ?? []).map((s) => ({
        name: s.name,
        description: s.description,
        duration: s.duration,
        order: s.order,
      })),
    });
  };

  const submit = () => {
    setFormError(null);
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.city.trim() ||
      !form.duration.trim()
    ) {
      setFormError('Title, description, city, and duration are required');
      return;
    }
    if (
      form.stops.length === 0 ||
      form.stops.some((s) => !s.name.trim() || !s.description.trim())
    ) {
      setFormError('Every stop needs a name and description');
      return;
    }
    const stops = form.stops.map((s, i) => ({ ...s, order: i + 1 }));
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, ...form, stops });
    } else {
      createMutation.mutate({ ...form, stops });
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 180 }}
        >
          {['all', 'draft', 'published', 'archived'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditTarget(null);
            setForm(EMPTY_ITINERARY);
            setFormError(null);
          }}
          style={primaryBtn}
        >
          <Icon name={showForm ? 'x' : 'plus'} size={14} /> {showForm ? 'Cancel' : 'New itinerary'}
        </button>
      </div>

      {formError && (
        <p style={{ color: 'var(--admin-red)', fontSize: 13, marginBottom: 12 }}>{formError}</p>
      )}

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            {editTarget ? `Edit "${editTarget.title}"` : 'New itinerary'}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <Field label="Title *">
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="City *">
              <input
                style={inputStyle}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Duration *">
              <input
                style={inputStyle}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="e.g. 1 day"
              />
            </Field>
            <Field label="Status">
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {['draft', 'published', 'archived'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description *">
            <textarea
              rows={2}
              style={{ ...inputStyle, marginBottom: 12, resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px' }}>
            Stops (in order):
          </p>
          {form.stops.map((stop, i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}
            >
              <input
                style={{ ...inputStyle, width: 200 }}
                placeholder="Stop name"
                value={stop.name}
                onChange={(e) => {
                  const stops = form.stops.map((s, si) =>
                    si === i ? { ...s, name: e.target.value } : s
                  );
                  setForm({ ...form, stops });
                }}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="What happens here"
                value={stop.description}
                onChange={(e) => {
                  const stops = form.stops.map((s, si) =>
                    si === i ? { ...s, description: e.target.value } : s
                  );
                  setForm({ ...form, stops });
                }}
              />
              <input
                style={{ ...inputStyle, width: 110 }}
                placeholder="Duration"
                value={stop.duration}
                onChange={(e) => {
                  const stops = form.stops.map((s, si) =>
                    si === i ? { ...s, duration: e.target.value } : s
                  );
                  setForm({ ...form, stops });
                }}
              />
              <button
                onClick={() => setForm({ ...form, stops: form.stops.filter((_, j) => j !== i) })}
                disabled={form.stops.length === 1}
                style={{
                  ...primaryBtn,
                  background: 'transparent',
                  border: '1px solid var(--admin-red)',
                  color: 'var(--admin-red)',
                  padding: '6px 10px',
                }}
                title="Remove stop"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              onClick={() =>
                setForm({
                  ...form,
                  stops: [
                    ...form.stops,
                    { name: '', description: '', duration: '', order: form.stops.length + 1 },
                  ],
                })
              }
              style={{
                ...primaryBtn,
                background: 'transparent',
                border: '1px solid var(--admin-card)',
                color: 'var(--admin-text)',
              }}
            >
              <Icon name="plus" size={14} /> Add stop
            </button>
            <button onClick={submit} disabled={busy} style={primaryBtn}>
              {editTarget ? 'Save changes' : 'Create itinerary'}
            </button>
          </div>
        </div>
      )}

      {isError ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            background: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
          }}
        >
          <strong>Failed to load itineraries.</strong> {(error as Error)?.message}
        </div>
      ) : isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          No itineraries yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', gap: 16 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <strong style={{ fontSize: 15 }}>{row.title}</strong>
                  <StatusBadge status={row.status} />
                  <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    {row.city} · {row.duration} · ★ {row.rating.toFixed(1)}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '0 0 6px' }}>
                  {row.description}
                </p>
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: 0 }}>
                  {row.stops?.length ?? 0} stop(s):{' '}
                  {(row.stops ?? []).map((s) => s.name).join(' → ') || '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <button
                  onClick={() => openEdit(row)}
                  style={{
                    ...primaryBtn,
                    background: 'transparent',
                    border: '1px solid var(--admin-card)',
                    color: 'var(--admin-text)',
                    padding: '6px 10px',
                  }}
                  title="Edit"
                >
                  <Icon name="edit" size={14} />
                </button>
                <ConfirmDeleteButton
                  onConfirm={() => deleteMutation.mutate(row.id)}
                  label={`"${row.title}"`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Neighborhoods tab ───────────────────────────────────────────────────────

interface NeighborhoodFormState {
  name: string;
  city: string;
  description: string;
  status: string;
  places: Array<{ name: string; category: string; rating: string; address: string }>;
}

const EMPTY_NEIGHBORHOOD: NeighborhoodFormState = {
  name: '',
  city: 'Lagos',
  description: '',
  status: 'draft',
  places: [],
};

function NeighborhoodsTab() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Neighborhood | null>(null);
  const [form, setForm] = useState<NeighborhoodFormState>(EMPTY_NEIGHBORHOOD);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'lifestyle-neighborhoods', statusFilter],
    queryFn: async () => {
      const res = await adminApi.getNeighborhoods(statusFilter);
      if (!res.success) throw new Error(res.message || 'Failed to load neighborhoods');
      return res.data ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'lifestyle-neighborhoods'] });

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      city: string;
      description: string;
      status: string;
      places: Array<{ name: string; category: string; rating: number; address?: string }>;
    }) => adminApi.createNeighborhood(data),
    onSuccess: () => {
      setShowForm(false);
      setForm(EMPTY_NEIGHBORHOOD);
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError((e as Error).message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Parameters<typeof adminApi.updateNeighborhood>[1]) =>
      adminApi.updateNeighborhood(id, data),
    onSuccess: () => {
      setEditTarget(null);
      setForm(EMPTY_NEIGHBORHOOD);
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError((e as Error).message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteNeighborhood,
    onSuccess: invalidate,
    onError: (e) => setFormError((e as Error).message || 'Delete failed'),
  });

  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const openEdit = (row: Neighborhood) => {
    setEditTarget(row);
    setShowForm(true);
    setFormError(null);
    setForm({
      name: row.name,
      city: row.city,
      description: row.description,
      status: row.status,
      places: (row.places ?? []).map((p) => ({
        name: p.name,
        category: p.category,
        rating: String(p.rating),
        address: p.address ?? '',
      })),
    });
  };

  const submit = () => {
    setFormError(null);
    if (!form.name.trim() || !form.city.trim() || !form.description.trim()) {
      setFormError('Name, city, and description are required');
      return;
    }
    const places = form.places
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        category: p.category.trim() || 'Landmark',
        rating: Number(p.rating) || 0,
        address: p.address.trim() || undefined,
      }));
    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      description: form.description.trim(),
      status: form.status,
      places,
    };
    if (editTarget) updateMutation.mutate({ id: editTarget.id, ...payload });
    else createMutation.mutate(payload);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 180 }}
        >
          {['all', 'draft', 'published', 'archived'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditTarget(null);
            setForm(EMPTY_NEIGHBORHOOD);
            setFormError(null);
          }}
          style={primaryBtn}
        >
          <Icon name={showForm ? 'x' : 'plus'} size={14} />{' '}
          {showForm ? 'Cancel' : 'New neighborhood'}
        </button>
      </div>

      {formError && (
        <p style={{ color: 'var(--admin-red)', fontSize: 13, marginBottom: 12 }}>{formError}</p>
      )}

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            {editTarget ? `Edit "${editTarget.name}"` : 'New neighborhood'}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <Field label="Name *">
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="City *">
              <input
                style={inputStyle}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {['draft', 'published', 'archived'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description *">
            <textarea
              rows={2}
              style={{ ...inputStyle, marginBottom: 12, resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '0 0 6px' }}>
            Places (optional):
          </p>
          {form.places.map((place, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                style={{ ...inputStyle, width: 200 }}
                placeholder="Place name"
                value={place.name}
                onChange={(e) => {
                  const places = form.places.map((p, pi) =>
                    pi === i ? { ...p, name: e.target.value } : p
                  );
                  setForm({ ...form, places });
                }}
              />
              <input
                style={{ ...inputStyle, width: 140 }}
                placeholder="Category"
                value={place.category}
                onChange={(e) => {
                  const places = form.places.map((p, pi) =>
                    pi === i ? { ...p, category: e.target.value } : p
                  );
                  setForm({ ...form, places });
                }}
              />
              <input
                style={{ ...inputStyle, width: 80 }}
                placeholder="Rating"
                value={place.rating}
                onChange={(e) => {
                  const places = form.places.map((p, pi) =>
                    pi === i ? { ...p, rating: e.target.value } : p
                  );
                  setForm({ ...form, places });
                }}
              />
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Address"
                value={place.address}
                onChange={(e) => {
                  const places = form.places.map((p, pi) =>
                    pi === i ? { ...p, address: e.target.value } : p
                  );
                  setForm({ ...form, places });
                }}
              />
              <button
                onClick={() => setForm({ ...form, places: form.places.filter((_, j) => j !== i) })}
                style={{
                  ...primaryBtn,
                  background: 'transparent',
                  border: '1px solid var(--admin-red)',
                  color: 'var(--admin-red)',
                  padding: '6px 10px',
                }}
                title="Remove place"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              onClick={() =>
                setForm({
                  ...form,
                  places: [...form.places, { name: '', category: '', rating: '', address: '' }],
                })
              }
              style={{
                ...primaryBtn,
                background: 'transparent',
                border: '1px solid var(--admin-card)',
                color: 'var(--admin-text)',
              }}
            >
              <Icon name="plus" size={14} /> Add place
            </button>
            <button onClick={submit} disabled={busy} style={primaryBtn}>
              {editTarget ? 'Save changes' : 'Create neighborhood'}
            </button>
          </div>
        </div>
      )}

      {isError ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            background: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
          }}
        >
          <strong>Failed to load neighborhoods.</strong> {(error as Error)?.message}
        </div>
      ) : isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          No neighborhoods yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', gap: 16 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <strong style={{ fontSize: 15 }}>{row.name}</strong>
                  <StatusBadge status={row.status} />
                  <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{row.city}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '0 0 6px' }}>
                  {row.description}
                </p>
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: 0 }}>
                  {row.places?.length ?? 0} place(s):{' '}
                  {(row.places ?? []).map((p) => p.name).join(', ') || '—'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <button
                  onClick={() => openEdit(row)}
                  style={{
                    ...primaryBtn,
                    background: 'transparent',
                    border: '1px solid var(--admin-card)',
                    color: 'var(--admin-text)',
                    padding: '6px 10px',
                  }}
                  title="Edit"
                >
                  <Icon name="edit" size={14} />
                </button>
                <ConfirmDeleteButton
                  onConfirm={() => deleteMutation.mutate(row.id)}
                  label={`"${row.name}"`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Partners tab ────────────────────────────────────────────────────────────

interface PartnerFormState {
  name: string;
  category: string;
  city: string;
  description: string;
  rating: string;
  address: string;
  phone: string;
  status: string;
}

const EMPTY_PARTNER: PartnerFormState = {
  name: '',
  category: '',
  city: 'Lagos',
  description: '',
  rating: '',
  address: '',
  phone: '',
  status: 'draft',
};

function PartnersTab({ onManageOffers }: { onManageOffers: (partner: Partner) => void }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [form, setForm] = useState<PartnerFormState>(EMPTY_PARTNER);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'lifestyle-partners', statusFilter],
    queryFn: async () => {
      const res = await adminApi.getPartners(statusFilter);
      if (!res.success) throw new Error(res.message || 'Failed to load partners');
      return res.data ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'lifestyle-partners'] });

  const createMutation = useMutation({
    mutationFn: adminApi.createPartner,
    onSuccess: () => {
      setShowForm(false);
      setForm(EMPTY_PARTNER);
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError((e as Error).message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof adminApi.updatePartner>[1]) =>
      adminApi.updatePartner(id, data),
    onSuccess: () => {
      setEditTarget(null);
      setForm(EMPTY_PARTNER);
      setFormError(null);
      invalidate();
    },
    onError: (e) => setFormError((e as Error).message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deletePartner,
    onSuccess: invalidate,
    onError: (e) => setFormError((e as Error).message || 'Delete failed'),
  });

  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const openEdit = (row: Partner) => {
    setEditTarget(row);
    setShowForm(true);
    setFormError(null);
    setForm({
      name: row.name,
      category: row.category,
      city: row.city,
      description: row.description,
      rating: String(row.rating),
      address: row.address ?? '',
      phone: row.phone ?? '',
      status: row.status,
    });
  };

  const submit = () => {
    setFormError(null);
    if (
      !form.name.trim() ||
      !form.category.trim() ||
      !form.city.trim() ||
      !form.description.trim()
    ) {
      setFormError('Name, category, city, and description are required');
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      city: form.city.trim(),
      description: form.description.trim(),
      rating: Number(form.rating) || 0,
      address: form.address.trim() || undefined,
      phone: form.phone.trim() || undefined,
      status: form.status,
    };
    if (editTarget) updateMutation.mutate({ id: editTarget.id, ...payload });
    else createMutation.mutate(payload);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: 180 }}
        >
          {['all', 'draft', 'published', 'archived'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditTarget(null);
            setForm(EMPTY_PARTNER);
            setFormError(null);
          }}
          style={primaryBtn}
        >
          <Icon name={showForm ? 'x' : 'plus'} size={14} /> {showForm ? 'Cancel' : 'New partner'}
        </button>
      </div>

      {formError && (
        <p style={{ color: 'var(--admin-red)', fontSize: 13, marginBottom: 12 }}>{formError}</p>
      )}

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            {editTarget ? `Edit "${editTarget.name}"` : 'New partner'}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <Field label="Name *">
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Category *">
              <input
                style={inputStyle}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Dining, Wellness, Transport…"
              />
            </Field>
            <Field label="City *">
              <input
                style={inputStyle}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Rating (0–5)">
              <input
                style={inputStyle}
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {['draft', 'published', 'archived'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description *">
            <textarea
              rows={2}
              style={{ ...inputStyle, marginBottom: 10, resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label="Address">
              <input
                style={inputStyle}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                style={inputStyle}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
          </div>
          <button onClick={submit} disabled={busy} style={primaryBtn}>
            {editTarget ? 'Save changes' : 'Create partner'}
          </button>
        </div>
      )}

      {isError ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            background: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
          }}
        >
          <strong>Failed to load partners.</strong> {(error as Error)?.message}
        </div>
      ) : isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          No partners yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', gap: 16 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <strong style={{ fontSize: 15 }}>{row.name}</strong>
                  <StatusBadge status={row.status} />
                  <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    {row.category} · {row.city} · ★ {row.rating.toFixed(1)}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '0 0 6px' }}>
                  {row.description}
                </p>
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: 0 }}>
                  {row.offers?.length ?? 0} offer(s)
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <button
                  onClick={() => onManageOffers(row)}
                  style={{
                    ...primaryBtn,
                    background: 'transparent',
                    border: '1px solid var(--admin-card)',
                    color: 'var(--admin-text)',
                    padding: '6px 10px',
                  }}
                  title="Manage offers"
                >
                  <Icon name="gift" size={14} />
                </button>
                <button
                  onClick={() => openEdit(row)}
                  style={{
                    ...primaryBtn,
                    background: 'transparent',
                    border: '1px solid var(--admin-card)',
                    color: 'var(--admin-text)',
                    padding: '6px 10px',
                  }}
                  title="Edit"
                >
                  <Icon name="edit" size={14} />
                </button>
                <ConfirmDeleteButton
                  onConfirm={() => deleteMutation.mutate(row.id)}
                  label={`"${row.name}" (and all its offers)`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Offers tab ──────────────────────────────────────────────────────────────

interface OfferFormState {
  partnerId: string;
  title: string;
  description: string;
  discount: string;
  category: string;
  terms: string;
  validUntil: string;
  status: string;
}

const EMPTY_OFFER: OfferFormState = {
  partnerId: '',
  title: '',
  description: '',
  discount: '',
  category: '',
  terms: '',
  validUntil: '',
  status: 'active',
};

function OffersTab({
  partners,
  preselectedPartnerId,
}: {
  partners: Partner[];
  preselectedPartnerId?: string;
}) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<PartnerOffer | null>(null);
  const [form, setForm] = useState<OfferFormState>({
    ...EMPTY_OFFER,
    partnerId: preselectedPartnerId ?? '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: rows = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'lifestyle-offers', statusFilter],
    queryFn: async () => {
      const res = await adminApi.getOffers(statusFilter);
      if (!res.success) throw new Error(res.message || 'Failed to load offers');
      return res.data ?? [];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'lifestyle-offers'] });
  const invalidatePartners = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'lifestyle-partners'] });

  const createMutation = useMutation({
    mutationFn: (input: {
      partnerId: string;
      title: string;
      description: string;
      discount: string;
      category: string;
      terms: string[];
      validUntil: string;
      status: string;
    }) => {
      if (!input.partnerId) throw new Error('Select a partner');
      const { partnerId, ...data } = input;
      return adminApi.createOffer(partnerId, data);
    },
    onSuccess: () => {
      setShowForm(false);
      setForm(EMPTY_OFFER);
      setFormError(null);
      invalidate();
      invalidatePartners();
    },
    onError: (e) => setFormError((e as Error).message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof adminApi.updateOffer>[1]) =>
      adminApi.updateOffer(id, data),
    onSuccess: () => {
      setEditTarget(null);
      setForm(EMPTY_OFFER);
      setFormError(null);
      invalidate();
      invalidatePartners();
    },
    onError: (e) => setFormError((e as Error).message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteOffer,
    onSuccess: () => {
      invalidate();
      invalidatePartners();
    },
    onError: (e) => setFormError((e as Error).message || 'Delete failed'),
  });

  const busy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const openCreate = (partnerId?: string) => {
    setEditTarget(null);
    setShowForm(true);
    setFormError(null);
    setForm({ ...EMPTY_OFFER, partnerId: partnerId ?? form.partnerId });
  };

  const openEdit = (row: PartnerOffer) => {
    setEditTarget(row);
    setShowForm(true);
    setFormError(null);
    setForm({
      partnerId: row.partnerId,
      title: row.title,
      description: row.description,
      discount: row.discount,
      category: row.category,
      terms: row.terms.join('\n'),
      validUntil: row.validUntil.slice(0, 10),
      status: row.status,
    });
  };

  const submit = () => {
    setFormError(null);
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.discount.trim() ||
      !form.category.trim()
    ) {
      setFormError('Title, description, discount, and category are required');
      return;
    }
    if (!editTarget && !form.partnerId) {
      setFormError('Select a partner for this offer');
      return;
    }
    if (!form.validUntil) {
      setFormError('Valid-until date is required');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      discount: form.discount.trim(),
      category: form.category.trim(),
      terms: form.terms
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean),
      validUntil: new Date(`${form.validUntil}T23:59:59`).toISOString(),
      status: form.status,
    };
    if (editTarget) updateMutation.mutate({ id: editTarget.id, ...payload });
    else createMutation.mutate({ partnerId: form.partnerId, ...payload });
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ ...inputStyle, width: 180 }}
          >
            {['all', 'active', 'expired', 'archived'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={form.partnerId}
            onChange={(e) => openCreate(e.target.value)}
            style={{ ...inputStyle, width: 240 }}
            title="Create an offer under a specific partner"
          >
            <option value="">+ New offer for partner…</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formError && (
        <p style={{ color: 'var(--admin-red)', fontSize: 13, marginBottom: 12 }}>{formError}</p>
      )}

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            {editTarget ? `Edit "${editTarget.title}"` : 'New offer'}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            {!editTarget && (
              <Field label="Partner *">
                <select
                  style={inputStyle}
                  value={form.partnerId}
                  onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
                >
                  <option value="">Select partner…</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Title *">
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Discount *">
              <input
                style={inputStyle}
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="20% OFF"
              />
            </Field>
            <Field label="Category *">
              <input
                style={inputStyle}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
            <Field label="Valid until *">
              <input
                type="date"
                style={inputStyle}
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                style={inputStyle}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {['active', 'expired', 'archived'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description *">
            <textarea
              rows={2}
              style={{ ...inputStyle, marginBottom: 10, resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Terms (one per line)">
            <textarea
              rows={3}
              style={{ ...inputStyle, marginBottom: 12, resize: 'vertical' }}
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
            />
          </Field>
          <button onClick={submit} disabled={busy} style={primaryBtn}>
            {editTarget ? 'Save changes' : 'Create offer'}
          </button>
        </div>
      )}

      {isError ? (
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--admin-red)',
            background: 'rgba(204,28,28,0.1)',
            color: 'var(--admin-red)',
          }}
        >
          <strong>Failed to load offers.</strong> {(error as Error)?.message}
        </div>
      ) : isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : rows.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          No offers yet.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', gap: 16 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <strong style={{ fontSize: 15 }}>{row.title}</strong>
                  <StatusBadge status={row.status} />
                  <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                    {row.discount} · {row.partner?.name ?? '—'}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: '0 0 6px' }}>
                  {row.description}
                </p>
                <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: 0 }}>
                  Valid until {new Date(row.validUntil).toLocaleDateString()} · {row.terms.length}{' '}
                  term(s)
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <button
                  onClick={() => openEdit(row)}
                  style={{
                    ...primaryBtn,
                    background: 'transparent',
                    border: '1px solid var(--admin-card)',
                    color: 'var(--admin-text)',
                    padding: '6px 10px',
                  }}
                  title="Edit"
                >
                  <Icon name="edit" size={14} />
                </button>
                <ConfirmDeleteButton
                  onConfirm={() => deleteMutation.mutate(row.id)}
                  label={`"${row.title}"`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page shell ──────────────────────────────────────────────────────────────

export default function LifestyleGuidesPage() {
  const [tab, setTab] = useState<Catalog>('itineraries');
  const [offersPartner, setOffersPartner] = useState<Partner | null>(null);

  const { data: partners = [] } = useQuery({
    queryKey: ['admin', 'lifestyle-partners', 'all'],
    queryFn: async () => {
      const res = await adminApi.getPartners();
      return requireData(res, []);
    },
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Icon name="sprout" size={28} color="var(--admin-emerald)" />
          <span>Lifestyle Guides</span>
        </h1>
        <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>
          Manage the 9TLIFE catalogs — itineraries, neighborhoods, partners, and offers. Only
          published/active rows appear on the public pages.
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: '1px solid var(--admin-card)',
          paddingBottom: 0,
        }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--admin-orange)' : '2px solid transparent',
              color: tab === t ? 'var(--admin-text)' : 'var(--admin-text-muted)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'itineraries' && <ItinerariesTab />}
      {tab === 'neighborhoods' && <NeighborhoodsTab />}
      {tab === 'partners' && (
        <PartnersTab
          onManageOffers={(partner) => {
            setOffersPartner(partner);
            setTab('offers');
          }}
        />
      )}
      {tab === 'offers' && (
        <OffersTab
          partners={partners}
          preselectedPartnerId={offersPartner?.id}
          key={offersPartner?.id ?? 'none'}
        />
      )}
      {offersPartner && tab === 'offers' && (
        <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 8 }}>
          Jumped here from partner "{offersPartner.name}" — use the partner selector above to add an
          offer for it.
        </p>
      )}
    </div>
  );
}
