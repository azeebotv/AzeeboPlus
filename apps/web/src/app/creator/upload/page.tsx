'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { createWebLogger } from '@/lib/logger';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { Skeleton } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UploadCloud, FileText, Tag, Globe, CheckCircle2 } from 'lucide-react';

const logger = createWebLogger('CreatorUpload');

interface ContentItem {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  status: 'draft' | 'processing' | 'published' | 'archived';
  contentType: 'video' | 'image' | 'audio';
  duration?: number;
  tags?: string[];
  universeId?: string;
  metadata?: Record<string, unknown>;
}

export default function CreatorUploadPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [universeId, setUniverseId] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: universes = [], isLoading: universesLoading } = useUniversesQuery();

  const editQuery = useQuery({
    queryKey: ['creator', 'content', editId],
    queryFn: async () => {
      if (!editId) return null;
      const res = await apiFetch<ContentItem>(`/v1/content/${editId}`);
      if (res.success && res.data) return res.data;
      return null;
    },
    enabled: !!editId,
  });

  const editContent = editQuery.data;

  useEffect(() => {
    if (editContent) {
      setTitle(editContent.title);
      setDescription(editContent.description || '');
      setUniverseId(editContent.universeId || '');
    }
  }, [editContent]);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiFetch<{ id: string }>('/v1/content', {
        method: 'POST',
        body: formData,
      });
      if (!res.success) throw new Error(res.message || 'Upload failed');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'content'] });
      router.push(data?.id ? '/creator' : '/creator');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContentItem> }) => {
      const res = await apiFetch<{ id: string }>(`/v1/content/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.success) throw new Error(res.message || 'Update failed');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'content'] });
      router.push(data?.id ? '/creator' : '/creator');
    },
  });

  const handleSubmit = async () => {
    if (!title.trim()) {
      setConfirmDialog({
        open: true,
        title: 'Title Required',
        message: 'Please enter a title for your content.',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false }),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editContent && file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (universeId) formData.append('universeId', universeId);
        if (tags) formData.append('tags', tags);
        formData.append('file', file);
        await updateMutation.mutateAsync({
          id: editContent.id,
          data: formData as unknown as Partial<ContentItem>,
        });
      } else if (editContent) {
        await updateMutation.mutateAsync({
          id: editContent.id,
          data: { title, description, universeId, tags: tags.split(',').map((t) => t.trim()) },
        });
      } else if (file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (universeId) formData.append('universeId', universeId);
        if (tags) formData.append('tags', tags);
        formData.append('file', file);
        await uploadMutation.mutateAsync(formData);
      } else {
        setConfirmDialog({
          open: true,
          title: 'File Required',
          message: 'Please select a file to upload.',
          onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false }),
        });
      }
    } catch (error) {
      logger.error('Failed to submit upload', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (editQuery.isLoading) {
    return (
      <PageShell glowColor="rgba(232,66,10,0.15)">
        <div className="max-w-2xl mx-auto py-16 px-4 space-y-6">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-12 w-36 rounded-full" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell glowColor="rgba(232,66,10,0.14)">
      <PageHero
        badge="Studio Ingestion"
        title={editContent ? 'Edit Master Asset' : 'Direct Studio Upload'}
        description={
          editContent
            ? 'Update metadata, synopsis, and universe tagging for your existing title.'
            : 'Publish 4K footage and multi-track audio to the global Azeebo+ audience.'
        }
      />

      <div className="max-w-2xl mx-auto py-4 -mt-4 px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <div>
              <label
                htmlFor="content-title"
                className="text-white text-xs font-semibold mb-2 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-[var(--brand-orange)]" />
                Asset Title
              </label>
              <input
                id="content-title"
                aria-label="Content title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lagos Nights: Episode 1"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="content-description"
                className="text-white text-xs font-semibold mb-2 block"
              >
                Synopsis & Description
              </label>
              <textarea
                id="content-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the narrative, creator credits, and episode summary..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--brand-orange)] transition-colors resize-y"
              />
            </div>

            <div>
              <label
                htmlFor="content-universe"
                className="text-white text-xs font-semibold mb-2 flex items-center gap-2"
              >
                <Globe className="w-4 h-4 text-blue-400" />
                Target Universe
              </label>
              {universesLoading ? (
                <Skeleton className="h-11 w-full rounded-xl" />
              ) : (
                <select
                  id="content-universe"
                  value={universeId}
                  onChange={(e) => setUniverseId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--hp-surface)] border border-white/10 text-white text-sm focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
                >
                  <option value="">Select Target Universe</option>
                  {universes.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label
                htmlFor="content-tags"
                className="text-white text-xs font-semibold mb-2 flex items-center gap-2"
              >
                <Tag className="w-4 h-4 text-emerald-400" />
                Tags (comma separated)
              </label>
              <input
                id="content-tags"
                aria-label="Content tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., nollywood, thriller, lagos, original"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[var(--brand-orange)] transition-colors"
              />
            </div>

            {!editContent && (
              <div>
                <label
                  htmlFor="content-file"
                  className="text-white text-xs font-semibold mb-2 flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4 text-[var(--brand-orange)]" />
                  Media Master File
                </label>
                <div className="border-2 border-dashed border-white/15 hover:border-[var(--brand-orange)]/40 rounded-2xl p-8 text-center bg-white/[0.02] transition-colors">
                  <input
                    id="content-file"
                    type="file"
                    accept="video/*,image/*,audio/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-white/50 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--brand-orange)] file:text-white hover:file:opacity-90 cursor-pointer"
                  />
                  {file && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>
            )}

            {editContent?.thumbnail && (
              <div>
                <span className="text-white text-xs font-semibold mb-2 block">
                  Current Master Poster
                </span>
                <div className="relative aspect-video bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                  <OptimizedImage src={editContent.thumbnail} alt="" fill className="object-cover" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                aria-label="Cancel upload"
                onClick={() => router.push('/creator')}
                className="px-6 py-3 rounded-full border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                aria-label={editContent ? 'Save changes' : 'Upload content'}
                onClick={handleSubmit}
                disabled={isSubmitting || (!file && !editContent)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="az-btn-primary px-8 py-3 rounded-full text-xs font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                {isSubmitting
                  ? editContent
                    ? 'Saving changes...'
                    : 'Transcoding & Ingesting...'
                  : editContent
                    ? 'Save Changes'
                    : 'Publish Master Asset'}
              </motion.button>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </PageShell>
  );
}
