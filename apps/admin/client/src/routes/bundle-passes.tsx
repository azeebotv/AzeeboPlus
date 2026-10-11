import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { BundlePassAdmin, AdminUniverse } from '@/lib/admin-types';
import { assertSuccess, requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';
import QueryErrorBanner from '@/components/QueryErrorBanner';

const TIER_COLORS: Record<string, string> = {
  standard: 'var(--admin-blue)',
  premium: 'var(--admin-purple)',
  ultimate: 'var(--admin-amber)',
};

export default function BundlePassesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BundlePassAdmin | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    universeIds: [] as string[],
    price: '',
    originalPrice: '',
    discountPercent: '',
    duration: '30',
    tier: 'standard',
    isActive: true,
  });

  const {
    data: bundles = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin', 'bundle-passes'],
    queryFn: async () => {
      // requireData, not `res.success ? … : []`: a failed read must surface as a
      // query error, otherwise the page shows "No bundles found" while the service is down.
      const data = requireData(await adminApi.getBundlePasses(), []);
      return unwrapList<BundlePassAdmin>(data).items;
    },
  });

  // Real universe list for the multi-select (replaces the hardcoded map +
  // free-text comma input that let invalid ids through).
  const {
    data: universes = [],
    isError: universesError,
    error: universesFetchError,
    refetch: refetchUniverses,
    isFetching: universesFetching,
  } = useQuery({
    queryKey: ['admin', 'universes-for-bundles'],
    queryFn: async () => {
      const data = requireData(await adminApi.getAllUniverses(1, 100), []);
      // The universes endpoint paginates as { data: [...], meta } — not items.
      return unwrapList<AdminUniverse>(data, 'data').items;
    },
  });
  const universeName = (uid: string) => {
    const u = universes.find((x: AdminUniverse) => x.id === uid);
    return u?.displayName || u?.name || uid;
  };

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) =>
      assertSuccess(await adminApi.createBundlePass(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bundle-passes'] });
      closeModal();
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to create bundle'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      assertSuccess(await adminApi.updateBundlePass(id, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bundle-passes'] });
      closeModal();
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to update bundle'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => assertSuccess(await adminApi.deleteBundlePass(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bundle-passes'] });
      setDeleteConfirm(null);
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to delete bundle'),
  });

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setFormError('');
    setForm({
      name: '',
      description: '',
      universeIds: [],
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
    setFormError('');
    setForm({
      name: '',
      description: '',
      universeIds: [],
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
    setFormError('');
    setForm({
      name: b.name,
      description: b.description,
      universeIds: [...b.universeIds],
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
    setFormError('');
    // DTO parity: name/description/universeIds/price/originalPrice/
    // discountPercent/duration/tier are all required server-side.
    if (!form.name.trim()) return void setFormError('Name is required.');
    if (!form.description.trim()) return void setFormError('Description is required.');
    if (form.universeIds.length === 0) return void setFormError('Select at least one universe.');
    const price = Number(form.price);
    const originalPrice = Number(form.originalPrice);
    const discountPercent = Number(form.discountPercent);
    const duration = Number(form.duration);
    if (!Number.isFinite(price) || price < 0)
      return void setFormError('Price must be a non-negative number.');
    if (!Number.isFinite(originalPrice) || originalPrice < 0)
      return void setFormError('Original price must be a non-negative number.');
    if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100)
      return void setFormError('Discount must be between 0 and 100.');
    if (!Number.isFinite(duration) || duration < 1)
      return void setFormError('Duration must be at least 1 day.');
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      universeIds: form.universeIds,
      price,
      originalPrice,
      discountPercent,
      duration,
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
            <Icon name="package" size={28} color="var(--admin-orange)" />
            <span>Bundle Passes</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            {isError ? 'Bundle list unavailable' : `${bundles.length} bundles`}
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
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
          <Icon name="plus" size={16} />
          <span>New Bundle</span>
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : isError ? (
        <QueryErrorBanner
          title="Bundle list unavailable."
          body="The bundles below are unknown, not absent — retry before creating or deleting anything."
          detail={error?.message}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
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
                  border: '1px solid var(--admin-card)',
                  backgroundColor: 'var(--admin-surface)',
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
                          {universeName(uid)}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 700, color: 'var(--admin-orange)', fontSize: 15 }}>
                        ₦{Number(b.price).toLocaleString()}/mo
                      </span>
                      <span
                        style={{
                          color: 'var(--admin-text-muted)',
                          fontSize: 12,
                          textDecoration: 'line-through',
                        }}
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
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No bundles found
            </p>
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
                Universes <span style={{ color: 'var(--admin-red)' }}>*</span>
              </label>
              {universesError ? (
                <p style={{ color: 'var(--admin-red-light)', fontSize: 12 }}>
                  Universes could not be loaded, so this bundle cannot be assigned one.{' '}
                  {universesFetchError?.message}{' '}
                  <button
                    type="button"
                    onClick={() => void refetchUniverses()}
                    disabled={universesFetching}
                    style={{
                      border: 0,
                      background: 'transparent',
                      color: 'var(--admin-orange)',
                      cursor: universesFetching ? 'default' : 'pointer',
                      fontWeight: 600,
                      padding: 0,
                      fontSize: 12,
                    }}
                  >
                    {universesFetching ? 'Retrying…' : 'Retry'}
                  </button>
                </p>
              ) : universes.length === 0 ? (
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                  No universes exist yet — create one before building a bundle.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 8,
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid var(--admin-surface)',
                    backgroundColor: 'var(--admin-dark)',
                  }}
                >
                  {universes.map((u: AdminUniverse) => (
                    <label
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: 'var(--admin-text)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.universeIds.includes(u.id)}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            universeIds: e.target.checked
                              ? [...form.universeIds, u.id]
                              : form.universeIds.filter((id) => id !== u.id),
                          })
                        }
                      />
                      {u.displayName || u.name}
                    </label>
                  ))}
                </div>
              )}
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
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
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
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
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
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
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
                  style={{
                    display: 'block',
                    fontSize: 13,
                    color: 'var(--admin-text-muted)',
                    marginBottom: 6,
                  }}
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
