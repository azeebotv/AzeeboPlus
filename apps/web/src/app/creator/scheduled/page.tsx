'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { OptimizedImage } from '@/components/OptimizedImage';
import { Calendar, Clock, Film, Plus } from 'lucide-react';

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
    refetch,
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
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 14%, transparent)">
      <PageHero
        badge="Premiere Queue"
        title="Scheduled Content"
        description="Titles queued for automated publication and platform-wide broadcast release."
        actions={
          <motion.button
            type="button"
            onClick={() => router.push('/creator/upload')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="az-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Schedule New Release
          </motion.button>
        }
      />

      <div className="max-w-4xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="az-glass p-5 border border-az-glass-border space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto py-12">
            <ErrorState
              title="Failed to load scheduled releases"
              description="Unable to sync the broadcast calendar."
              onButtonPress={() => refetch()}
            />
          </div>
        ) : scheduled.length === 0 ? (
          <div className="az-glass p-16 text-center border border-az-glass-border">
            <Calendar className="w-12 h-12 text-az-ink/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-az-ink mb-2">No Scheduled Premieres</h3>
            <p className="text-xs text-az-ink/50 max-w-sm mx-auto mb-6">
              Schedule content to air automatically at designated dates and times.
            </p>
            <button
              type="button"
              onClick={() => router.push('/creator/upload')}
              className="az-btn-primary"
            >
              Queue an Asset
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduled.map((item: ScheduledContent) => (
              <ScrollReveal key={item.id}>
                <div className="az-glass p-4 sm:p-5 border border-az-glass-border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-20 sm:w-24 aspect-video rounded-xl bg-az-glass-fill relative overflow-hidden flex-shrink-0 border border-az-glass-border">
                      {item.thumbnail ? (
                        <OptimizedImage
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-az-ink/30">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-az-ink truncate">{item.title}</h3>
                      <p className="text-xs text-az-warning-400 font-medium flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        Air date: {new Date(item.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDialog({
                          open: true,
                          title: 'Revert to Draft',
                          message:
                            'Cancel this scheduled premiere and move the asset back to draft state?',
                          destructive: true,
                          onConfirm: () => {
                            setConfirmDialog((prev) => ({ ...prev, open: false }));
                            cancelMutation.mutate(item.id);
                          },
                        });
                      }}
                      className="px-4 py-2 rounded-full border border-az-error-500/30 bg-az-error-500/10 text-az-error-400 hover:bg-az-error-500/20 text-xs font-bold transition-colors"
                    >
                      Cancel Schedule
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </PageShell>
  );
}
