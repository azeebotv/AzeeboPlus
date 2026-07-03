'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function AdminNotificationsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'in-app' as 'email' | 'push' | 'sms' | 'in-app',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || user.role !== 'admin') return;
    loadNotifications();
  }, [authLoading, isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      const response = await api.admin.getNotificationTemplates();
      if (response.success && response.data) {
        const data = response.data as any;
        setNotifications(Array.isArray(data) ? data : data.items || []);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      await api.admin.createNotificationTemplate(form);
      setShowSend(false);
      setForm({ name: '', subject: '', content: '', type: 'in-app' });
      loadNotifications();
    } catch {
      /* ignore */
    }
  };

  return (
    <AdminLayout>
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
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Send and manage platform notifications</p>
        </div>
        <button
          onClick={() => setShowSend(!showSend)}
          className="az-btn-primary"
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            border: 'none',
            background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {showSend ? 'Cancel' : '+ Send Notification'}
        </button>
      </div>

      {showSend && (
        <div className="az-glass" style={{ padding: 24, borderRadius: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Send Notification</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Template Name"
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
              }}
            />
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Subject"
              style={{
                padding: '12px 16px',
                borderRadius: 12,
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
              rows={3}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid #2A1A1A',
                backgroundColor: '#0D0505',
                color: '#F5F0EB',
                fontSize: 14,
              }}
            >
              <option value="in-app">In-App</option>
              <option value="email">Email</option>
              <option value="push">Push</option>
              <option value="sms">SMS</option>
            </select>
            <button
              onClick={handleSend}
              disabled={!form.name || !form.content}
              className="az-btn-primary"
              style={{
                padding: '12px 0',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                opacity: !form.name || !form.content ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: '3px solid #2A1A1A',
              borderTopColor: '#E8420A',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n: any, i: number) => (
            <div key={i} className="az-glass" style={{ padding: 16, borderRadius: 16 }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
              >
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                    {n.name || n.title}
                  </h3>
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>{n.content || n.message}</p>
                </div>
                <span style={{ fontSize: 12, color: '#6B5A4A', flexShrink: 0 }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    backgroundColor: 'rgba(232,66,10,0.1)',
                    color: '#E8420A',
                  }}
                >
                  {n.type || 'in-app'}
                </span>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <p style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>
              No notifications sent yet
            </p>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
