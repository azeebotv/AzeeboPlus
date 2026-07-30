'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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

  const { data: universes = [], isLoading: universesLoading } = useQuery({
    queryKey: ['universes'],
    queryFn: async () => {
      const res = await apiFetch<{ data: Array<{ id: string; name: string }> }>('/v1/universes');
      if (res.success && res.data) return res.data.data;
      return [];
    },
  });

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
      router.push(data?.id ? '/creator/content-manager' : '/creator');
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
      router.push(data?.id ? '/creator/content-manager' : '/creator');
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
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (editQuery.isLoading) {
    return (
      <div
        className="min-h-screen bg-[var(--brand-near-black)]"
        style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)' }}
      >
        <AppHeader active="Creator" />
        <main style={{ padding: '100px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-12 w-32" />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary, #1A0A0A)', color: 'var(--text-primary, #F5F0EB)' }}>
      <AppHeader active="Creator" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          {editContent ? 'Edit Content' : 'Upload New Content'}
        </h1>
        <p style={{ color: 'var(--text-muted, #9A8A7A)', marginBottom: 24 }}>
          {editContent ? 'Update your existing content' : 'Share your work with the community'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="content-title" style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13, marginBottom: 4, display: 'block' }}>
              Title
            </label>
            <input
              id="content-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                background: '#140808',
                color: 'var(--text-primary, #F5F0EB)',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label htmlFor="content-description" style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13, marginBottom: 4, display: 'block' }}>
              Description
            </label>
            <textarea
              id="content-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your content"
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                background: '#140808',
                color: 'var(--text-primary, #F5F0EB)',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label htmlFor="content-universe" style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13, marginBottom: 4, display: 'block' }}>
              Universe
            </label>
            {universesLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <select
                id="content-universe"
                value={universeId}
                onChange={(e) => setUniverseId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  background: '#140808',
                  color: 'var(--text-primary, #F5F0EB)',
                  fontSize: 14,
                }}
              >
                <option value="">Select universe</option>
                {universes.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="content-tags" style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13, marginBottom: 4, display: 'block' }}>
              Tags (comma separated)
            </label>
            <input
              id="content-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., comedy, standup, special"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid #2A1A1A',
                background: '#140808',
                color: 'var(--text-primary, #F5F0EB)',
                fontSize: 14,
              }}
            />
          </div>

          {!editContent && (
            <div>
              <label htmlFor="content-file" style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13, marginBottom: 4, display: 'block' }}>
                File
              </label>
              <input
                id="content-file"
                type="file"
                accept="video/*,image/*,audio/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #2A1A1A',
                  background: '#140808',
                  color: 'var(--text-primary, #F5F0EB)',
                  fontSize: 14,
                }}
              />
            </div>
          )}

          {editContent?.thumbnail && (
            <div>
              <label style={{ color: 'var(--text-muted, #9A8A7A)', fontSize: 13, marginBottom: 4, display: 'block' }}>
                Thumbnail
              </label>
              <div
                style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: '#140808' }}
              >
                <OptimizedImage src={editContent.thumbnail} alt="" fill className="object-cover" />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            aria-label="Cancel upload"
            onClick={() => router.push('/creator')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #2A1A1A',
              background: 'transparent',
              color: 'var(--text-primary, #F5F0EB)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            aria-label={editContent ? 'Save changes' : 'Upload content'}
            onClick={handleSubmit}
            disabled={isSubmitting || (!file && !editContent)}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: editContent ? 'var(--brand-orange, #E8420A)' : '#FF6B35',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: isSubmitting || (!file && !editContent) ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {isSubmitting
              ? editContent
                ? 'Saving...'
                : 'Uploading...'
              : editContent
                ? 'Save Changes'
                : 'Upload'}
          </button>
        </div>
      </main>
      <AppFooter />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </div>
  );
}
