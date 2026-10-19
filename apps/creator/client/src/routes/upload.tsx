import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import { useCreatorFlags, CREATOR_FLAG_KEYS } from '@/hooks/useCreatorFlags';
import type { UploadProgress } from '@/lib/creator-types';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--creator-border)',
  backgroundColor: 'var(--creator-dark)',
  color: 'var(--creator-text)',
  fontSize: 14,
};

const statusColor: Record<string, string> = {
  uploading: 'rgba(59,130,246,0.2)',
  processing: 'rgba(245,158,11,0.2)',
  completed: 'rgba(13,59,46,0.2)',
  failed: 'rgba(204,28,28,0.2)',
};
const statusText: Record<string, string> = {
  uploading: 'var(--creator-blue, #3b82f6)',
  processing: 'var(--creator-amber, #f59e0b)',
  completed: 'var(--creator-green)',
  failed: 'var(--creator-red)',
};

// Storage pipeline state: did the bytes reach blob storage, and did the
// virus scan pass? 'pending' means the file is only registered (media-service
// was unavailable or rejected it) — the creator must re-upload.
const storageLabel: Record<string, string> = {
  stored: 'Stored in blob storage',
  pending: 'Registered only — not stored, re-upload needed',
  unknown: 'Storage status unknown (legacy upload)',
};
const storageColor: Record<string, string> = {
  stored: 'var(--creator-green)',
  pending: 'var(--creator-red)',
  unknown: 'var(--creator-text-muted)',
};

export default function UploadPage() {
  const queryClient = useQueryClient();
  const { isEnabled: isFlagEnabled, universeOptions } = useCreatorFlags();
  const uploadV2 = isFlagEnabled(CREATOR_FLAG_KEYS.uploadV2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('video');
  const [universe, setUniverse] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  // Real upload progress, driven by XHR upload.onprogress events.
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [activeUpload, setActiveUpload] = useState<{ name: string; size: number } | null>(null);

  const {
    data: uploads,
    isLoading,
    isError: uploadsFailed,
    error: uploadsError,
  } = useQuery({
    queryKey: ['creator', 'uploads'],
    queryFn: async () => {
      const res = await creatorApi.getUploads();
      return creatorApi.assertSuccess<UploadProgress[]>(res);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('universe', universe);
      setActiveUpload({ name: file.name, size: file.size });
      setUploadPct(0);
      const res = await creatorApi.uploadContentWithProgress(formData, setUploadPct);
      return creatorApi.assertSuccess<UploadProgress>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'uploads'] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'content'] });
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onSettled: () => {
      setUploadPct(null);
      setActiveUpload(null);
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Upload</h1>
      <p style={{ color: 'var(--creator-text-muted)', marginBottom: 24 }}>
        Upload new content and track processing status
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 340 }}>
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Upload</h3>
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--creator-text-muted)',
                  marginBottom: 6,
                }}
              >
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Content title"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--creator-text-muted)',
                  marginBottom: 6,
                }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--creator-text-muted)',
                  marginBottom: 6,
                }}
              >
                Type
              </label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  color: 'var(--creator-text-muted)',
                  marginBottom: 6,
                }}
              >
                Universe
              </label>
              {/* Universe picker is sentinel-gated: disabled universes are not
                  offered, and a stale value can't be uploaded (blocked below,
                  mirroring the 404 the server would return). */}
              <select
                value={universe}
                onChange={(e) => setUniverse(e.target.value)}
                style={inputStyle}
              >
                <option value="">Select a universe</option>
                {universeOptions.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug.charAt(0).toUpperCase() + slug.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div
              {...(uploadV2
                ? {
                    onDragOver: (e: React.DragEvent) => {
                      e.preventDefault();
                      setDragActive(true);
                    },
                    onDragLeave: () => setDragActive(false),
                    onDrop: handleDrop,
                    onClick: () => fileInputRef.current?.click(),
                  }
                : {})}
              style={
                uploadV2
                  ? {
                      padding: 32,
                      borderRadius: 12,
                      border: `2px dashed ${dragActive ? 'var(--creator-orange)' : 'var(--creator-surface)'}`,
                      backgroundColor: dragActive ? 'rgba(232,66,10,0.05)' : 'rgba(13,5,5,0.3)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      marginBottom: 16,
                      transition: 'all 0.2s',
                    }
                  : { marginBottom: 16 }
              }
            >
              <p style={{ fontSize: 14, color: 'var(--creator-text-muted)', marginBottom: 8 }}>
                {selectedFile
                  ? selectedFile.name
                  : uploadV2
                    ? 'Drag & drop or click to select'
                    : 'Select a file'}
              </p>
              {uploadV2 && (
                <p style={{ fontSize: 12, color: 'var(--creator-text-muted)' }}>Max 500MB</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept="video/*,audio/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
              />
              {!uploadV2 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    marginTop: 8,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid var(--creator-border)',
                    background: 'transparent',
                    color: 'var(--creator-text)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Choose file
                </button>
              )}
            </div>

            <button
              onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
              disabled={!selectedFile || !title || !universe || uploadMutation.isPending}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: 'white',
                fontWeight: 600,
                cursor: uploadMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: uploadMutation.isPending ? 0.6 : 1,
                width: '100%',
              }}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </button>
            {uploadMutation.isPending && activeUpload && uploadPct !== null && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--creator-border)',
                  backgroundColor: 'rgba(13,5,5,0.4)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{activeUpload.name}</span>
                  <span style={{ color: 'var(--creator-text-muted)' }}>{uploadPct}%</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'var(--creator-surface)',
                  }}
                >
                  <div
                    style={{
                      width: `${uploadPct}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: 'linear-gradient(90deg, #E8420A, #CC1C1C)',
                      transition: 'width 0.2s',
                    }}
                  />
                </div>
              </div>
            )}
            {uploadMutation.isSuccess && (
              <p style={{ color: 'var(--creator-green)', fontSize: 13, marginTop: 8 }}>
                Upload started successfully
              </p>
            )}
            {uploadMutation.isError && (
              <p style={{ color: 'var(--creator-red)', fontSize: 13, marginTop: 8 }}>
                {creatorApi.errorMessage(uploadMutation.error)}
              </p>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 340 }}>
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--creator-border)',
              backgroundColor: 'rgba(26,10,10,0.5)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              {uploadV2 ? 'Processing Status' : 'Your Uploads'}
            </h3>
            {isLoading ? (
              <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 20 }}>
                Loading...
              </p>
            ) : uploadsFailed ? (
              <p
                style={{
                  color: 'var(--creator-red)',
                  fontSize: 13,
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                {creatorApi.errorMessage(uploadsError)}
              </p>
            ) : uploads && uploads.length > 0 ? (
              uploads.map((u: UploadProgress) => (
                <div
                  key={u.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--creator-border-light)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{u.title}</span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: statusColor[u.status],
                        color: statusText[u.status],
                        textTransform: 'capitalize',
                      }}
                    >
                      {u.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, marginTop: 2, color: storageColor[u.storage] }}>
                    {storageLabel[u.storage] ?? storageLabel.unknown}
                    {u.storage === 'stored' &&
                      (u.scanStatus ? ` · scan: ${u.scanStatus}` : ' · scan: pending')}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--creator-text-muted)', textAlign: 'center', padding: 20 }}>
                No uploads in progress
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
