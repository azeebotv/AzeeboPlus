'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '../../../lib/api';
import { webLogger } from '../../../lib/logger';
import { ChevronLeft } from 'lucide-react';
import { OptimizedImage } from '@/components/OptimizedImage';
import PageShell from '@/components/layout/PageShell';
import PageHero from '@/components/layout/PageHero';
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
          const result = await apiFetch('/reality/supervotes', {
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
      <PageShell activeNav="Reality" maxWidth="lg">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-[3px] border-az-ink/10 border-t-az-flame" />
            <p className="mt-4 text-az-ink/60">Loading...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell activeNav="Reality" maxWidth="lg">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="text-az-ink/50 hover:text-az-ink mb-4 flex items-center gap-2 transition-colors"
        >
          <ChevronLeft size={20} aria-hidden="true" />
          Back
        </button>
        <PageHero
          title="Super Vote"
          rightElement={
            <div className="text-right">
              <p className="az-caption text-az-ink/50">Balance</p>
              <p className="az-section-title text-az-ink">₦{walletBalance.toLocaleString()}</p>
            </div>
          }
        >
          <p className="az-body-strong text-az-flame">2x Voting Power</p>
        </PageHero>
      </div>

      <div className="mb-8">
        <h2 className="az-subtitle text-az-ink mb-4">Select Contestant</h2>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          role="radiogroup"
          aria-label="Select contestant"
        >
          {contestants.map((contestant) => (
            <button
              key={contestant.id}
              type="button"
              onClick={() => setSelectedContestant(contestant.id)}
              role="radio"
              aria-checked={selectedContestant === contestant.id}
              className={`az-glass p-4 text-center transition-all ${
                selectedContestant === contestant.id ? 'outline-2 outline-az-flame' : ''
              }`}
            >
              <OptimizedImage
                src={contestant.avatar}
                alt={contestant.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
              />
              <h3 className="az-body-strong text-az-ink mb-1">{contestant.name}</h3>
              <p className="az-caption text-az-ink/50">
                Rank #{contestant.rank} • {contestant.votes.toLocaleString()} votes
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="az-subtitle text-az-ink mb-4">Select Vote Package</h2>
        <div className="space-y-3" role="radiogroup" aria-label="Select vote package">
          {votePackages.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedPackage(pkg.id)}
              role="radio"
              aria-checked={selectedPackage === pkg.id}
              className={`w-full az-glass p-4 text-left transition-all relative ${
                selectedPackage === pkg.id ? 'outline-2 outline-az-flame' : ''
              }`}
            >
              {pkg.isPopular && (
                <span className="az-overline absolute -top-3 right-4 rounded-az-pill bg-az-flame px-3 py-1 text-az-surface-root">
                  Most Popular
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="az-subtitle text-az-ink">{pkg.name}</h3>
                  <p className="az-caption text-az-ink/50">{pkg.description}</p>
                </div>
                <p className="az-section-title text-az-flame">₦{pkg.price.toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleVote}
        disabled={!selectedContestant || !selectedPackage || isVoting}
        className="transition-all az-btn-primary"
      >
        {isVoting ? 'Processing...' : 'Vote Submit Super Vote'}
      </button>
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        destructive={confirmDialog.destructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </PageShell>
  );
}
