'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface DraftContent {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  type: string;
  duration?: number;
  lastEdited: string;
  status: string;
  updatedAt: string;
}

export default function DraftsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadDrafts();
  }, [authLoading, isAuthenticated, user, router]);

  const loadDrafts = async () => {
    try {
      const response = await apiFetch<any>('/v1/content/me?status=draft');
      if (response.success && response.data) {
        const items = Array.isArray(response.data) ? response.data : response.data.items || [];
        setDrafts(
          items.map((item: any) => ({
            id: String(item.id),
            title: String(item.title || ''),
            description: String(item.description || ''),
            thumbnail: String(item.thumbnail || ''),
            type: String(item.contentType || item.type || 'video'),
            duration: Number(item.duration || 0),
            lastEdited: String(item.updatedAt || item.lastEdited || ''),
            updatedAt: String(item.updatedAt || ''),
            status: String(item.status || 'draft'),
          }))
        );
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft?')) return;
    try {
      await api.content.deleteContent(id);
      setDrafts(drafts.filter((d) => d.id !== id));
    } catch {
      /* ignore */
    }
  };

  if (authLoading || (!isAuthenticated && !user)) return <></>;

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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Drafts</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>
            Continue editing your unpublished content
          </p>
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
        ) : drafts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>No drafts yet</h3>
            <p style={{ color: '#9A8A7A', marginBottom: 24 }}>
              Start creating content to see your drafts here
            </p>
            <a
              href="/creator/content-manager"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                borderRadius: 999,
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create Content
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="az-glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                {draft.thumbnail && (
                  <img
                    src={draft.thumbnail}
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
                  <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{draft.title}</h3>
                  <p style={{ color: '#9A8A7A', fontSize: 13 }}>
                    Last edited {new Date(draft.lastEdited).toLocaleDateString()}
                    {draft.duration ? ` · ${Math.floor(draft.duration / 60)}m` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a
                    href={`/creator/upload?edit=${draft.id}`}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 999,
                      background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14,
                      textDecoration: 'none',
                    }}
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: '1px solid #CC1C1C',
                      background: 'transparent',
                      color: '#CC1C1C',
                      fontWeight: 500,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
