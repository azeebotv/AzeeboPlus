'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';

interface PublishedContent {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  type: string;
  contentType?: string;
  duration?: number;
  views: number;
  viewCount?: number;
  likes: number;
  likeCount?: number;
  publishedAt: string;
  createdAt: string;
  status: string;
}

export default function PublishedPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isEnabled = !authLoading && !!isAuthenticated && !!user;

  const {
    data: content = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'published'],
    queryFn: async () => {
      const response = await apiFetch<PublishedContent[] | { items?: PublishedContent[] }>(
        '/v1/content/me?status=published'
      );
      if (response.success && response.data) {
        const items: PublishedContent[] = Array.isArray(response.data)
          ? response.data
          : (response.data as { items?: PublishedContent[] }).items || [];
        return items.map((item: PublishedContent) => ({
          id: String(item.id),
          title: String(item.title || ''),
          description: String(item.description || ''),
          thumbnail: String(item.thumbnail || ''),
          type: String(item.contentType || item.type || 'video'),
          duration: Number(item.duration || 0),
          views: Number(item.viewCount ?? item.views ?? 0),
          likes: Number(item.likeCount ?? item.likes ?? 0),
          publishedAt: String(item.publishedAt || item.createdAt || ''),
          createdAt: String(item.createdAt || ''),
          status: String(item.status || 'published'),
        }));
      }
      return [];
    },
    enabled: isEnabled,
  });

  if (authLoading || (!isAuthenticated && !user)) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <div
      style={{
        backgroundColor: 'var(--brand-near-black)',
        minHeight: '100vh',
        color: 'var(--text-primary)',
      }}
    >
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
              color: 'var(--text-secondary)',
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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Published Content</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Manage your live content</p>
        </div>

        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="az-glass" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <Skeleton width="100%" height="160px" />
                <div style={{ padding: 16 }}>
                  <Skeleton width="80%" height="16px" className="mb-2" />
                  <Skeleton width="60%" height="12px" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load published content"
            description="Please try again later"
            onButtonPress={() => router.refresh()}
          />
        ) : content.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>No published content</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Your published videos will appear here</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {content.map((item: PublishedContent) => (
              <div
                key={item.id}
                className="az-glass"
                style={{ borderRadius: 16, overflow: 'hidden' }}
              >
                {item.thumbnail && (
                  <OptimizedImage
                    src={item.thumbnail}
                    alt={item.title}
                    width={400}
                    height={160}
                    className="object-cover"
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
                      gap: 16,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>{(item.views || 0).toLocaleString()} views</span>
                    <span>{(item.likes || 0).toLocaleString()} likes</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
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
