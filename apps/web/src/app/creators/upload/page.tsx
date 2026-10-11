'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';

/**
 * Creator Upload Page (TAA §68)
 * Separate upload path for creators with content lifecycle management.
 * Handles draft creation, file upload, and content publishing.
 */

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'review' | 'published' | 'error';
  progress: number;
  contentId?: string;
  error?: string;
}

interface ContentFormData {
  title: string;
  description: string;
  universeId: string;
  contentType: 'video' | 'audio' | 'image' | 'document';
  tags: string;
  scheduledPublishAt?: string;
}

export default function CreatorUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
  });

  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    universeId: '',
    contentType: 'video',
    tags: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Generate preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // Auto-detect content type
    if (file.type.startsWith('video/')) {
      setFormData((prev) => ({ ...prev, contentType: 'video' }));
    } else if (file.type.startsWith('audio/')) {
      setFormData((prev) => ({ ...prev, contentType: 'audio' }));
    } else if (file.type.startsWith('image/')) {
      setFormData((prev) => ({ ...prev, contentType: 'image' }));
    } else {
      setFormData((prev) => ({ ...prev, contentType: 'document' }));
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !formData.title || !formData.universeId) return;

    setUploadState({ status: 'uploading', progress: 0 });
    analytics.contentUploaded();

    try {
      // Step 1: Create content draft
      const draftResponse = await apiFetch<{ id: string }>('/api/v1/content', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          universeId: formData.universeId,
          contentType: formData.contentType,
          tags: formData.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
          status: 'draft',
          scheduledPublishAt: formData.scheduledPublishAt,
        }),
      });

      if (!draftResponse.success || !draftResponse.data) {
        throw new Error(draftResponse.message || 'Failed to create draft');
      }

      const contentId = draftResponse.data.id;

      // Step 2: Get presigned upload URL
      const urlResponse = await apiFetch<{ signedUrl: string; mediaAssetId: string }>(
        `/api/v1/content/${contentId}/media/upload-url`,
        {
          method: 'POST',
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            contentType: selectedFile.type,
          }),
        }
      );

      if (!urlResponse.success || !urlResponse.data) {
        throw new Error(urlResponse.message || 'Failed to get upload URL');
      }

      // Step 3: Upload file directly to storage
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadState((prev) => ({ ...prev, progress: percent }));
        }
      });

      const signedUrl = urlResponse.data?.signedUrl;
      if (!signedUrl) throw new Error('No upload URL received');

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', selectedFile.type);
        xhr.send(selectedFile);
      });

      // Step 4: Complete upload
      setUploadState({ status: 'processing', progress: 100 });

      await apiFetch(`/api/v1/content/${contentId}/media/complete`, {
        method: 'POST',
        body: JSON.stringify({ mediaAssetId: urlResponse.data?.mediaAssetId }),
      });

      analytics.contentUploadCompleted(contentId, formData.contentType);

      setUploadState({ status: 'review', progress: 100, contentId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      analytics.contentUploadFailed(formData.contentType, errorMessage);
      setUploadState({ status: 'error', progress: 0, error: errorMessage });
    }
  };

  const handlePublish = async () => {
    if (!uploadState.contentId) return;

    try {
      await apiFetch(`/api/v1/content/${uploadState.contentId}/publish`, {
        method: 'POST',
      });
      setUploadState((prev) => ({ ...prev, status: 'published' }));
      router.push('/creators/dashboard');
    } catch (err) {
      setUploadState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Publish failed',
      }));
    }
  };

  return (
    <PageShell maxWidth="sm" className="pb-16">
      <PageHero
        title="Upload Content"
        eyebrow="Creators"
        description="Share your content with the world"
      />

      {uploadState.status === 'published' ? (
        <div className="az-glass p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-az-success-500/15">
            <svg
              className="size-8 text-az-success-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="az-title mb-2 text-az-ink">Published!</h2>
          <p className="az-body mb-6 text-az-ink-muted">Your content is now live.</p>
          <button
            onClick={() => router.push('/creators/dashboard')}
            className="az-btn-primary az-btn-primary--inline az-btn-primary--sm"
          >
            Back to Dashboard
          </button>
        </div>
      ) : uploadState.status === 'error' ? (
        <div className="az-glass p-8 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-az-error-500/15">
            <svg
              className="size-8 text-az-error-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="az-title mb-2 text-az-ink">Upload Failed</h2>
          <p className="az-body mb-6 text-az-error-400">{uploadState.error}</p>
          <button
            onClick={() => setUploadState({ status: 'idle', progress: 0 })}
            className="az-btn-primary az-btn-primary--inline az-btn-primary--sm"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File selection */}
          <div className="az-glass p-6">
            <h2 className="az-subtitle mb-4 text-az-ink">File</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center gap-4">
                {previewUrl && (
                  <div className="size-24 overflow-hidden rounded-az-card bg-az-glass-fill">
                    {selectedFile.type.startsWith('image/') ? (
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : selectedFile.type.startsWith('video/') ? (
                      <video src={previewUrl} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                )}
                <div>
                  <p className="az-body-strong text-az-ink">{selectedFile.name}</p>
                  <p className="az-caption text-az-ink-muted">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-az-panel border-2 border-dashed border-az-glass-border p-8 text-center transition-colors hover:border-az-scarlet/40"
              >
                <svg
                  className="mx-auto mb-2 size-12 text-az-ink-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="az-body-strong text-az-ink">Click to select file</p>
                <p className="az-caption mt-1 text-az-ink-muted">Video, audio, or image</p>
              </button>
            )}
          </div>

          {/* Form fields */}
          <div className="az-glass space-y-4 p-6">
            <div>
              <label className="az-label">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="az-input"
                placeholder="Enter content title"
              />
            </div>

            <div>
              <label className="az-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="az-input h-24 resize-none"
                placeholder="Describe your content"
              />
            </div>

            <div>
              <label className="az-label">Universe *</label>
              <select
                value={formData.universeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, universeId: e.target.value }))}
                className="az-input"
              >
                <option value="">Select universe</option>
                <option value="vertical">Vertical</option>
                <option value="movie">Movie</option>
                <option value="reality">Reality</option>
                <option value="comedy">Comedy</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="sports">Sports</option>
                <option value="games">Games</option>
              </select>
            </div>

            <div>
              <label className="az-label">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                className="az-input"
                placeholder="Comma-separated tags"
              />
            </div>
          </div>

          {/* Upload progress */}
          {uploadState.status !== 'idle' && (
            <div className="az-glass p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="az-body-strong text-az-ink">
                  {uploadState.status === 'uploading' && `Uploading... ${uploadState.progress}%`}
                  {uploadState.status === 'processing' && 'Processing...'}
                  {uploadState.status === 'review' && 'Ready to publish'}
                </span>
              </div>
              <div className="h-2 w-full rounded-az-pill bg-az-glass-fill">
                <div
                  className="h-2 rounded-az-pill bg-az-scarlet transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            {uploadState.status === 'review' ? (
              <button onClick={handlePublish} className="az-btn-primary flex-1">
                Publish Now
              </button>
            ) : (
              <button
                onClick={handleUpload}
                disabled={
                  !selectedFile ||
                  !formData.title ||
                  !formData.universeId ||
                  uploadState.status !== 'idle'
                }
                className="az-btn-primary flex-1"
              >
                {uploadState.status === 'idle' ? 'Upload' : 'Uploading...'}
              </button>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
