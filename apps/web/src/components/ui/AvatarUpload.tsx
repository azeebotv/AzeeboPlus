'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, Check, Loader } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { OptimizedImage } from '../OptimizedImage';

interface AvatarUploadProps {
  currentAvatar?: string;
  displayName?: string;
  onAvatarUpdate: (url: string) => void;
  size?: number;
}

interface CropSettings {
  x: number;
  y: number;
  scale: number;
}

export function AvatarUpload({
  currentAvatar,
  displayName = '',
  onAvatarUpdate,
  size = 120,
}: AvatarUploadProps): React.JSX.Element {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropSettings, setCropSettings] = useState<CropSettings>({ x: 0, y: 0, scale: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > maxSize) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid format. Please use JPEG, PNG, WebP, or GIF.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const result = await apiFetch<{ url: string }>('/users/me/avatar', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });

      if (result.success && result.data) {
        onAvatarUpdate(result.data.url);
        setShowCropper(false);
        setPreview(null);
        setSelectedFile(null);
      }
    } catch {
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, onAvatarUpdate]);

  const handleCancel = useCallback(() => {
    setShowCropper(false);
    setPreview(null);
    setSelectedFile(null);
    setCropSettings({ x: 0, y: 0, scale: 1 });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirm('Remove your avatar?')) return;

    try {
      await apiFetch('/users/me/avatar', { method: 'DELETE' });
      onAvatarUpdate('');
    } catch {
      alert('Failed to remove avatar.');
    }
  }, [onAvatarUpdate]);

  return (
    <div className="relative inline-block">
      {/* Avatar Display */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: size,
          height: size,
          border: '3px solid var(--brand-orange)',
        }}
      >
        {currentAvatar ? (
          <OptimizedImage
            src={currentAvatar}
            alt={displayName || 'Avatar'}
            width={size}
            height={size}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red, #CC1C1C))',
              color: 'white',
            }}
          >
            {displayName.charAt(0).toUpperCase() || '?'}
          </div>
        )}

        {/* Upload overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          aria-label="Change avatar"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Delete button */}
      {currentAvatar && (
        <button
          onClick={handleDelete}
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-error-500, #EF4444)' }}
          aria-label="Remove avatar"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Crop Modal */}
      {showCropper && preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="az-glass p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Crop Avatar</h3>

            {/* Preview */}
            <div className="relative mx-auto mb-4" style={{ width: 200, height: 200 }}>
              <div
                className="w-full h-full rounded-full overflow-hidden"
                style={{ border: '2px solid var(--brand-orange)' }}
              >
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                  style={{
                    transform: `scale(${cropSettings.scale}) translate(${cropSettings.x}px, ${cropSettings.y}px)`,
                  }}
                />
              </div>
            </div>

            {/* Scale slider */}
            <div className="mb-4">
              <label className="text-xs text-white/60 mb-1 block">Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={cropSettings.scale}
                onChange={(e) =>
                  setCropSettings((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
                }
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--brand-orange)' }}
              >
                {isUploading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isUploading ? 'Uploading...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isUploading}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white/60 border hover:text-white transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
