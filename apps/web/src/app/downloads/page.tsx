'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Trash2,
  HardDrive,
  Wifi,
  WifiOff,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHero } from '@/components/layout/PageHero';
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
      return <CheckCircle2 className="w-4 h-4 text-az-success-400" />;
    case 'downloading':
      return <Loader2 className="w-4 h-4 text-az-warning-400 animate-spin" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-az-ink/50" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-az-error-400" />;
    case 'expired':
      return <WifiOff className="w-4 h-4 text-az-ink/30" />;
    default:
      return null;
  }
}

function getStatusColor(status: DownloadItem['status']) {
  switch (status) {
    case 'completed':
      return 'text-az-success-400';
    case 'downloading':
      return 'text-az-warning-400';
    case 'pending':
      return 'text-az-ink/60';
    case 'failed':
      return 'text-az-error-400';
    case 'expired':
      return 'text-az-ink/40';
    default:
      return 'text-az-ink/60';
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
      <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 15%, transparent)">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="az-glass p-12 text-center border border-az-glass-border max-w-lg mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-32 bg-[var(--color-az-flame)]/15 blur-3xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-az-scarlet to-az-flame flex items-center justify-center text-az-ink mx-auto mb-6 shadow-az-glow">
              <Download className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-az-ink mb-3 tracking-tight">
              Sign in to manage downloads
            </h2>
            <p className="text-az-ink/60 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
              Download African cinema premieres, reality TV episodes, and concert audio for offline
              playback.
            </p>
            <Link
              href="/auth/login"
              className="az-btn-primary inline-flex items-center justify-center gap-2 tracking-wide shadow-lg hover:shadow-az-flame/20"
            >
              Sign In to Azeebo+
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  const filteredDownloads = downloads.filter((d) => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const completedCount = downloads.filter((d) => d.status === 'completed').length;
  const storageUsed = storage?.totalUsed || 0;
  const storageTotal = storage?.totalAvailable || 2 * 1024 * 1024 * 1024;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageTotal) * 100));

  return (
    <PageShell glowColor="color-mix(in srgb, var(--color-az-scarlet) 12%, transparent)">
      <PageHero
        badge="Offline Vault"
        title="My Downloads & Storage"
        description="Store Nollywood cinema blockbusters, reality show replays, and curated afrobeat mixtapes directly to your device for smooth offline playback without internet buffers."
        rightElement={
          downloads.length > 0 ? (
            <button
              onClick={() => setShowDeleteAll(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-az-error-400 hover:text-az-error-300 bg-az-error-500/10 hover:bg-az-error-500/15 border border-az-error-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge All Downloads
            </button>
          ) : undefined
        }
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-4">
        {/* Storage Dashboard Card */}
        <div className="az-glass p-6 sm:p-8 border border-az-glass-border mb-8 relative overflow-hidden">
          <div className="absolute -top-10 right-0 w-60 h-60 bg-[var(--color-az-flame)]/10 blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-az-glass-fill border border-az-glass-border flex items-center justify-center text-az-flame">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-az-ink tracking-tight">
                  Allocated Vault Storage
                </h3>
                <p className="text-xs text-az-ink/50">High-speed offline device cache</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-az-ink tracking-tight">
                {formatBytes(storageUsed)}{' '}
                <span className="text-az-ink/40 font-normal">/ {formatBytes(storageTotal)}</span>
              </span>
              <p className="text-[11px] text-az-ink/40 mt-0.5">{storagePercent}% consumed</p>
            </div>
          </div>

          {/* Glowing Storage Bar */}
          <div className="w-full h-2.5 rounded-full overflow-hidden bg-az-glass-fill border border-az-ink/5 p-[1px]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.max(4, storagePercent)}%`,
                background:
                  storagePercent > 80
                    ? 'linear-gradient(90deg, var(--color-az-warning-500), var(--color-az-error-500))'
                    : 'linear-gradient(90deg, var(--color-az-flame), var(--color-az-scarlet))',
                boxShadow:
                  storagePercent > 80
                    ? '0 0 16px color-mix(in srgb, var(--color-az-error-500) 40%, transparent)'
                    : '0 0 16px color-mix(in srgb, var(--color-az-scarlet) 40%, transparent)',
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-az-ink/40 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-az-flame" />
              {completedCount} {completedCount === 1 ? 'title' : 'titles'} ready for offline
              playback
            </span>
            <span>{formatBytes(Math.max(0, storageTotal - storageUsed))} available</span>
          </div>
        </div>

        {/* Filters Segmented Control */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {['all', 'completed', 'downloading', 'pending', 'failed'].map((f) => {
            const count = downloads.filter((d) => f === 'all' || d.status === f).length;
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  active
                    ? 'bg-gradient-to-r from-az-scarlet to-az-flame text-az-ink shadow-az-glow'
                    : 'bg-az-glass-fill text-az-ink/60 hover:text-az-ink hover:bg-az-glass-card border border-az-ink/5'
                }`}
              >
                <span>{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-az-ink/20 text-az-ink' : 'bg-az-glass-fill text-az-ink/40'}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Downloads List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="az-glass p-5 border border-az-glass-border animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-28 rounded-xl bg-az-glass-fill" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 rounded-full w-1/3 bg-az-glass-card" />
                    <div className="h-3 rounded-full w-1/4 bg-az-glass-fill" />
                    <div className="h-3 rounded-full w-1/2 bg-az-glass-fill" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDownloads.length === 0 ? (
          <div className="az-glass p-12 text-center border border-az-glass-border">
            <EmptyState
              icon="Download"
              title="No downloads found"
              description="Download movies, reality episodes, and music to stream anytime without burning mobile data. Look for the download button across titles."
              dark
            />
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredDownloads.map((download) => (
              <div
                key={download.id}
                className="az-glass p-4 sm:p-5 border border-az-glass-border transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Thumbnail / Artwork */}
                  <div className="w-20 h-28 rounded-xl flex-shrink-0 relative overflow-hidden bg-black/40 border border-az-glass-border flex items-center justify-center">
                    {download.contentThumbnail ? (
                      <img
                        src={download.contentThumbnail}
                        alt={download.contentTitle || 'Content'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Download className="w-6 h-6 text-az-ink/20" />
                    )}
                    {download.status === 'completed' && (
                      <Link
                        href={`/watch/${download.contentId}`}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-az-ink"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-az-scarlet to-az-flame flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Metadata and Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {getStatusIcon(download.status)}
                      <h3 className="font-bold text-az-ink text-sm sm:text-base tracking-tight truncate">
                        {download.contentTitle || `Content ${download.contentId.slice(0, 8)}`}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-az-ink/50 mb-2">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-az-flame/10 text-az-flame border border-az-flame/20">
                        {download.quality.toUpperCase()}
                      </span>
                      <span>{formatBytes(download.fileSize)}</span>
                      <span>•</span>
                      <span>Expires {formatDate(download.expiresAt)}</span>
                    </div>

                    {/* Progress indicator */}
                    {download.status === 'downloading' && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-az-glass-card">
                          <div
                            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-az-scarlet to-az-flame"
                            style={{ width: `${download.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-az-ink/40">
                          <span>Downloading package...</span>
                          <span className="font-mono text-az-flame font-medium">
                            {download.progress}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Status badge */}
                    <span
                      className={`text-xs block mt-1 font-medium ${getStatusColor(download.status)}`}
                    >
                      {download.status === 'completed' && 'Offline ready — tap to watch'}
                      {download.status === 'downloading' &&
                        `Downloading file... ${download.progress}%`}
                      {download.status === 'pending' && 'Queued for download'}
                      {download.status === 'failed' && 'Download interrupted — tap to resume'}
                      {download.status === 'expired' && 'Offline license expired'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {download.status === 'completed' && (
                      <Link
                        href={`/watch/${download.contentId}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-az-ink bg-az-glass-card hover:bg-az-ink/15 border border-az-glass-border transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Watch
                      </Link>
                    )}
                    <button
                      onClick={() => deleteDownload(download.id)}
                      className="p-2.5 rounded-xl hover:bg-az-error-500/10 hover:text-az-error-400 text-az-ink/40 border border-transparent hover:border-az-error-500/20 transition-all"
                      aria-label="Delete download"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offline Tips Box */}
        <div className="az-glass p-6 sm:p-8 border border-az-glass-border mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-az-success-500/10 border border-az-success-500/20 flex items-center justify-center text-az-success-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-az-ink mb-1">30-Day Offline Pass</h4>
              <p className="text-xs text-az-ink/50 leading-relaxed">
                Downloaded titles remain securely playable offline for 30 days without an active
                connection.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-az-flame/10 border border-az-flame/20 flex items-center justify-center text-az-flame flex-shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-az-ink mb-1">Zero-Data Playback</h4>
              <p className="text-xs text-az-ink/50 leading-relaxed">
                Enjoy crystal-clear audio and video during flights, commutes, or power cuts without
                using data.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-az-warning-500/10 border border-az-warning-500/20 flex items-center justify-center text-az-warning-400 flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-az-ink mb-1">Smart Compression</h4>
              <p className="text-xs text-az-ink/50 leading-relaxed">
                High efficiency AV1/H.265 compression preserves visual fidelity while halving file
                size.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Delete All Modal */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="az-glass p-8 max-w-sm w-full border text-center">
            <div className="w-14 h-14 rounded-2xl bg-az-error-500/10 border border-az-error-500/20 flex items-center justify-center text-az-error-400 mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-az-ink mb-2 tracking-tight">
              Delete all downloads?
            </h3>
            <p className="text-xs text-az-ink/60 mb-6 leading-relaxed">
              This will remove all {downloads.length} offline items from your device storage. You
              can re-download them anytime while your subscription or pass remains active.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  deleteAll();
                  setShowDeleteAll(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-az-ink bg-az-error-600 hover:bg-az-error-500 transition-colors shadow-lg"
              >
                Delete All
              </button>
              <button
                onClick={() => setShowDeleteAll(false)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-az-ink/70 hover:text-az-ink border border-az-glass-border hover:bg-az-glass-fill transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
