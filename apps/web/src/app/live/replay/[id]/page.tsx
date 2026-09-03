'use client';
import { Suspense, lazy, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
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

function ReplayContent() {
  const params = useParams();
  const id = params?.id as string;
  useEffect(() => {
    analytics.pageView('live-replay');
  }, []);
  const query = useQuery({
    queryKey: ['live', 'replay', id],
    queryFn: async () => {
      const res = await api.request<ReplayData>(`/api/v1/live/replay/${id}`);
      if (res.success && res.data) return res.data;
      throw new Error('Not found');
    },
    enabled: !!id,
  });
  const replay = query.data;
  if (query.isLoading)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Skeleton height="400px" borderRadius="16" />
        </div>
      </div>
    );
  if (query.error || !replay)
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <ErrorState title="Replay not found" />
        </div>
      </div>
    );
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Live" />
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className="aspect-video rounded-2xl overflow-hidden mb-6"
            style={{ backgroundColor: 'black' }}
          >
            <video controls className="w-full h-full" poster={replay.streamUrl}>
              <source src={replay.streamUrl} type="video/mp4" />
            </video>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: 'var(--brand-purple)' }}
            >
              REPLAY
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'rgba(232,66,10,0.15)', color: 'var(--brand-orange)' }}
            >
              {replay.universe}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">{replay.title}</h1>
          <p className="text-white/60 mb-4">{replay.description}</p>
          <div className="flex gap-6 text-sm text-white/40 mb-6">
            <span>{new Date(replay.recordedAt).toLocaleDateString()}</span>
            <span>{replay.duration}</span>
            <span>{replay.viewCount.toLocaleString()} views</span>
          </div>
          {replay.highlights && replay.highlights.length > 0 && (
            <div className="az-glass p-6">
              <h2 className="text-lg font-bold text-white mb-3">Highlights</h2>
              <ul className="space-y-2">
                {replay.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-white/50 flex items-start gap-2">
                    <span className="text-white/30">•</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </section>
      <AppFooter />
    </div>
  );
}
const Lazy = lazy(() => Promise.resolve({ default: ReplayContent }));
export default function ReplayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <Lazy />
    </Suspense>
  );
}
