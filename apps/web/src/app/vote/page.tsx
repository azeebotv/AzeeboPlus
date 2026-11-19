'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHero } from '@/components/layout/PageHero';
import { PageShell } from '@/components/layout/PageShell';
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
    <PageShell activeNav="Reality" maxWidth="xl">
      <PageHero
        eyebrow="Reality"
        title="Reality Show Voting"
        description="Support your favorite contestants and decide who advances to the next round."
      />

      {isSuccess ? (
        <div
          role="status"
          className="az-glass animate-fadeIn mx-auto my-8 max-w-lg p-8 text-center sm:p-12"
        >
          <h2 className="az-heading mb-4 text-az-ink">Vote Submitted!</h2>
          <p className="az-body mb-6 text-az-ink-muted">
            You cast <strong className="text-az-flame">{totalVotes} votes</strong> for{' '}
            <strong>{selectedContestant?.name}</strong>.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setIsSuccess(false)}
              className="az-body-strong rounded-az-pill border border-az-ink/30 bg-az-ink/20 px-6 py-2.5 text-az-ink transition-all hover:bg-az-ink/30"
            >
              Vote Again
            </button>
            <button
              onClick={() => router.push('/reality/results')}
              className="az-btn-primary az-btn-primary--inline"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left 2 Cols: Contestants & Shows */}
          <div className="space-y-6 lg:col-span-2">
            {/* Show Selector */}
            {shows.length > 1 && (
              <div className="az-glass p-5">
                <label className="az-label">Select Show</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {shows.map((show) => (
                    <button
                      key={show.id}
                      onClick={() => {
                        setSelectedShowId(show.id);
                        setSelectedContestant(null);
                      }}
                      aria-pressed={selectedShowId === show.id}
                      className={`rounded-az-control px-4 py-2 az-body whitespace-nowrap transition-all ${
                        selectedShowId === show.id
                          ? 'bg-az-flame text-az-surface-root shadow-az-glow'
                          : 'bg-az-glass-fill text-az-ink/70 hover:bg-az-glass-card'
                      }`}
                    >
                      {show.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contestants List */}
            <div className="az-glass p-6">
              <h3 className="az-title mb-4 text-az-ink">Choose a Contestant</h3>

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
                <div
                  role="radiogroup"
                  aria-label="Choose a contestant"
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {contestants.map((c) => {
                    const isSelected = selectedContestant?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => setSelectedContestant(c)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedContestant(c);
                          }
                        }}
                        className={`relative cursor-pointer rounded-az-card border p-3 text-center transition-all ${
                          isSelected
                            ? 'scale-102 border-az-flame bg-az-flame/10 shadow-az-glow'
                            : 'border-az-ink/5 bg-az-ink/[0.02] hover:bg-az-ink/[0.06]'
                        }`}
                      >
                        <div className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-az-ink/20">
                          {c.avatar ? (
                            <OptimizedImage
                              src={c.avatar}
                              alt={c.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-az-glass-card az-title text-az-ink">
                              {c.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <h4 className="az-body-strong truncate text-az-ink">{c.name}</h4>
                        {c.votes !== undefined && (
                          <p className="az-caption mt-1 text-az-flame">
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
            <div className="az-glass sticky top-24 p-6">
              <h3 className="az-title mb-4 text-az-ink">Select Vote Package</h3>

              <div role="radiogroup" aria-label="Select vote package" className="space-y-3 mb-6">
                {VOTE_PACKAGES.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => setSelectedPackage(pkg)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedPackage(pkg);
                        }
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-az-control border p-3.5 transition-all ${
                        isSelected
                          ? 'border-az-flame bg-az-flame/15'
                          : 'border-az-ink/5 bg-az-ink/[0.02] hover:bg-az-ink/[0.06]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="az-body-strong text-az-ink">{pkg.label}</span>
                          {pkg.popular && (
                            <span className="az-micro-label rounded-az-pill bg-az-flame px-2 py-0.5 uppercase text-az-surface-root">
                              Popular
                            </span>
                          )}
                        </div>
                        <span className="az-caption text-az-ink-muted">
                          {pkg.votes} votes total
                        </span>
                      </div>
                      <span className="az-body-strong text-az-flame">
                        ₦{pkg.price.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quantity */}
              <div className="mb-4 flex items-center justify-between border-t border-az-glass-border py-3">
                <span className="az-body text-az-ink-muted">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex size-8 items-center justify-center rounded-az-control bg-az-glass-card az-body-strong text-az-ink hover:bg-az-ink/20"
                  >
                    -
                  </button>
                  <span aria-live="polite" className="az-body-strong w-6 text-center text-az-ink">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="flex size-8 items-center justify-center rounded-az-control bg-az-glass-card az-body-strong text-az-ink hover:bg-az-ink/20"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6 space-y-2 border-t border-az-glass-border py-3">
                <div className="az-body flex justify-between text-az-ink-muted">
                  <span>Total Votes:</span>
                  <span className="az-body-strong text-az-ink">{totalVotes}</span>
                </div>
                <div className="az-body flex justify-between text-az-ink-muted">
                  <span>Wallet Balance:</span>
                  <span className="az-body-strong text-az-ink">
                    ₦{currentBalance.toLocaleString()}
                  </span>
                </div>
                <div className="az-body-strong flex justify-between border-t border-az-ink/5 pt-2 text-az-ink">
                  <span>Total Cost:</span>
                  <span className="text-az-flame">₦{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {!isAuthenticated ? (
                <button
                  onClick={() => router.push('/auth/login')}
                  className="az-btn-primary hover:scale-102"
                >
                  Log In to Vote
                </button>
              ) : !canAfford ? (
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/wallet/add-funds')}
                    className="az-body-strong w-full rounded-az-pill bg-az-scarlet py-3.5 text-center text-az-ink transition-all hover:bg-az-scarlet/90"
                  >
                    Insufficient Balance — Add Funds
                  </button>
                  <p className="az-caption text-center text-az-ink-muted">
                    You need ₦{(totalPrice - currentBalance).toLocaleString()} more
                  </p>
                </div>
              ) : (
                <button
                  disabled={!selectedContestant || voteMutation.isPending}
                  onClick={() => voteMutation.mutate()}
                  className="az-btn-primary hover:scale-102"
                >
                  {voteMutation.isPending ? 'Submitting Votes...' : `Cast ${totalVotes} Votes`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
