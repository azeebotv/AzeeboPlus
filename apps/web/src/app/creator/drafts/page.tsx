'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, api } from '@/lib/api';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton } from '@azeebo/ui/web';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { OptimizedImage } from '@/components/OptimizedImage';
import { FileText, Edit3, Trash2, Plus, Film } from 'lucide-react';

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
        '/v1/creator/drafts'
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
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 14%, transparent)">
      <PageHero
        badge="Work in Progress"
        title="Unpublished Drafts"
        description="Resume working on story drafts, character profiles, and pending video uploads."
        actions={
          <motion.button
            type="button"
            onClick={() => router.push('/creator/upload')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="az-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Content
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
        ) : drafts.length === 0 ? (
          <div className="az-glass p-16 text-center border border-az-glass-border">
            <FileText className="w-12 h-12 text-az-ink/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-az-ink mb-2">No Drafts Stored</h3>
            <p className="text-xs text-az-ink/50 max-w-sm mx-auto mb-6">
              All your creations have either been published or not yet started.
            </p>
            <button
              type="button"
              onClick={() => router.push('/creator/upload')}
              className="az-btn-primary"
            >
              Start New Creation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft: DraftContent) => (
              <ScrollReveal key={draft.id}>
                <div className="az-glass p-4 sm:p-5 border border-az-glass-border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-20 sm:w-24 aspect-video rounded-xl bg-az-glass-fill relative overflow-hidden flex-shrink-0 border border-az-glass-border">
                      {draft.thumbnail ? (
                        <OptimizedImage
                          src={draft.thumbnail}
                          alt={draft.title}
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
                      <h3 className="text-sm font-bold text-az-ink truncate">{draft.title}</h3>
                      <p className="text-xs text-az-ink/40 mt-1">
                        Last edited {new Date(draft.lastEdited).toLocaleDateString()}
                        {draft.duration ? ` • ${Math.floor(draft.duration / 60)}m` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/creator/upload?edit=${draft.id}`)}
                      className="az-btn-primary flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Resume Edit
                    </button>
                    <button
                      type="button"
                      aria-label="Delete draft"
                      onClick={() => {
                        setConfirmDialog({
                          open: true,
                          title: 'Purge Draft',
                          message: 'Are you sure you want to permanently delete this draft?',
                          destructive: true,
                          onConfirm: () => {
                            setConfirmDialog((prev) => ({ ...prev, open: false }));
                            deleteMutation.mutate(draft.id);
                          },
                        });
                      }}
                      className="p-2 rounded-full bg-az-error-500/10 border border-az-error-500/20 text-az-error-400 hover:bg-az-error-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
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
