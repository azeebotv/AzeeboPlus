import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { BundlePassAdmin } from '@/lib/admin-types';

const TIER_COLORS: Record<string, string> = {
  standard: 'var(--admin-blue)',
  premium: 'var(--admin-purple)',
  ultimate: 'var(--admin-amber)',
};

const UNIVERSE_NAMES: Record<string, string> = {
  reality: 'Reality',
  comedy: 'Comedy',
  movies: 'Movies',
  creator: 'Creator',
  lifestyle: 'Lifestyle',
  sports: 'Sports',
  games: 'Games',
  vertical: 'Vertical',
};

export default function BundlePassesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BundlePassAdmin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    universeIds: '',
    price: '',
    originalPrice: '',
    discountPercent: '',
    duration: '30',
    tier: 'standard',
    isActive: true,
  });

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ['admin', 'bundle-passes'],
    queryFn: async () => {
      const res = await adminApi.getBundlePasses();
      return res.success ? (res.data as BundlePassAdmin[]) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createBundlePass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bundle-passes'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateBundlePass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bundle-passes'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBundlePass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bundle-passes'] });
      setDeleteConfirm(null);
    },
  });

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm({
      name: '',
      description: '',
      universeIds: '',
      price: '',
      originalPrice: '',
      discountPercent: '',
      duration: '30',
      tier: 'standard',
      isActive: true,
    });
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      universeIds: '',
      price: '',
      originalPrice: '',
      discountPercent: '',
      duration: '30',
      tier: 'standard',
      isActive: true,
    });
    setShowModal(true);
  }

  function openEdit(b: BundlePassAdmin) {
    setEditing(b);
    setForm({
      name: b.name,
      description: b.description,
      universeIds: b.universeIds.join(', '),
      price: String(b.price),
      originalPrice: String(b.originalPrice),
      discountPercent: String(b.discountPercent),
      duration: String(b.duration),
      tier: b.tier,
      isActive: b.isActive,
    });
    setShowModal(true);
  }

  function handleSubmit() {
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description,
      universeIds: form.universeIds
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean),
      price: parseFloat(form.price) || 0,
      originalPrice: parseFloat(form.originalPrice) || 0,
      discountPercent: parseInt(form.discountPercent) || 0,
      duration: parseInt(form.duration) || 30,
      tier: form.tier,
      isActive: form.isActive,
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
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Bundle Passes</h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>{bundles.length} bundles</p>
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
          + New Bundle
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bundles.map((b) => {
            const isDeleting = deleteConfirm === b.id;
            return (
              <div
                key={b.id}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: '1px solid var(--admin-surface)',
                  backgroundColor: 'rgba(26,10,10,0.5)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontWeight: 600, fontSize: 15 }}>{b.name}</h3>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'white',
                          backgroundColor: TIER_COLORS[b.tier] || 'var(--admin-grey)',
                        }}
                      >
                        {b.tier.toUpperCase()}
                      </span>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: b.isActive
                            ? 'rgba(13,59,46,0.2)'
                            : 'rgba(204,28,28,0.2)',
                          color: b.isActive ? 'var(--admin-green)' : 'var(--admin-red)',
                        }}
                      >
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginBottom: 4 }}>
                      {b.description}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      {b.universeIds.map((uid) => (
                        <span
                          key={uid}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            backgroundColor: 'rgba(154,138,122,0.15)',
                            color: 'var(--admin-text-muted)',
                          }}
                        >
                          {UNIVERSE_NAMES[uid] || uid}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 700, color: 'var(--admin-orange)', fontSize: 15 }}>
                        ₦{Number(b.price).toLocaleString()}/mo
                      </span>
                      <span
                        style={{ color: 'var(--admin-text-muted)', fontSize: 12, textDecoration: 'line-through' }}
                      >
                        ₦{Number(b.originalPrice).toLocaleString()}
                      </span>
                      <span style={{ color: 'var(--admin-green)', fontSize: 12, fontWeight: 600 }}>
                        {b.discountPercent}% off
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(b)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    {isDeleting ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => deleteMutation.mutate(b.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--admin-red)',
                            color: 'white',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: '1px solid var(--admin-surface)',
                            background: 'transparent',
                            color: 'var(--admin-text-muted)',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(b.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid rgba(204,28,28,0.3)',
                          background: 'transparent',
                          color: 'var(--admin-red)',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {bundles.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No bundles found</p>
          )}
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
              {editing ? 'Edit Bundle' : 'New Bundle'}
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
              <label style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
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
              <label style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}>
                Universes{' '}
                <span style={{ color: 'var(--admin-text-muted)' }}>
                  (comma-separated: reality, comedy, movies, ...)
                </span>
              </label>
              <input
                value={form.universeIds}
                onChange={(e) => setForm({ ...form, universeIds: e.target.value })}
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
                  style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}
                >
                  Bundle Price (NGN)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
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
                  style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}
                >
                  Original Price (NGN)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
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

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label
                  style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}
                >
                  Discount %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
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
                  style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}
                >
                  Duration (days)
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
                  style={{ display: 'block', fontSize: 13, color: 'var(--admin-text-muted)', marginBottom: 6 }}
                >
                  Tier
                </label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
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
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="ultimate">Ultimate</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: 'var(--admin-orange)' }}
                />
                <span style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>Active</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.name}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: !form.name
                    ? 'var(--admin-surface)'
                    : 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: !form.name ? 'var(--admin-grey)' : 'white',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: !form.name ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Saving...' : editing ? 'Update Bundle' : 'Create Bundle'}
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
