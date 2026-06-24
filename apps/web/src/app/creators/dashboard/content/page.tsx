'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

export default function DashboardContentPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    loadContent();
  }, [isAuthenticated, user, router]);

  const loadContent = async () => {
    try {
      const response = await api.content.getContentByCreator(user!.id);
      if (response.success && response.data) {
        const items = Array.isArray(response.data)
          ? response.data
          : (response.data as any).items || [];
        setContent(items);
      }
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = filter === 'all' ? content : content.filter((c) => c.status === filter);

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>My Content</h1>
            <p style={{ color: '#9A8A7A', marginTop: 4 }}>{content.length} total items</p>
          </div>
          <a
            href="/creator/upload"
            className="az-btn-primary"
            style={{
              padding: '10px 24px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            + Upload
          </a>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['all', 'published', 'draft', 'scheduled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                border: filter === f ? 'none' : '1px solid #2A1A1A',
                background:
                  filter === f
                    ? 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)'
                    : 'transparent',
                color: filter === f ? '#fff' : '#9A8A7A',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
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
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <h3 style={{ fontSize: 18 }}>No content found</h3>
            <p style={{ color: '#9A8A7A', marginTop: 8 }}>
              {filter === 'all'
                ? 'Upload your first content to get started'
                : `No ${filter} content`}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {filtered.map((item) => (
              <div
                key={item.id}
                className="az-glass"
                style={{ borderRadius: 16, overflow: 'hidden' }}
              >
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt=""
                    style={{ width: '100%', height: 160, objectFit: 'cover' }}
                  />
                )}
                <div style={{ padding: 16 }}>
                  <h3
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      marginBottom: 8,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#9A8A7A' }}>{item.views || 0} views</span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor:
                          item.status === 'published'
                            ? 'rgba(13,59,46,0.2)'
                            : item.status === 'draft'
                              ? 'rgba(154,138,122,0.2)'
                              : 'rgba(245,158,11,0.2)',
                        color:
                          item.status === 'published'
                            ? '#0D3B2E'
                            : item.status === 'draft'
                              ? '#9A8A7A'
                              : '#F59E0B',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
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
