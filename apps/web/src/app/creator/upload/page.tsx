'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useUniversesQuery } from '@/hooks/useUniverses';
import { createWebLogger } from '@/lib/logger';

const logger = createWebLogger('CreatorUpload');
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { Skeleton } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { UploadCloud, FileText, Tag, Globe } from 'lucide-react';

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
      router.push(data?.id ? '/creators/dashboard' : '/creators');
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
      router.push(data?.id ? '/creators/dashboard' : '/creators');
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <AppHeader active="Creator" logoVariant="light" />
        <main style={{ padding: '100px 24px 60px', maxWidth: 640, margin: '0 auto' }}>
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-40 w-full mb-6" />
          <Skeleton className="h-12 w-32" />
        </main>
        <AppFooter logoVariant="light" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary, #F5F0EB)',
      }}
    >
      <AppHeader active="Creator" logoVariant="light" />
      <main style={{ padding: '100px 24px 60px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#FFFFFF' }}>
            {editContent ? 'Edit Content' : 'Upload New Content'}
          </h1>
          <p style={{ color: 'var(--text-muted, #9A8A7A)', margin: 0 }}>
            {editContent
              ? 'Update your existing content'
              : 'Share your work with the global Azeebo+ audience'}
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div>
            <label
              htmlFor="content-title"
              style={{
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FileText size={15} color="#E8420A" />
              Title
            </label>
            <input
              id="content-title"
              aria-label="Content title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'var(--bg-secondary)',
                color: '#FFFFFF',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="content-description"
              style={{
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                display: 'block',
              }}
            >
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
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'var(--bg-secondary)',
                color: '#FFFFFF',
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="content-universe"
              style={{
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Globe size={15} color="#3B82F6" />
              Universe
            </label>
            {universesLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <select
                id="content-universe"
                value={universeId}
                onChange={(e) => setUniverseId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'var(--bg-secondary)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
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
            <label
              htmlFor="content-tags"
              style={{
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Tag size={15} color="#10B981" />
              Tags (comma separated)
            </label>
            <input
              id="content-tags"
              aria-label="Content tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., comedy, standup, special"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'var(--bg-secondary)',
                color: '#FFFFFF',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {!editContent && (
            <div>
              <label
                htmlFor="content-file"
                style={{
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <UploadCloud size={15} color="#E8420A" />
                Media File
              </label>
              <div
                style={{
                  border: '2px dashed rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  padding: '24px 16px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <input
                  id="content-file"
                  type="file"
                  accept="video/*,image/*,audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{
                    width: '100%',
                    color: 'var(--text-muted, #9A8A7A)',
                    fontSize: 14,
                  }}
                />
                {file && (
                  <p
                    style={{
                      margin: '10px 0 0 0',
                      color: '#10B981',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
          )}

          {editContent?.thumbnail && (
            <div>
              <label
                style={{
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 8,
                  display: 'block',
                }}
              >
                Thumbnail
              </label>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '16/9',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <OptimizedImage src={editContent.thumbnail} alt="" fill className="object-cover" />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button
            aria-label="Cancel upload"
            onClick={() => router.push('/creators')}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'var(--text-muted, #9A8A7A)',
              fontSize: 14,
              fontWeight: 500,
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
              padding: '12px 28px',
              borderRadius: 10,
              background:
                'linear-gradient(135deg, var(--brand-orange, #E8420A) 0%, var(--brand-red, #CC1C1C) 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: isSubmitting || (!file && !editContent) ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || (!file && !editContent) ? 0.5 : 1,
              transition: 'opacity 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <UploadCloud size={16} />
            {isSubmitting
              ? editContent
                ? 'Saving...'
                : 'Uploading...'
              : editContent
                ? 'Save Changes'
                : 'Upload Content'}
          </button>
        </div>
      </main>
      <AppFooter logoVariant="light" />

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
