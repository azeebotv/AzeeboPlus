'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';

interface PublishedContent {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  type: string;
  duration?: number;
  views: number;
  likes: number;
  publishedAt: string;
  status: string;
}

export default function PublishedPage(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState<PublishedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) { router.push('/auth/login'); return; }
    loadContent();
  }, [isAuthenticated, user, router]);

  const loadContent = async () => {
    try {
      const response = await api.content.getMyContent({ status: 'published' });
      if (response.success && response.data) {
        const items = Array.isArray(response.data) ? response.data : (response.data as any).items || [];
        setContent(items as PublishedContent[]);
      }
    } catch { /* ignore */ } finally { setIsLoading(false); }
  };

  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: '#1A0A0A', minHeight: '100vh', color: '#F5F0EB' }}>
      <AppHeader />
      <main style={{ paddingTop: 100, paddingBottom: 60, maxWidth: 1000, margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#9A8A7A', cursor: 'pointer', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>←</span> Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Published Content</h1>
          <p style={{ color: '#9A8A7A', marginTop: 4 }}>Manage your live content</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #2A1A1A', borderTopColor: '#E8420A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : content.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>No published content</h3>
            <p style={{ color: '#9A8A7A' }}>Your published videos will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {content.map(item => (
              <div key={item.id} className="az-glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
                {item.thumbnail && (
                  <img src={item.thumbnail} alt="" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                )}
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#9A8A7A' }}>
                    <span>{(item.views || 0).toLocaleString()} views</span>
                    <span>{(item.likes || 0).toLocaleString()} likes</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#6B5A4A', marginTop: 8 }}>
                    Published {new Date(item.publishedAt).toLocaleDateString()}
                  </p>
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
