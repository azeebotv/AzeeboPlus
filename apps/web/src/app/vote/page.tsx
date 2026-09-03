'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@azeebo/ui/web';
import { OptimizedImage } from '@/components/OptimizedImage';
import { useToast } from '@/components/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';

interface RealityContestant {
  id: string;
  name: string;
  avatar?: string;
  votes?: number;
  rank?: number;
  bio?: string;
}

interface RealityShow {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  contestants?: RealityContestant[];
}

const VOTE_PACKAGES = [
  { id: 'single', label: '1 Vote', votes: 1, price: 100, popular: false },
  { id: 'bronze', label: '5 Votes', votes: 5, price: 450, popular: false },
  { id: 'silver', label: '20 Votes', votes: 20, price: 1600, popular: true },
  { id: 'gold', label: '50 Votes', votes: 50, price: 3500, popular: false },
  { id: 'super', label: '100 Votes (Super)', votes: 100, price: 6000, popular: false },
];

export default function VotePage(): React.JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { balance } = useWallet();
  const queryClient = useQueryClient();

  const showId = searchParams.get('showId') || '';
  const preselectedContestantId = searchParams.get('contestantId') || '';

  const [selectedShowId, setSelectedShowId] = useState<string>(showId);
  const [selectedContestant, setSelectedContestant] = useState<RealityContestant | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(VOTE_PACKAGES[2]);
  const [quantity, setQuantity] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: shows = [] } = useQuery({
    queryKey: ['reality', 'shows'],
    queryFn: async () => {
      const res = await apiFetch<RealityShow[] | { items: RealityShow[] }>('/v1/reality/shows');
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      return [];
    },
  });

  useEffect(() => {
    if (!selectedShowId && shows.length > 0) {
      setSelectedShowId(shows[0].id);
    }
  }, [shows, selectedShowId]);

  const { data: contestants = [], isLoading: contestantsLoading } = useQuery({
    queryKey: ['reality', 'show', selectedShowId, 'contestants'],
    queryFn: async () => {
      if (!selectedShowId) return [];
      const res = await apiFetch<RealityContestant[] | { items: RealityContestant[] }>(
        `/v1/reality/shows/${selectedShowId}/contestants`
      );
      if (res.success && res.data) {
        return Array.isArray(res.data) ? res.data : res.data.items || [];
      }
      return [];
    },
    enabled: !!selectedShowId,
  });

  useEffect(() => {
    if (preselectedContestantId && contestants.length > 0) {
      const found = contestants.find((c) => c.id === preselectedContestantId);
      if (found) setSelectedContestant(found);
    } else if (contestants.length > 0 && !selectedContestant) {
      setSelectedContestant(contestants[0]);
    }
  }, [contestants, preselectedContestantId, selectedContestant]);

  const totalVotes = selectedPackage.votes * quantity;
  const totalPrice = selectedPackage.price * quantity;
  const currentBalance = balance?.balance ?? 0;
  const canAfford = currentBalance >= totalPrice;

  const voteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContestant) throw new Error('Please select a contestant');
      const isSuper = selectedPackage.id === 'super';
      const res = await apiFetch('/v1/reality/vote', {
        method: 'POST',
        body: JSON.stringify({
          showId: selectedShowId,
          contestantId: selectedContestant.id,
          votes: totalVotes,
          isSuperVote: isSuper,
          amount: totalPrice,
        }),
      });
      if (!res.success) {
        throw new Error(res.message || 'Failed to submit vote');
      }
      return res.data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.showToast(
        `Successfully cast ${totalVotes} votes for ${selectedContestant?.name}!`,
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['reality'] });
    },
    onError: (err: Error) => {
      toast.showToast(err.message || 'Vote failed', 'error');
    },
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--brand-near-black)', color: 'var(--text-primary)' }}
    >
      <AppHeader active="Reality" />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Reality Show Voting
          </h1>
          <p className="text-white/60 text-base">
            Support your favorite contestants and decide who advances to the next round.
          </p>
        </div>

        {isSuccess ? (
          <div className="az-glass p-8 sm:p-12 rounded-3xl text-center max-w-lg mx-auto my-8 animate-fadeIn">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Vote Submitted!</h2>
            <p className="text-white/70 mb-6">
              You cast <strong className="text-[var(--brand-orange)]">{totalVotes} votes</strong>{' '}
              for <strong>{selectedContestant?.name}</strong>.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsSuccess(false)}
                className="px-6 py-2.5 rounded-full font-semibold text-white bg-white/10 hover:bg-white/20 transition-all"
              >
                Vote Again
              </button>
              <button
                onClick={() => router.push('/reality/results')}
                className="px-6 py-2.5 rounded-full font-semibold text-white transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
                }}
              >
                View Leaderboard
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Contestants & Shows */}
            <div className="lg:col-span-2 space-y-6">
              {/* Show Selector */}
              {shows.length > 1 && (
                <div className="az-glass p-5 rounded-2xl">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
                    Select Show
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {shows.map((show) => (
                      <button
                        key={show.id}
                        onClick={() => {
                          setSelectedShowId(show.id);
                          setSelectedContestant(null);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                          selectedShowId === show.id
                            ? 'bg-[var(--brand-orange)] text-white shadow-lg'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {show.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contestants List */}
              <div className="az-glass p-6 rounded-3xl">
                <h3 className="text-lg font-bold text-white mb-4">Choose a Contestant</h3>

                {contestantsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} height="140px" borderRadius="16px" />
                    ))}
                  </div>
                ) : contestants.length === 0 ? (
                  <EmptyState
                    icon="users"
                    title="No contestants available for this show"
                    description="Check back later for contestants"
                    dark
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {contestants.map((c) => {
                      const isSelected = selectedContestant?.id === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelectedContestant(c)}
                          className={`relative p-3 rounded-2xl cursor-pointer transition-all border text-center ${
                            isSelected
                              ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)]/10 shadow-lg scale-102'
                              : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="relative w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-2 border-white/20">
                            {c.avatar ? (
                              <OptimizedImage
                                src={c.avatar}
                                alt={c.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-white/10 text-xl font-bold text-white">
                                {c.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white truncate">{c.name}</h4>
                          {c.votes !== undefined && (
                            <p className="text-xs text-[var(--brand-orange)] font-medium mt-1">
                              {c.votes.toLocaleString()} votes
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Package Selector & Checkout */}
            <div className="space-y-6">
              <div className="az-glass p-6 rounded-3xl sticky top-24">
                <h3 className="text-lg font-bold text-white mb-4">Select Vote Package</h3>

                <div className="space-y-3 mb-6">
                  {VOTE_PACKAGES.map((pkg) => {
                    const isSelected = selectedPackage.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                          isSelected
                            ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)]/15'
                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{pkg.label}</span>
                            {pkg.popular && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[var(--brand-orange)] text-white uppercase">
                                Popular
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/50">{pkg.votes} votes total</span>
                        </div>
                        <span className="text-sm font-bold text-[var(--brand-orange)]">
                          ₦{pkg.price.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between py-3 border-t border-white/10 mb-4">
                  <span className="text-sm text-white/70">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center hover:bg-white/20"
                    >
                      -
                    </button>
                    <span className="font-bold text-white w-6 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center hover:bg-white/20"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2 py-3 border-t border-white/10 text-sm mb-6">
                  <div className="flex justify-between text-white/60">
                    <span>Total Votes:</span>
                    <span className="font-semibold text-white">{totalVotes}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Wallet Balance:</span>
                    <span className="font-semibold text-white">
                      ₦{currentBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/5">
                    <span>Total Cost:</span>
                    <span className="text-[var(--brand-orange)]">
                      ₦{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="w-full py-3.5 rounded-full font-bold text-white text-center transition-all hover:scale-102"
                    style={{
                      background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
                    }}
                  >
                    Log In to Vote
                  </button>
                ) : !canAfford ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push('/wallet/add-funds')}
                      className="w-full py-3.5 rounded-full font-bold text-white text-center transition-all bg-red-500 hover:bg-red-600"
                    >
                      Insufficient Balance — Add Funds
                    </button>
                    <p className="text-xs text-center text-white/40">
                      You need ₦{(totalPrice - currentBalance).toLocaleString()} more
                    </p>
                  </div>
                ) : (
                  <button
                    disabled={!selectedContestant || voteMutation.isPending}
                    onClick={() => voteMutation.mutate()}
                    className="w-full py-3.5 rounded-full font-bold text-white text-center transition-all hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, var(--brand-orange), var(--brand-red))',
                    }}
                  >
                    {voteMutation.isPending ? 'Submitting Votes...' : `Cast ${totalVotes} Votes`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
