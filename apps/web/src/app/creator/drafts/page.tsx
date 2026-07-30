'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, api } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { OptimizedImage } from '@/components/OptimizedImage';

interface DraftContent {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  type: string;
  contentType?: string;
  duration?: number;
  lastEdited: string;
  status: string;
  updatedAt: string;
}

export default function DraftsPage(): React.JSX.Element {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEnabled = !authLoading && !!isAuthenticated && !!user;
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['creator', 'drafts'],
    queryFn: async () => {
      const response = await apiFetch<DraftContent[] | { items?: DraftContent[] }>(
        '/v1/content/me?status=draft'
      );
      if (response.success && response.data) {
        const items: DraftContent[] = Array.isArray(response.data)
          ? response.data
          : (response.data as { items?: DraftContent[] }).items || [];
        return items.map((item: DraftContent) => ({
          id: String(item.id),
          title: String(item.title || ''),
          description: String(item.description || ''),
          thumbnail: String(item.thumbnail || ''),
          type: String(item.contentType || item.type || 'video'),
          duration: Number(item.duration || 0),
          lastEdited: String(item.updatedAt || item.lastEdited || ''),
          updatedAt: String(item.updatedAt || ''),
          status: String(item.status || 'draft'),
        }));
      }
      return [];
    },
    enabled: isEnabled,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.content.deleteContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'drafts'] }),
  });

  if (authLoading || (!isAuthenticated && !user)) return <></>;
  if (!isAuthenticated || !user) return <></>;

  return (
    <div style={{ backgroundColor: 'var(--brand-near-black)', minHeight: '100vh', color: 'var(--text-primary)' }}>
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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Drafts</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Continue editing your unpublished content
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="az-glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderRadius: 16,
                }}
              >
                <Skeleton width="120px" height="68px" borderRadius="8px" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height="16px" className="mb-2" />
                  <Skeleton width="40%" height="12px" />
                </div>
                <Skeleton width="80px" height="32px" borderRadius="999px" />
              </div>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>No drafts yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Start creating content to see your drafts here
            </p>
            <a
              href="/creator/content-manager"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
                borderRadius: 999,
                color: 'var(--brand-white)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Create Content
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {drafts.map((draft: DraftContent) => (
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
<OptimizedImage
                     src={draft.thumbnail}
                     alt={draft.title}
                     width={120}
                     height={68}
                     className="object-cover rounded-lg flex-shrink-0"
                   />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{draft.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
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
                      background: 'linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-red) 100%)',
                      color: 'var(--brand-white)',
                      fontWeight: 600,
                      fontSize: 14,
                      textDecoration: 'none',
                    }}
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        open: true,
                        title: 'Delete Draft',
                        message: 'Are you sure you want to delete this draft?',
                        destructive: true,
                        onConfirm: () => {
                          setConfirmDialog((prev) => ({ ...prev, open: false }));
                          deleteMutation.mutate(draft.id);
                        },
                      });
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: '1px solid var(--brand-red)',
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
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
