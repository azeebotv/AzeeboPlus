'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import analytics from '@/lib/analytics';

interface ReplayData {
  id: string;
  title: string;
  description: string;
  universe: string;
  recordedAt: string;
  duration: string;
  viewCount: number;
  streamUrl: string;
  highlights?: string[];
}

interface LiveEventData {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  scheduledAt: string;
  duration: number;
  status: string;
  replayUrl?: string;
}

/** Map a live event (with a replay) onto the replay page shape. */
function toReplayData(e: LiveEventData): ReplayData {
  const mins = e.duration;
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? '',
    universe: 'African Originals',
    recordedAt: e.scheduledAt,
    duration: mins ? `${Math.round(mins / 60)} min` : '—',
    viewCount: 0,
    streamUrl: e.replayUrl ?? '',
  };
}

function ReplayContent() {
  const params = useParams();
  const id = params?.id as string;
  useEffect(() => {
    analytics.pageView('live-replay');
  }, []);
  const query = useQuery({
    queryKey: ['live', 'replay', id],
    queryFn: async () => {
      // Replays are live events whose replayUrl is set; there is no separate
      // replay endpoint upstream (the old /live/replay/:id never existed).
      const res = await api.request<LiveEventData>(`/api/v1/live-events/${id}`);
      if (res.success && res.data) return toReplayData(res.data);
      throw new Error('Not found');
    },
    enabled: !!id,
  });
  const replay = query.data;
  if (query.isLoading)
    return (
      <PageShell activeNav="Live" maxWidth="xl" showFooter={false}>
        <Skeleton height="400px" borderRadius="16" />
      </PageShell>
    );
  if (query.error || !replay)
    return (
      <PageShell activeNav="Live" maxWidth="xl" showFooter={false}>
        <ErrorState title="Replay not found" />
      </PageShell>
    );
  return (
    <PageShell activeNav="Live" maxWidth="xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 aspect-video overflow-hidden rounded-az-panel bg-black">
          <video controls className="h-full w-full" poster={replay.streamUrl}>
            <source src={replay.streamUrl} type="video/mp4" />
          </video>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <span className="az-overline rounded-az-pill bg-[var(--brand-purple)]/15 px-3 py-1 text-[var(--brand-purple)]">
            REPLAY
          </span>
          <span className="rounded-az-pill bg-az-scarlet/20 px-3 py-1 text-xs font-semibold text-az-flame">
            {replay.universe}
          </span>
        </div>
        <h1 className="az-heading mb-3 text-az-ink">{replay.title}</h1>
        <p className="az-body mb-4 text-az-ink/60">{replay.description}</p>
        <div className="az-caption mb-6 flex gap-6 text-az-ink-muted">
          <span>{new Date(replay.recordedAt).toLocaleDateString()}</span>
          <span>{replay.duration}</span>
          <span>{replay.viewCount.toLocaleString()} views</span>
        </div>
        {replay.highlights && replay.highlights.length > 0 && (
          <div className="az-glass p-6">
            <h2 className="mb-3 text-lg font-bold text-az-ink">Highlights</h2>
            <ul className="space-y-2">
              {replay.highlights.map((h, i) => (
                <li key={i} className="az-body flex items-start gap-2 text-az-ink-muted">
                  <span aria-hidden="true" className="text-az-ink/30">
                    •
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </PageShell>
  );
}
const Lazy = lazy(() => Promise.resolve({ default: ReplayContent }));
export default function ReplayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
