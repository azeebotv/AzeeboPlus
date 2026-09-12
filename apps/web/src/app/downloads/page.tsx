'use client';

import { useState } from 'react';
import {
  Download,
  Trash2,
  HardDrive,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import AppHeader from '../../components/layout/AppHeader';
import AppFooter from '../../components/layout/AppFooter';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDownloads, type DownloadItem } from '../../hooks/useDownloads';
import { useAuth } from '../../context/AuthContext';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusIcon(status: DownloadItem['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'downloading':
      return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-400" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    case 'expired':
      return <WifiOff className="w-4 h-4 text-white/40" />;
    default:
      return null;
  }
}

function getStatusColor(status: DownloadItem['status']) {
  switch (status) {
    case 'completed':
      return 'text-green-400';
    case 'downloading':
      return 'text-blue-400';
    case 'pending':
      return 'text-yellow-400';
    case 'failed':
      return 'text-red-400';
    case 'expired':
      return 'text-white/40';
    default:
      return 'text-white/60';
  }
}

export default function DownloadsPage(): React.JSX.Element {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { downloads, storage, isLoading, deleteDownload, deleteAll } = useDownloads();
  const [filter, setFilter] = useState<string>('all');
  const [showDeleteAll, setShowDeleteAll] = useState(false);

  if (authLoading) return <></>;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="az-glass p-8 text-center">
            <Download className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--brand-orange)' }} />
            <h2 className="text-2xl font-bold text-white mb-4">Sign in to manage downloads</h2>
            <p className="text-white/50">Download content for offline viewing</p>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  const filteredDownloads = downloads.filter((d) => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const completedCount = downloads.filter((d) => d.status === 'completed').length;
  const storageUsed = storage?.totalUsed || 0;
  const storageTotal = storage?.totalAvailable || 2 * 1024 * 1024 * 1024;
  const storagePercent = Math.round((storageUsed / storageTotal) * 100);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Download className="w-6 h-6" style={{ color: 'var(--brand-orange)' }} />
              Downloads
            </h1>
            <p className="text-white/50 mt-1">Manage your offline content</p>
          </div>
          {downloads.length > 0 && (
            <button
              onClick={() => setShowDeleteAll(true)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Delete All
            </button>
          )}
        </div>

        {/* Storage Info */}
        <div className="az-glass p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/80">Storage</span>
            </div>
            <span className="text-sm text-white/60">
              {formatBytes(storageUsed)} / {formatBytes(storageTotal)}
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${storagePercent}%`,
                background:
                  storagePercent > 80 ? 'var(--color-error-500, #EF4444)' : 'var(--brand-orange)',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-white/40">{completedCount} items downloaded</span>
            <span className="text-xs text-white/40">{storagePercent}% used</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'completed', 'downloading', 'pending', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                filter === f ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
              style={{
                background: filter === f ? 'var(--brand-orange)' : 'rgba(255,255,255,0.05)',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1 text-[10px]">
                  ({downloads.filter((d) => f === 'all' || d.status === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Downloads List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="az-glass p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-28 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-4 rounded w-1/3"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    />
                    <div
                      className="h-3 rounded w-1/4"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    />
                    <div
                      className="h-3 rounded w-1/2"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDownloads.length === 0 ? (
          <div className="az-glass p-12">
            <EmptyState
              icon="Download"
              title="No downloads yet"
              description="Download movies, shows, and music to watch offline. Look for the download button on any content."
              dark
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDownloads.map((download) => (
              <div key={download.id} className="az-glass p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div
                    className="w-20 h-28 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    {download.contentThumbnail ? (
                      <img
                        src={download.contentThumbnail}
                        alt={download.contentTitle || 'Content'}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Download className="w-6 h-6 text-white/20" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(download.status)}
                      <h3 className="font-medium text-white text-sm truncate">
                        {download.contentTitle || `Content ${download.contentId.slice(0, 8)}`}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span
                        className="uppercase font-medium"
                        style={{ color: 'var(--brand-orange)' }}
                      >
                        {download.quality}
                      </span>
                      <span>{formatBytes(download.fileSize)}</span>
                      <span>Expires {formatDate(download.expiresAt)}</span>
                    </div>

                    {/* Progress bar for downloading */}
                    {download.status === 'downloading' && (
                      <div className="mt-2">
                        <div
                          className="w-full h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.1)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${download.progress}%`,
                              background: 'var(--brand-orange)',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-white/40 mt-1">{download.progress}%</span>
                      </div>
                    )}

                    {/* Status text */}
                    <span className={`text-xs mt-1 block ${getStatusColor(download.status)}`}>
                      {download.status === 'completed' && 'Ready for offline viewing'}
                      {download.status === 'downloading' && `Downloading... ${download.progress}%`}
                      {download.status === 'pending' && 'Waiting to start...'}
                      {download.status === 'failed' && 'Download failed — tap to retry'}
                      {download.status === 'expired' && 'Download expired'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {download.status === 'completed' && (
                      <Wifi className="w-4 h-4 text-green-400" aria-label="Available offline" />
                    )}
                    <button
                      onClick={() => deleteDownload(download.id)}
                      className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                      aria-label="Delete download"
                    >
                      <Trash2 className="w-4 h-4 text-white/40 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offline Tips */}
        {completedCount > 0 && (
          <div className="az-glass p-6 mt-8">
            <h3 className="text-sm font-medium text-white mb-3">Offline viewing tips</h3>
            <ul className="space-y-2 text-xs text-white/50">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Downloads expire after 30 days
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Content is available offline when Wi-Fi is disconnected
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Higher quality uses more storage space
              </li>
            </ul>
          </div>
        )}
      </main>

      {/* Delete All Confirmation */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="az-glass p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Delete all downloads?</h3>
            <p className="text-sm text-white/60 mb-6">
              This will remove all {downloads.length} downloaded items. You can re-download them
              later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  deleteAll();
                  setShowDeleteAll(false);
                }}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete All
              </button>
              <button
                onClick={() => setShowDeleteAll(false)}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white/60 border hover:text-white transition-colors"
                style={{ borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
