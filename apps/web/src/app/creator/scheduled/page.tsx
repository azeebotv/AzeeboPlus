'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { OptimizedImage } from '@/components/OptimizedImage';

interface ScheduledContent {
  id: string;
  title: string;
  thumbnail: string;
  type: string;
  contentType?: string;
  scheduledAt: string;
  status: string;
}

export default function ScheduledPage(): React.JSX.Element {
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

  const {
    data: scheduled = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['creator', 'scheduled'],
    queryFn: async () => {
      const response = await apiFetch<ScheduledContent[] | { items?: ScheduledContent[] }>(
        '/v1/creator/scheduled'
      );
      if (response.success && response.data) {
        const items: ScheduledContent[] = Array.isArray(response.data)
          ? response.data
          : (response.data as { items?: ScheduledContent[] }).items || [];
        return items.map((item: ScheduledContent) => ({
          id: String(item.id),
          title: String(item.title || ''),
          thumbnail: String(item.thumbnail || ''),
          type: String(item.contentType || item.type || 'video'),
          scheduledAt: String(item.scheduledAt || ''),
          status: String(item.status || 'scheduled'),
        }));
      }
      return [];
    },
    enabled: isEnabled,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => {
      const formData = new FormData();
      formData.append('status', 'draft');
      return apiFetch(`/v1/content/${id}`, { method: 'PATCH', body: formData });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['creator', 'scheduled'] }),
  });

  if (authLoading) return <></>;
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
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Scheduled Content</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Content queued for automatic publishing
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
        ) : error ? (
          <ErrorState
            title="Failed to load scheduled content"
            description="Please try again later"
            onButtonPress={() => router.refresh()}
          />
        ) : scheduled.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}></div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>No scheduled content</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Schedule content to have it go live automatically
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scheduled.map((item: ScheduledContent) => (
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
                  <OptimizedImage
                    src={item.thumbnail}
                    alt={item.title}
                    width={120}
                    height={68}
                    className="object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Scheduled for {new Date(item.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setConfirmDialog({
                      open: true,
                      title: 'Cancel Scheduled Content',
                      message: 'Are you sure you want to cancel this scheduled content?',
                      destructive: true,
                      onConfirm: () => {
                        setConfirmDialog((prev) => ({ ...prev, open: false }));
                        cancelMutation.mutate(item.id);
                      },
                    });
                  }}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 999,
                    border: '1px solid var(--brand-red)',
                    background: 'transparent',
                    color: 'var(--brand-red)',
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
