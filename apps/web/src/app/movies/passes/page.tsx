'use client';
import { Suspense, lazy, useEffect, useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Skeleton, ErrorState } from '@azeebo/ui/web';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { GlowCard } from '@/components/motion/GlowCard';
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
      const res = await apiFetch('/api/v1/movies/passes/purchase', {
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader active="Movies" />

      {/* Hero */}
      <section
        className="relative py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, var(--bg-primary) 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            FilmCinema Passes
          </motion.h1>
          <motion.p
            className="text-xl text-white/80 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Unlimited access to premium movies
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Active Pass */}
        {userPass?.isActive && (
          <ScrollReveal>
            <div
              className="az-glass p-6 rounded-xl mb-10"
              style={{ border: '2px solid rgba(234,179,8,0.5)' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl"></span>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-warning-400)' }}>
                    {userPass.passName}
                  </h2>
                  <p className="text-white/50 text-sm">Active Cinema Pass</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Start Date</p>
                  <p className="text-white font-medium">
                    {new Date(userPass.startDate).toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">End Date</p>
                  <p className="text-white font-medium">
                    {new Date(userPass.endDate).toLocaleDateString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Movies Used</p>
                  <p className="text-white font-medium">
                    {userPass.moviesUsed} /{' '}
                    {userPass.moviesLimit === -1 ? '∞' : userPass.moviesLimit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Status</p>
                  <p className="font-medium" style={{ color: 'var(--color-success-500)' }}>
                    Active
                  </p>
                </div>
              </div>
              <Link href="/movies">
                <motion.button
                  type="button"
                  className="px-6 py-2 rounded-full text-sm font-semibold"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: 'var(--brand-white)',
                  }}
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
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            Choose Your Pass
          </h2>
        </ScrollReveal>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="az-glass p-6 rounded-xl">
                <Skeleton height="24px" width="120px" className="mb-4" />
                <Skeleton height="32px" width="80px" className="mb-4" />
                <Skeleton height="16px" width="100%" className="mb-2" />
                <Skeleton height="16px" width="80%" className="mb-6" />
                <div className="space-y-3 mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {passes.map((pass, index) => (
              <motion.div
                key={pass.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlowCard universe="movies" className="p-6 relative h-full flex flex-col">
                  {pass.isPopular && (
                    <span
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: 'var(--brand-orange)' }}
                    >
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-white mb-2">{pass.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-bold" style={{ color: 'var(--brand-orange)' }}>
                      ₦{pass.price.toLocaleString()}
                    </span>
                    <span className="text-white/50">/{pass.durationLabel}</span>
                  </div>
                  <p className="text-white/50 mb-6">{pass.description}</p>
                  <ul className="space-y-3 mb-6 flex-1">
                    {pass.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span style={{ color: 'var(--color-success-500)' }}></span>
                        <span className="text-white text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    type="button"
                    onClick={() => setConfirmPass(pass)}
                    disabled={purchaseMutation.isPending}
                    className={`w-full py-3 rounded-full font-semibold transition-all ${
                      pass.isPopular ? 'az-btn-primary' : ''
                    }`}
                    style={
                      pass.isPopular
                        ? undefined
                        : {
                            border: '1px solid rgba(255,255,255,0.2)',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            color: 'var(--brand-white)',
                          }
                    }
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
          <div className="text-center py-12">
            <p className="text-lg text-white/50">No cinema passes available yet</p>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmPass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setConfirmPass(null)}
        >
          <div
            className="az-glass p-8 rounded-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">Confirm Purchase</h3>
            <p className="text-white/50 mb-1">{confirmPass.name}</p>
            <p className="text-2xl font-bold mb-6" style={{ color: 'var(--brand-orange)' }}>
              ₦{confirmPass.price.toLocaleString()}
            </p>
            <div className="flex flex-col gap-3 mb-4">
              <motion.button
                type="button"
                onClick={() => purchaseMutation.mutate(confirmPass.id)}
                disabled={purchaseMutation.isPending}
                className="w-full py-3 rounded-full font-semibold transition-all az-btn-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {purchaseMutation.isPending ? 'Processing...' : 'Confirm Purchase'}
              </motion.button>
              <button
                type="button"
                onClick={() => setConfirmPass(null)}
                className="w-full py-2 rounded-full text-white/50 border border-white/10 hover:bg-white/5 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg transition-all"
          style={{
            backgroundColor:
              toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? 'var(--color-success-500)' : 'var(--color-error-500)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

const LazyPassesPage = lazy(() => Promise.resolve({ default: PassesPageContent }));

export default function PassesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--brand-near-black)]">
          <p className="text-white/50 text-lg">Loading...</p>
        </div>
      }
    >
      <LazyPassesPage />
    </Suspense>
  );
}
