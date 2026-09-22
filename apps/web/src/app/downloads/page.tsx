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
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'downloading':
      return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-white/50" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    case 'expired':
      return <WifiOff className="w-4 h-4 text-white/30" />;
    default:
      return null;
  }
}

function getStatusColor(status: DownloadItem['status']) {
  switch (status) {
    case 'completed':
      return 'text-emerald-400';
    case 'downloading':
      return 'text-amber-400';
    case 'pending':
      return 'text-white/60';
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
      <PageShell glowColor="rgba(232,66,10,0.15)">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="az-glass p-12 text-center rounded-3xl border border-white/10 max-w-lg mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-32 bg-[var(--brand-orange)]/15 blur-3xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#e8420a] to-[#cc1c1c] flex items-center justify-center text-white mx-auto mb-6 shadow-[0_8px_32px_rgba(232,66,10,0.4)]">
              <Download className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">
              Sign in to manage downloads
            </h2>
            <p className="text-white/60 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
              Download African cinema premieres, reality TV episodes, and concert audio for offline playback.
            </p>
            <Link
              href="/auth/login"
              className="az-btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-lg hover:shadow-orange-500/20"
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
    <PageShell glowColor="rgba(232,66,10,0.12)">
      <PageHero
        badge="Offline Vault"
        title="My Downloads & Storage"
        description="Store Nollywood cinema blockbusters, reality show replays, and curated afrobeat mixtapes directly to your device for smooth offline playback without internet buffers."
        rightElement={
          downloads.length > 0 ? (
            <button
              onClick={() => setShowDeleteAll(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Purge All Downloads
            </button>
          ) : undefined
        }
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-4">
        {/* Storage Dashboard Card */}
        <div className="az-glass p-6 sm:p-8 rounded-2xl border border-white/10 mb-8 relative overflow-hidden">
          <div className="absolute -top-10 right-0 w-60 h-60 bg-[var(--brand-orange)]/10 blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Allocated Vault Storage</h3>
                <p className="text-xs text-white/50">High-speed offline device cache</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-white tracking-tight">
                {formatBytes(storageUsed)}{' '}
                <span className="text-white/40 font-normal">/ {formatBytes(storageTotal)}</span>
              </span>
              <p className="text-[11px] text-white/40 mt-0.5">{storagePercent}% consumed</p>
            </div>
          </div>

          {/* Glowing Storage Bar */}
          <div className="w-full h-2.5 rounded-full overflow-hidden bg-white/5 border border-white/5 p-[1px]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.max(4, storagePercent)}%`,
                background:
                  storagePercent > 80
                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    : 'linear-gradient(90deg, #e8420a, #cc1c1c)',
                boxShadow:
                  storagePercent > 80
                    ? '0 0 16px rgba(239, 68, 68, 0.4)'
                    : '0 0 16px rgba(232, 66, 10, 0.4)',
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-white/40 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              {completedCount} {completedCount === 1 ? 'title' : 'titles'} ready for offline playback
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
                    ? 'bg-gradient-to-r from-[#e8420a] to-[#cc1c1c] text-white shadow-[0_4px_16px_rgba(232,66,10,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
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
              <div key={i} className="az-glass p-5 rounded-2xl border border-white/10 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-28 rounded-xl bg-white/5" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 rounded-full w-1/3 bg-white/10" />
                    <div className="h-3 rounded-full w-1/4 bg-white/5" />
                    <div className="h-3 rounded-full w-1/2 bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDownloads.length === 0 ? (
          <div className="az-glass p-12 text-center rounded-3xl border border-white/10">
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
                className="az-glass p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Thumbnail / Artwork */}
                  <div className="w-20 h-28 rounded-xl flex-shrink-0 relative overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                    {download.contentThumbnail ? (
                      <img
                        src={download.contentThumbnail}
                        alt={download.contentTitle || 'Content'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Download className="w-6 h-6 text-white/20" />
                    )}
                    {download.status === 'completed' && (
                      <Link
                        href={`/watch/${download.contentId}`}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#e8420a] to-[#cc1c1c] flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Metadata and Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {getStatusIcon(download.status)}
                      <h3 className="font-bold text-white text-sm sm:text-base tracking-tight truncate">
                        {download.contentTitle || `Content ${download.contentId.slice(0, 8)}`}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/50 mb-2">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {download.quality.toUpperCase()}
                      </span>
                      <span>{formatBytes(download.fileSize)}</span>
                      <span>•</span>
                      <span>Expires {formatDate(download.expiresAt)}</span>
                    </div>

                    {/* Progress indicator */}
                    {download.status === 'downloading' && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                          <div
                            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[#e8420a] to-[#cc1c1c]"
                            style={{ width: `${download.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-white/40">
                          <span>Downloading package...</span>
                          <span className="font-mono text-orange-400 font-medium">{download.progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Status badge */}
                    <span className={`text-xs block mt-1 font-medium ${getStatusColor(download.status)}`}>
                      {download.status === 'completed' && 'Offline ready — tap to watch'}
                      {download.status === 'downloading' && `Downloading file... ${download.progress}%`}
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Watch
                      </Link>
                    )}
                    <button
                      onClick={() => deleteDownload(download.id)}
                      className="p-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-white/40 border border-transparent hover:border-red-500/20 transition-all"
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
        <div className="az-glass p-6 sm:p-8 rounded-3xl border border-white/10 mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">30-Day Offline Pass</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Downloaded titles remain securely playable offline for 30 days without an active connection.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Zero-Data Playback</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                Enjoy crystal-clear audio and video during flights, commutes, or power cuts without using data.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Smart Compression</h4>
              <p className="text-xs text-white/50 leading-relaxed">
                High efficiency AV1/H.265 compression preserves visual fidelity while halving file size.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Delete All Modal */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="az-glass p-8 max-w-sm w-full rounded-3xl border border-white/15 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">Delete all downloads?</h3>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              This will remove all {downloads.length} offline items from your device storage. You can re-download them anytime while your subscription or pass remains active.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  deleteAll();
                  setShowDeleteAll(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg"
              >
                Delete All
              </button>
              <button
                onClick={() => setShowDeleteAll(false)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-white/70 hover:text-white border border-white/10 hover:bg-white/5 transition-colors"
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
