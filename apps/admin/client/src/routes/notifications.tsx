import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { NotificationTemplate } from '@/lib/admin-types';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'email' as string, subject: '', content: '' });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: async () => {
      const res = await adminApi.getNotificationTemplates();
      return res.success ? (res.data as NotificationTemplate[]) : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createNotificationTemplate(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      setShowForm(false);
      setForm({ name: '', type: 'email', subject: '', content: '' });
    },
  });

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Notifications</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>{templates.length} templates</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Create Template
        </button>
      </div>

      {showForm && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: '1px solid #2A1A1A',
            backgroundColor: 'rgba(26,10,10,0.8)',
            marginBottom: 24,
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Template</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Template name"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
              }}
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
              }}
            >
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="sms">SMS</option>
              <option value="in-app">In-App</option>
            </select>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Subject"
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
              }}
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Content"
              rows={4}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  background: 'transparent',
                  color: '#9A8A7A',
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
        <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 40 }}>Loading...</p>
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
                border: '1px solid #2A1A1A',
                backgroundColor: 'rgba(26,10,10,0.5)',
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{t.name}</h3>
                <p style={{ color: '#9A8A7A', fontSize: 13 }}>{t.subject}</p>
              </div>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: 'rgba(232,66,10,0.2)',
                  color: '#E8420A',
                  textTransform: 'capitalize',
                }}
              >
                {t.type}
              </span>
            </div>
          ))}
          {templates.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>No templates found</p>
          )}
        </div>
      )}
    </div>
  );
}
