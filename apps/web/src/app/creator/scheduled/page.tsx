'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface ScheduledContent {
  id: string;
  title: string;
  thumbnail: string;
  type: string;
  scheduledAt: string;
  status: string;
}

export default function ScheduledPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [scheduled, setScheduled] = useState<ScheduledContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadScheduled();
  }, [isAuthenticated, user, router]);

  const loadScheduled = async () => {
    try {
      const response = await api.content.getMyContent({ status: 'scheduled' });
      if (response.success && response.data) {
        const items = Array.isArray(response.data)
          ? response.data
          : (response.data as any).items || [];
        setScheduled(items as ScheduledContent[]);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this scheduled content?')) return;
    try {
      await api.content.updateContent(id, { status: 'draft' } as any);
      setScheduled(scheduled.filter((s) => s.id !== id));
    } catch {
      /* ignore */
    }
  };

  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main
        style={{
          paddingTop: 100,
          paddingBottom: 60,
          maxWidth: 1000,
          margin: '0 auto',
          padding: '100px 24px 60px',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              color: '#9A8A7A',
              cursor: 'pointer',
              fontSize: 14,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>←</span> Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Scheduled Content</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Content queued for automatic publishing</p>
        </div>

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
        ) : scheduled.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>No scheduled content</h3>
            <p style={{ color: '#9A8A7A' }}>Schedule content to have it go live automatically</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scheduled.map((item) => (
              <div
                key={item.id}
                className="az-glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt=""
                    style={{
                      width: 120,
                      height: 68,
                      objectFit: 'cover',
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.title}</h3>
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>
                    Scheduled for {new Date(item.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCancel(item.id)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 999,
                    border: '1px solid #CC1C1C',
                    background: 'transparent',
                    color: '#CC1C1C',
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
