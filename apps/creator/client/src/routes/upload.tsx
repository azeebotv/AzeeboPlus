import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorApi } from '@/lib/api/creator';
import { useCreatorFlags, CREATOR_FLAG_KEYS } from '@/hooks/useCreatorFlags';
import type { UploadProgress } from '@/lib/creator-types';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #2A1A1A',
  backgroundColor: '#0D0505',
  color: '#F5F0EB',
  fontSize: 14,
};

const statusColor: Record<string, string> = {
  uploading: 'rgba(59,130,246,0.2)',
  processing: 'rgba(245,158,11,0.2)',
  completed: 'rgba(13,59,46,0.2)',
  failed: 'rgba(204,28,28,0.2)',
};
const statusText: Record<string, string> = {
  uploading: '#3B82F6',
  processing: '#F59E0B',
  completed: '#0D3B2E',
  failed: '#CC1C1C',
};

export default function UploadPage() {
  const queryClient = useQueryClient();
  const { isEnabled: isFlagEnabled } = useCreatorFlags();
  const uploadV2 = isFlagEnabled(CREATOR_FLAG_KEYS.uploadV2);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('video');
  const [universe, setUniverse] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: uploads, isLoading } = useQuery({
    queryKey: ['creator', 'uploads'],
    queryFn: async () => {
      const res = await creatorApi.getUploads();
      return res.success ? (res.data as UploadProgress[]) : [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('universe', universe);
      return creatorApi.uploadContent(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'uploads'] });
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      <p style={{ color: '#9A8A7A', marginBottom: 24 }}>
        Upload new content and track processing status
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 340 }}>
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid #2A1A1A',
              backgroundColor: 'rgba(26,10,10,0.5)',
              marginBottom: 24,
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Upload</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
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
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
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
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Type
              </label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#9A8A7A', marginBottom: 6 }}>
                Universe
              </label>
              <input
                value={universe}
                onChange={(e) => setUniverse(e.target.value)}
                placeholder="e.g. Reality, Comedy"
                style={inputStyle}
              />
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
                      border: `2px dashed ${dragActive ? '#E8420A' : '#2A1A1A'}`,
                      backgroundColor: dragActive ? 'rgba(232,66,10,0.05)' : 'rgba(13,5,5,0.3)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      marginBottom: 16,
                      transition: 'all 0.2s',
                    }
                  : { marginBottom: 16 }
              }
            >
              <p style={{ fontSize: 14, color: '#9A8A7A', marginBottom: 8 }}>
                {selectedFile ? selectedFile.name : uploadV2 ? 'Drag & drop or click to select' : 'Select a file'}
              </p>
              {uploadV2 && <p style={{ fontSize: 12, color: '#5A4A4A' }}>Max 500MB</p>}
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
                    border: '1px solid #2A1A1A',
                    background: 'transparent',
                    color: '#F5F0EB',
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
              disabled={!selectedFile || !title || uploadMutation.isPending}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #E8420A 0%, #CC1C1C 100%)',
                color: '#fff',
                fontWeight: 600,
                cursor: uploadMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: uploadMutation.isPending ? 0.6 : 1,
                width: '100%',
              }}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </button>
            {uploadMutation.isSuccess && (
              <p style={{ color: '#0D3B2E', fontSize: 13, marginTop: 8 }}>
                Upload started successfully
              </p>
            )}
            {uploadMutation.isError && (
              <p style={{ color: '#CC1C1C', fontSize: 13, marginTop: 8 }}>Upload failed</p>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 340 }}>
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: '1px solid #2A1A1A',
              backgroundColor: 'rgba(26,10,10,0.5)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              {uploadV2 ? 'Processing Status' : 'Your Uploads'}
            </h3>
            {isLoading ? (
              <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 20 }}>Loading...</p>
            ) : uploads && uploads.length > 0 ? (
              uploads.map((u) => (
                <div key={u.id} style={{ padding: '12px 0', borderBottom: '1px solid #1A0A0A' }}>
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
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#2A1A1A',
                    }}
                  >
                    <div
                      style={{
                        width: `${u.progress}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: 'linear-gradient(90deg, #E8420A, #CC1C1C)',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 12, color: '#9A8A7A', marginTop: 4 }}>
                    {u.progress}% complete
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: '#9A8A7A', textAlign: 'center', padding: 20 }}>
                No uploads in progress
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
