'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import { OptimizedImage } from '@/components/OptimizedImage';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';

interface Contestant {
  id: string;
  name: string;
  avatar: string;
  votes: number;
  rank: number;
}

interface VotePackage {
  id: string;
  name: string;
  votes: number;
  price: number;
  description: string;
  isPopular: boolean;
}

export default function SuperVotePage(): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const episodeId = searchParams.get('episodeId') || '';
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [votePackages, setVotePackages] = useState<VotePackage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    const fetchVotePackages = async () => {
      try {
        const response = await apiFetch<VotePackage[]>('/v1/pricing/vote-packages/superVote');
        if (response.success && response.data) {
          setVotePackages(
            response.data.map((pkg, index) => ({
              ...pkg,
              name: pkg.name || `${pkg.votes} Super Votes`,
              description: pkg.description || `${pkg.votes} votes at 2x power`,
              isPopular: pkg.isPopular || index === 1,
            }))
          );
        }
      } catch (err) {
        // On API failure, show error state instead of hardcoded prices
        webLogger.error('Failed to fetch vote packages', err);
        setVotePackages([]);
      }
    };
    fetchVotePackages();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!episodeId) {
          setIsLoading(false);
          return;
        }
        const [contestantsResult, walletResult] = await Promise.all([
          apiFetch<Contestant[]>(`/v1/content/${episodeId}/contestants`),
          apiFetch<{ balance: number }>('/v1/wallet'),
        ]);
        if (contestantsResult.success && contestantsResult.data)
          setContestants(Array.isArray(contestantsResult.data) ? contestantsResult.data : []);
        if (walletResult.success && walletResult.data) {
          const balance =
            typeof walletResult.data === 'object' && 'balance' in walletResult.data
              ? (walletResult.data as { balance: number }).balance
              : 0;
          setWalletBalance(balance || 0);
        }
      } catch (error) {
        webLogger.error('Failed to load data', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [episodeId]);

  const handleVote = async (): Promise<void> => {
    if (!selectedContestant || !selectedPackage) {
      toast.showToast('Please select a contestant and vote package', 'error');
      return;
    }
    const pkg = votePackages.find((p) => p.id === selectedPackage);
    if (!pkg) return;
    if (walletBalance < pkg.price) {
      setConfirmDialog({
        open: true,
        title: 'Insufficient Balance',
        message: `You need ₦${pkg.price.toLocaleString()} but your balance is ₦${walletBalance.toLocaleString()}. Add funds?`,
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          router.push('/wallet/add-funds');
        },
      });
      return;
    }
    setConfirmDialog({
      open: true,
      title: 'Confirm Purchase',
      message: `Purchase ${pkg.votes} Super Vote(s) for ₦${pkg.price.toLocaleString()}?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setIsVoting(true);
        try {
          const result = await apiFetch('/v1/content/super-vote', {
            method: 'POST',
            body: JSON.stringify({
              contestantId: selectedContestant,
              episodeId,
              voteCount: pkg.votes,
            }),
          });
          if (!result.success) throw new Error(result.message || 'Failed to submit super vote');
          toast.showToast(
            `Your ${pkg.votes} Super Vote(s) submitted! Each counts as 2x.`,
            'success'
          );
          setSelectedContestant(null);
          setSelectedPackage(null);
        } catch (error: unknown) {
          toast.showToast(
            error instanceof Error ? error.message : 'Failed to submit super vote',
            'error'
          );
        } finally {
          setIsVoting(false);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
        <AppHeader />
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 200px)' }}
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{ border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--brand-orange)' }}
            />
            <p className="mt-4 text-white/60">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-near-black)' }}>
      <AppHeader />
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-white/50 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Super Vote</h1>
              <p className="mt-1" style={{ color: 'var(--brand-orange)' }}>
                2x Voting Power
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/50">Balance</p>
              <p className="text-2xl font-bold text-white">₦{walletBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Select Contestant</h2>
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            role="radiogroup"
            aria-label="Select contestant"
          >
            {contestants.map((contestant) => (
              <button
                key={contestant.id}
                onClick={() => setSelectedContestant(contestant.id)}
                role="radio"
                aria-checked={selectedContestant === contestant.id}
                className={`az-glass p-4 text-center transition-all rounded-xl ${
                  selectedContestant === contestant.id ? 'ring-2' : ''
                }`}
                style={
                  selectedContestant === contestant.id
                    ? { borderColor: 'var(--brand-orange)', boxShadow: '0 0 20px rgba(232,66,10,0.3)' }
                    : undefined
                }
              >
                <OptimizedImage
                  src={contestant.avatar}
                  alt={contestant.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                />
                <h3 className="text-sm font-semibold text-white mb-1">{contestant.name}</h3>
                <p className="text-xs text-white/50">
                  Rank #{contestant.rank} • {contestant.votes.toLocaleString()} votes
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Select Vote Package</h2>
          <div className="space-y-3" role="radiogroup" aria-label="Select vote package">
            {votePackages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                role="radio"
                aria-checked={selectedPackage === pkg.id}
                className={`w-full az-glass p-4 text-left transition-all relative rounded-xl ${
                  selectedPackage === pkg.id ? 'ring-2' : ''
                }`}
                style={
                  selectedPackage === pkg.id
                    ? { boxShadow: '0 0 20px rgba(232,66,10,0.3)' }
                    : undefined
                }
              >
                {pkg.isPopular && (
                  <span
                    className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: 'var(--brand-orange)' }}
                  >
                    Most Popular
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                    <p className="text-sm text-white/50">{pkg.description}</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--brand-orange)' }}>
                    ₦{pkg.price.toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleVote}
          disabled={!selectedContestant || !selectedPackage || isVoting}
          className="w-full py-4 rounded-full font-semibold text-lg transition-all az-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVoting ? 'Processing...' : '🗳 Submit Super Vote'}
        </button>
      </div>
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
      <AppFooter />
    </div>
  );
}
