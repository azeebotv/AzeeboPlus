import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { NotificationTemplate } from '@/lib/admin-types';
import { requireData, unwrapList } from '@/lib/payload';
import { Icon } from '@/components/Icons';

function getTypeStyle(type: string): { bg: string; color: string } {
  switch (type) {
    case 'email':
      return { bg: 'rgba(16,185,129,0.15)', color: 'var(--admin-emerald)' };
    case 'push':
      return { bg: 'rgba(232,66,10,0.15)', color: 'var(--admin-orange)' };
    case 'sms':
      return { bg: 'rgba(245,158,11,0.15)', color: 'var(--admin-amber)' };
    default:
      return { bg: 'rgba(107,114,128,0.15)', color: 'var(--admin-text-muted)' };
  }
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    type: 'email' as NotificationTemplate['type'],
    subject: '',
    content: '',
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin', 'announcements'],
    queryFn: async () => {
      const data = requireData(await adminApi.getNotificationTemplates(), []);
      return unwrapList<NotificationTemplate>(data).items;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createNotificationTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateNotificationTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNotificationTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      setDeleteConfirm(null);
    },
  });

  function closeModal() {
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', type: 'email', subject: '', content: '' });
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: '', type: 'email', subject: '', content: '' });
    setShowModal(true);
  }

  function openEdit(item: NotificationTemplate) {
    setEditing(item);
    setForm({ name: item.name, type: item.type, subject: item.subject, content: item.content });
    setShowModal(true);
  }

  function handleSubmit() {
    const payload = {
      name: form.name,
      type: form.type,
      subject: form.subject,
      content: form.content,
      template: form.content,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const types: NotificationTemplate['type'][] = ['email', 'push', 'sms', 'in-app'];

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
            <span>Announcements</span>
          </h1>
          <p style={{ color: 'var(--admin-text-muted)' }}>{announcements.length} announcements</p>
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
          <span>New Announcement</span>
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((a) => {
            const typeStyle = getTypeStyle(a.type);
            const isDeleting = deleteConfirm === a.id;
            return (
              <div
                key={a.id}
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
                      <h3 style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</h3>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          backgroundColor: typeStyle.bg,
                          color: typeStyle.color,
                        }}
                      >
                        {a.type}
                      </span>
                    </div>
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>{a.subject}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 12 }}>
                    <button
                      onClick={() => openEdit(a)}
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
                          onClick={() => deleteMutation.mutate(a.id)}
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
                        onClick={() => setDeleteConfirm(a.id)}
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
                <p style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>
                  Created: {new Date(a.createdAt).toLocaleDateString()}
                </p>
              </div>
            );
          })}
          {announcements.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>
              No announcements found
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
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {editing ? 'Edit Announcement' : 'New Announcement'}
            </h2>

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
                placeholder="Announcement name"
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
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as NotificationTemplate['type'] })
                }
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
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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
                Subject
              </label>
              <input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
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
                placeholder="Email subject line"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--admin-text-muted)',
                  marginBottom: 6,
                }}
              >
                Content
              </label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={5}
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
                placeholder="Announcement content"
              />
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
                {isPending ? 'Saving...' : editing ? 'Update Announcement' : 'Create Announcement'}
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
