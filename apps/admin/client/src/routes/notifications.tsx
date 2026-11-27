import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { NotificationTemplate } from '@/lib/admin-types';
import { requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email' as string, content: '' });
  // Edit/delete were backend-supported but had no UI; edit reuses the form.
  const [editTarget, setEditTarget] = useState<NotificationTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: async () => {
      const data = requireData(await adminApi.getNotificationTemplates(), []);
      return unwrapList<NotificationTemplate>(data).items;
    },
  });

  // Delivery stats strip (GET /admin/notifications/stats — previously unused).
  const { data: stats } = useQuery({
    queryKey: ['admin', 'notification-stats'],
    queryFn: async () => {
      return requireData(await adminApi.getNotificationStats(), null);
    },
  });

  const resetForm = () => setForm({ name: '', type: 'email', content: '' });

  const createMutation = useMutation({
    // Backend contract is { name, type, body } — body becomes the stored
    // notification message; there is no separate subject column.
    mutationFn: () =>
      adminApi.createNotificationTemplate({
        name: form.name,
        type: form.type,
        body: form.content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      setShowForm(false);
      resetForm();
      setFormError(null);
    },
    onError: (e) => setFormError((e as Error).message || 'Create failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateNotificationTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      setShowForm(false);
      setEditTarget(null);
      resetForm();
      setFormError(null);
    },
    onError: (e) => setFormError((e as Error).message || 'Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNotificationTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
    onError: (e) => setFormError((e as Error).message || 'Delete failed'),
  });

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
            <Icon name="bell" size={28} color="var(--admin-orange)" />
            <span>Notifications</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>
            {templates.length} templates
            {stats
              ? ` · ${(stats as { totalSent?: number }).totalSent ?? 0} sent · ${((stats as { deliveryRate?: number }).deliveryRate ?? 0).toFixed(1)}% delivered`
              : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditTarget(null);
              resetForm();
            }
          }}
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
          <Icon name={showForm ? 'x' : 'plus'} size={16} />
          <span>{showForm ? 'Cancel' : 'Create Template'}</span>
        </button>
      </div>

      {showForm && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid var(--admin-card)',
            backgroundColor: 'var(--admin-surface)',
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
            {editTarget ? `Edit "${editTarget.name}"` : 'New Template'}
          </h3>
          {formError && (
            <p style={{ color: 'var(--admin-red)', fontSize: 13, marginBottom: 8 }}>{formError}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Template name"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
              }}
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
              }}
            >
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="sms">SMS</option>
              <option value="in-app">In-App</option>
            </select>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Content"
              rows={4}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid var(--admin-surface)',
                backgroundColor: 'var(--admin-dark)',
                color: 'var(--admin-text)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() =>
                  editTarget
                    ? updateMutation.mutate({ id: editTarget.id, data: form })
                    : createMutation.mutate()
                }
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {editTarget
                  ? updateMutation.isPending
                    ? 'Saving...'
                    : 'Save'
                  : createMutation.isPending
                    ? 'Creating...'
                    : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-surface)',
                  background: 'transparent',
                  color: 'var(--admin-text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                borderRadius: 16,
                border: '1px solid var(--admin-card)',
                backgroundColor: 'var(--admin-surface)',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{t.name}</h3>
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>{t.subject}</p>
              </div>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: 'rgba(232,66,10,0.2)',
                  color: 'var(--admin-orange)',
                  textTransform: 'capitalize',
                }}
              >
                {t.type}
              </span>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => {
                    setEditTarget(t);
                    setForm({
                      name: t.name,
                      type: t.type,
                      content: t.content ?? '',
                    });
                    setShowForm(true);
                    setFormError(null);
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--admin-surface)',
                    background: 'transparent',
                    color: 'var(--admin-text-muted)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                {deleteConfirm === t.id ? (
                  <>
                    <button
                      onClick={() => deleteMutation.mutate(t.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 6,
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
                        padding: '5px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--admin-surface)',
                        background: 'transparent',
                        color: 'var(--admin-text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(t.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(204,28,28,0.4)',
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
          ))}
          {templates.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No templates found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
