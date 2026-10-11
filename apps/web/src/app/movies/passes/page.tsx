'use client';
import { Suspense, lazy, useEffect, useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
import { Ticket, Check } from 'lucide-react';
import analytics from '@/lib/analytics';

interface CinemaPass {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  durationLabel: string;
  features: string[];
  isPopular?: boolean;
  moviesIncluded: number;
  validFor: string;
}

interface UserPass {
  passId: string;
  passName: string;
  startDate: string;
  endDate: string;
  moviesUsed: number;
  moviesLimit: number;
  isActive: boolean;
}

/* `.az-btn-primary` is unlayered, so it always beats a utility on the same
   element: the filled and outlined CTA variants therefore live in two separate
   class strings instead of one conditional `className`. */
function passCtaClass(isPopular: boolean): string {
  return isPopular
    ? 'az-btn-primary transition-all'
    : 'az-chip az-body-strong w-full px-6 py-2 text-az-ink transition-all';
}

function PassesPageContent(): React.JSX.Element {
  const queryClient = useQueryClient();
  const [confirmPass, setConfirmPass] = useState<CinemaPass | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    analytics.pageView('movies-passes');
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const passesQuery = useQuery({
    queryKey: ['cinema-passes'],
    queryFn: async () => {
      const res = await apiFetch<CinemaPass[]>('/api/v1/movies/passes');
      if (res.success && res.data) return res.data;
      throw new Error(res.message || 'Failed to load cinema passes');
    },
    staleTime: 300000,
  });

  const userPassQuery = useQuery({
    queryKey: ['user-cinema-pass'],
    queryFn: async () => {
      const res = await apiFetch<UserPass>('/api/v1/movies/passes/current');
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: 60000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (passId: string) => {
      const res = await apiFetch('/api/v1/movies/passes/subscribe', {
        method: 'POST',
        body: JSON.stringify({ passId }),
      });
      if (res.success) return res.data;
      throw new Error(res.message || 'Failed to purchase pass');
    },
    onSuccess: () => {
      setToast({ message: 'Cinema pass purchased successfully!', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['cinema-passes'] });
      queryClient.invalidateQueries({ queryKey: ['user-cinema-pass'] });
      setConfirmPass(null);
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  const passes: CinemaPass[] = passesQuery.data ?? [];
  const userPass = userPassQuery.data ?? null;
  const isLoading = passesQuery.isLoading;
  const error = passesQuery.error?.message;

  return (
    <PageShell activeNav="Movies" maxWidth="7xl">
      <PageHero
        title="FilmCinema Passes"
        subtitle="Unlimited access to premium movies"
        glowColor="color-mix(in srgb, var(--color-az-warning-500) 18%, transparent)"
      />

      {/* Active Pass */}
      {userPass?.isActive && (
        <ScrollReveal>
          <div className="mb-10 rounded-az-panel border-2 border-az-warning-500/50 bg-az-glass-card p-6 shadow-az-lifted backdrop-blur-[var(--blur-az-glass)]">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex size-14 flex-shrink-0 items-center justify-center rounded-az-panel border border-az-warning-500/30 bg-az-warning-500/15 text-az-warning-400 shadow-lg shadow-az-warning-500/10">
                <Ticket size={28} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div>
                <h2 className="az-title text-az-warning-400">{userPass.passName}</h2>
                <p className="az-caption text-az-ink-muted">Active Cinema Pass</p>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="az-micro-label mb-1 text-az-ink/40">Start Date</p>
                <p className="az-body-strong text-az-ink">
                  {new Date(userPass.startDate).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="az-micro-label mb-1 text-az-ink/40">End Date</p>
                <p className="az-body-strong text-az-ink">
                  {new Date(userPass.endDate).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="az-micro-label mb-1 text-az-ink/40">Movies Used</p>
                <p className="az-body-strong text-az-ink">
                  {userPass.moviesUsed} / {userPass.moviesLimit === -1 ? '∞' : userPass.moviesLimit}
                </p>
              </div>
              <div>
                <p className="az-micro-label mb-1 text-az-ink/40">Status</p>
                <p className="az-body-strong text-az-success-500">Active</p>
              </div>
            </div>
            <Link href="/movies">
              <motion.button
                type="button"
                className="az-chip az-body-strong px-6 py-2 text-az-ink transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse Movies
              </motion.button>
            </Link>
          </div>
        </ScrollReveal>
      )}

      {/* Pass Plans */}
      <ScrollReveal>
        <h2 className="az-section-title mb-6 text-az-ink sm:mb-8">Choose Your Pass</h2>
      </ScrollReveal>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="az-glass p-6">
              <Skeleton height="24px" width="120px" className="mb-4" />
              <Skeleton height="32px" width="80px" className="mb-4" />
              <Skeleton height="16px" width="100%" className="mb-2" />
              <Skeleton height="16px" width="80%" className="mb-6" />
              <div className="mb-6 space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} height="14px" width="90%" />
                ))}
              </div>
              <Skeleton height="40px" borderRadius="999px" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load cinema passes"
          description={error}
          onButtonPress={() => passesQuery.refetch()}
        />
      ) : passes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {passes.map((pass, index) => (
            <motion.div
              key={pass.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlowCard universe="movies" className="relative flex h-full flex-col p-6">
                {pass.isPopular && (
                  <span className="az-body absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-az-pill bg-az-flame px-4 py-1 text-az-ink">
                    Most Popular
                  </span>
                )}
                <h3 className="az-title mb-2 text-az-ink">{pass.name}</h3>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="az-heading text-az-flame">₦{pass.price.toLocaleString()}</span>
                  <span className="az-body text-az-ink/50">/{pass.durationLabel}</span>
                </div>
                <p className="az-body mb-6 text-az-ink-muted">{pass.description}</p>
                <ul className="mb-6 flex-1 space-y-3">
                  {pass.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check size={16} className="flex-shrink-0 text-az-success-400" />
                      <span className="az-body text-az-ink">{feature}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  type="button"
                  onClick={() => setConfirmPass(pass)}
                  disabled={purchaseMutation.isPending}
                  className={passCtaClass(!!pass.isPopular)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Get Pass
                </motion.button>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="az-lead text-az-ink/50">No cinema passes available yet</p>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmPass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setConfirmPass(null)}
        >
          <div
            className="az-glass w-full max-w-sm p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm Purchase"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="az-subtitle mb-2 text-az-ink">Confirm Purchase</h3>
            <p className="az-body mb-1 text-az-ink-muted">{confirmPass.name}</p>
            <p className="az-title mb-6 text-az-flame">₦{confirmPass.price.toLocaleString()}</p>
            <div className="mb-4 flex flex-col gap-3">
              <motion.button
                type="button"
                onClick={() => purchaseMutation.mutate(confirmPass.id)}
                disabled={purchaseMutation.isPending}
                className="az-btn-primary transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
              </motion.button>
              <button
                type="button"
                onClick={() => setConfirmPass(null)}
                className="az-body w-full rounded-az-pill border border-az-glass-border px-4 py-2 text-az-ink-muted transition-colors hover:bg-az-glass-fill"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-az-panel border px-6 py-3 shadow-az-lifted ${
            toast.type === 'success'
              ? 'border-az-success-500/30 bg-az-success-500/15 text-az-success-500'
              : 'border-az-error-500/30 bg-az-error-500/15 text-az-error-500'
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </PageShell>
  );
}

const LazyPassesPage = lazy(() => Promise.resolve({ default: PassesPageContent }));

export default function PassesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-az-surface-root">
          <p className="az-lead text-az-ink-muted">Loading...</p>
        </div>
      }
    >
      <LazyPassesPage />
    </Suspense>
  );
}
